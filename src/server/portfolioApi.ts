import {
  generateLlmsTxt,
  generateRobotsTxt,
  generateSitemapXml
} from '../data/machineDocuments.ts';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData.ts';
import type { ChatAction, ChatResponse } from '../utils/chat.ts';
import {
  buildSystemPrompt,
  buildUserPrompt,
  ChatRequestSchema,
  ContactRequestSchema,
  isSafeReply
} from './assistant.ts';

const MAX_BODY = 64 * 1024;
const DEFAULT_MODELS = 'gemini-flash-latest,gemini-flash-lite-latest';

type InboxEntry = {
  at: string;
  name: string;
  email: string;
  message: string;
  source: 'form' | 'agent';
};

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
};

export type PortfolioBindings = {
  GEMINI_API_KEY?: string;
  GEMINI_MODELS?: string;
  INBOX?: { put(key: string, value: string): Promise<void> };
  CHAT_LIMIT?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
  CONTACT_LIMIT?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

const ALLOWED_CHAT_ORIGINS = new Set(['https://pherls.dev', 'http://localhost', 'http://127.0.0.1']);

function isAllowedChatOrigin(request: Request): boolean {
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
    return false;
  }
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const reqOrigin = new URL(request.url).origin;
    return parsed.origin === reqOrigin || ALLOWED_CHAT_ORIGINS.has(`${parsed.protocol}//${parsed.hostname}`);
  } catch {
    return false;
  }
}

function hasJsonContentType(request: Request): boolean {
  const ct = request.headers.get('content-type') ?? '';
  return ct.toLowerCase().includes('application/json');
}

function json(status: number, body: unknown, extra: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...SECURITY_HEADERS,
      ...extra
    }
  });
}

function text(status: number, body: string, contentType: string): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': contentType,
      ...SECURITY_HEADERS
    }
  });
}

function clientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

async function allowed(
  limiter: PortfolioBindings['CHAT_LIMIT'] | undefined,
  key: string
): Promise<boolean> {
  if (!limiter) return true;
  const { success } = await limiter.limit({ key });
  return success;
}

type JsonBody = { ok: true; value: unknown } | { ok: false; status: 400 | 413 };

async function readJsonBody(request: Request): Promise<JsonBody> {
  if (!request.body) return { ok: false, status: 400 };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel().catch(() => {});
      return { ok: false, status: 413 };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, status: 400 };
  }
}

const BODY_ERRORS = { 400: 'JSON inválido.', 413: 'Pedido grande demais.' } as const;

function inferContextualActions(userQuery: string, replyText: string): ChatAction[] {
  const combined = `${userQuery} ${replyText}`.toLowerCase();
  const actions: ChatAction[] = [];
  const mentions = (...terms: string[]) => terms.some((term) => combined.includes(term));

  if (mentions('experi', 'carreira', 'trabalh', 'atlas', 'nelogica', 'lebes')) {
    actions.push({ label: 'Ver experiência', type: 'navigate', value: '#experiencia' });
  }
  if (mentions('projet', 'ferramenta', 'site', 'gymkhana')) {
    actions.push({ label: 'Ver projetos', type: 'navigate', value: '#projeto' });
  }
  if (mentions('certifica', 'formação', 'formacao', 'idioma', 'stack')) {
    actions.push({ label: 'Ver formação e stack', type: 'navigate', value: '#formacao' });
  }
  if (mentions('currículo', 'curriculo', 'cv', 'contratar', 'recrutador', 'vaga', 'fit')) {
    actions.push({ label: 'Baixar CV', type: 'export_cv', value: 'pdf' });
  }
  if (mentions('contato', 'e-mail', 'email', 'mensagem', 'recado', 'falar')) {
    actions.push({ label: 'Escrever mensagem', type: 'navigate', value: '#contato' });
  }
  if (actions.length === 0) {
    actions.push(
      { label: 'Ver experiência', type: 'navigate', value: '#experiencia' },
      { label: 'Ver projetos', type: 'navigate', value: '#projeto' }
    );
  }
  return actions.slice(0, 3);
}

function geminiText(payload: GeminiResponse): string {
  return (
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim() ?? ''
  );
}

async function generateWithGemini(
  env: PortfolioBindings,
  systemInstruction: string,
  history: Array<{ role: 'user' | 'model'; text: string }>,
  message: string
): Promise<string> {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) return '';

  const models = (env.GEMINI_MODELS || DEFAULT_MODELS)
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  const firstUser = history.findIndex((item) => item.role === 'user');
  const contents = [
    ...(firstUser === -1 ? [] : history.slice(firstUser)).map((turn) => ({
      role: turn.role,
      parts: [
        {
          text:
            turn.role === 'user'
              ? `<historico_usuario>\n${turn.text}\n</historico_usuario>`
              : turn.text
        }
      ]
    })),
    { role: 'user' as const, parts: [{ text: message }] }
  ];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: { temperature: 0.3, maxOutputTokens: 450 }
          }),
          signal: AbortSignal.timeout(12_000)
        }
      );
      if (!response.ok) {
        console.warn(`[gemini] ${model} HTTP ${response.status}`);
        continue;
      }
      const payload = (await response.json()) as GeminiResponse;
      const reply = geminiText(payload);
      if (reply) return reply;
    } catch {
      console.warn(`[gemini] ${model} indisponível.`);
    }
  }

  return '';
}

type MachineDocument = {
  body: string;
  contentType: string;
};

function machineDocument(url: URL): MachineDocument | null {
  const { pathname, origin } = url;
  const data = DEFAULT_PORTFOLIO_DATA;

  if (pathname === '/llms.txt') {
    return { body: generateLlmsTxt(data, origin), contentType: 'text/plain; charset=utf-8' };
  }

  if (pathname === '/robots.txt') {
    return { body: generateRobotsTxt(origin), contentType: 'text/plain; charset=utf-8' };
  }

  if (pathname === '/sitemap.xml') {
    return { body: generateSitemapXml(origin), contentType: 'application/xml; charset=utf-8' };
  }

  return null;
}

function documentResponse(document: MachineDocument, method: string): Response {
  const bytes = new TextEncoder().encode(document.body);
  const headers = new Headers({
    'Content-Type': document.contentType,
    ...SECURITY_HEADERS,
    'Content-Length': String(bytes.byteLength)
  });
  return new Response(method === 'HEAD' ? null : bytes, { status: 200, headers });
}

const UNAVAILABLE_REPLY =
  'O assistente está indisponível agora. A **Experiência** e os **Projetos** estão logo abaixo, e o CV está a um clique.';

function chatReply(status: number, body: ChatResponse): Response {
  return json(status, body);
}

async function handleChat(request: Request, env: PortfolioBindings): Promise<Response> {
  if (!isAllowedChatOrigin(request)) {
    return json(403, { error: 'Origem não autorizada.' });
  }
  if (!hasJsonContentType(request)) {
    return json(415, { error: 'Use Content-Type: application/json.' });
  }
  if (!(await allowed(env.CHAT_LIMIT, clientIp(request)))) {
    return chatReply(429, {
      reply: 'Muitas perguntas em pouco tempo. Tente de novo em alguns minutos ou fale direto com o Pedro por e-mail.',
      source: 'local',
      actions: [{ label: 'Baixar CV', type: 'export_cv', value: 'pdf' }]
    });
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return json(body.status, { error: BODY_ERRORS[body.status] });
  }

  const parsed = ChatRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return chatReply(400, {
      reply: `**${parsed.error.issues[0]?.message ?? 'Entrada inválida.'}**`,
      source: 'local'
    });
  }

  const { message, history } = parsed.data;
  const generated = await generateWithGemini(
    env,
    buildSystemPrompt(DEFAULT_PORTFOLIO_DATA),
    history,
    buildUserPrompt(parsed.data)
  );

  if (!isSafeReply(generated)) {
    return chatReply(200, { reply: UNAVAILABLE_REPLY, source: 'local', actions: inferContextualActions('', '') });
  }

  return chatReply(200, {
    reply: generated,
    source: 'ai',
    actions: inferContextualActions(message, generated)
  });
}

async function handleContact(request: Request, env: PortfolioBindings): Promise<Response> {
  if (!hasJsonContentType(request)) {
    return json(415, { ok: false, error: 'Use Content-Type: application/json.' }, CORS);
  }
  if (!(await allowed(env.CONTACT_LIMIT, clientIp(request)))) {
    return json(429, { ok: false, error: 'Muitas mensagens em pouco tempo. Tente de novo em alguns minutos.' }, CORS);
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return json(body.status, { ok: false, error: BODY_ERRORS[body.status] }, CORS);
  }

  const parsed = ContactRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return json(400, { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, CORS);
  }

  if (parsed.data.website?.trim()) {
    return json(200, { ok: true }, CORS);
  }

  const entry: InboxEntry = {
    at: new Date().toISOString(),
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    source: parsed.data.source
  };

  try {
    if (!env.INBOX) throw new Error('inbox indisponível');
    await env.INBOX.put(`msg:${entry.at}:${crypto.randomUUID()}`, JSON.stringify(entry));
  } catch {
    console.warn('Falha ao gravar contato no armazenamento.');
    return json(500, { ok: false, error: 'Não foi possível guardar a mensagem.' }, CORS);
  }

  return json(200, { ok: true }, CORS);
}

export async function handlePortfolioRequest(request: Request, env: PortfolioBindings): Promise<Response | null> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === 'OPTIONS' && pathname === '/api/contact') {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS,
        ...SECURITY_HEADERS,
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY) {
    return json(413, { error: 'Pedido grande demais.' });
  }

  if (pathname === '/.well-known' || pathname.startsWith('/.well-known/')) {
    return text(404, 'Not found', 'text/plain; charset=utf-8');
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    const document = machineDocument(url);
    if (document) return documentResponse(document, request.method);
  }

  if (pathname === '/api/chat' && request.method === 'POST') {
    return handleChat(request, env);
  }

  if (pathname === '/api/contact' && request.method === 'POST') {
    return handleContact(request, env);
  }

  if (pathname.startsWith('/api/')) {
    return json(404, { error: 'Não encontrado.' });
  }

  return null;
}
