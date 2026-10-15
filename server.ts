import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import { handlePortfolioRequest } from './src/server/portfolioApi.ts';

const PORT = Number(process.env.PORT ?? 3000);
const RATE_LIMIT = { requests: 20, windowMs: 10 * 60 * 1000 };
const CONTACT_RATE_LIMIT = { requests: 8, windowMs: 10 * 60 * 1000 };
const INBOX_PATH = path.join(import.meta.dirname, 'data', 'inbox.json');

const requestLog = new Map<string, number[]>();
const contactLog = new Map<string, number[]>();

function hitLimit(store: Map<string, number[]>, ip: string, limit: { requests: number; windowMs: number }): boolean {
  const now = Date.now();
  const recent = (store.get(ip) ?? []).filter((time) => now - time < limit.windowMs);
  recent.push(now);
  store.set(ip, recent);
  return recent.length > limit.requests;
}

async function appendInbox(entry: {
  at: string;
  name: string;
  email: string;
  message: string;
  source: 'form' | 'agent';
}) {
  await fs.mkdir(path.dirname(INBOX_PATH), { recursive: true });
  let items: unknown[] = [];
  try {
    const raw = await fs.readFile(INBOX_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    items = [];
  }
  items.push(entry);
  await fs.writeFile(INBOX_PATH, JSON.stringify(items, null, 2), 'utf8');
}

function toFetchRequest(req: express.Request): Request {
  const origin = `${req.protocol}://${req.get('host') ?? 'localhost'}`;
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(name, value);
    else if (Array.isArray(value)) headers.set(name, value.join(', '));
  }
  const method = req.method;
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? JSON.stringify(req.body ?? {}) : undefined;
  if (hasBody && !headers.has('content-type')) headers.set('content-type', 'application/json');
  return new Request(`${origin}${req.originalUrl}`, { method, headers, body });
}

async function sendFetchResponse(res: express.Response, response: Response) {
  res.status(response.status);
  response.headers.forEach((value, name) => {
    res.setHeader(name, value);
  });
  res.send(Buffer.from(await response.arrayBuffer()));
}

async function startServer() {
  process.env.PORTFOLIO_EXPRESS = '1';
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '64kb' }));

  app.use(async (req, res, next) => {
    try {
      const handled = await handlePortfolioRequest(toFetchRequest(req), {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GEMINI_MODELS: process.env.GEMINI_MODELS,
        appendInbox,
        allowChat: (ip) => !hitLimit(requestLog, ip, RATE_LIMIT),
        allowContact: (ip) => !hitLimit(contactLog, ip, CONTACT_RATE_LIMIT)
      });
      if (!handled) {
        next();
        return;
      }
      await sendFetchResponse(res, handled);
    } catch (error) {
      next(error);
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(import.meta.dirname, 'dist', 'client');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
