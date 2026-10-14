import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  DEFAULT_PORTFOLIO_DATA,
  generateJsonLdSchema,
  generateLlmsTxt
} from './src/data/portfolioData.ts';
import {
  ChatRequestSchema,
  buildTokenEfficientSystemPrompt
} from './src/utils/chatGuardrails.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

interface ChatAction {
  label: string;
  type: 'navigate' | 'export_cv' | 'filter_tech' | 'open_inspector';
  value: string;
}

function inferContextualActions(userQuery: string, replyText: string): ChatAction[] {
  const combined = `${userQuery} ${replyText}`.toLowerCase();
  const actions: ChatAction[] = [];

  if (
    combined.includes('experi') ||
    combined.includes('xp') ||
    combined.includes('carreira') ||
    combined.includes('trabalh')
  ) {
    actions.push({ label: 'Ver Experiências', type: 'navigate', value: '#experiencias' });
  }
  if (
    combined.includes('projet') ||
    combined.includes('arquitetura') ||
    combined.includes('cloudos') ||
    combined.includes('nexus')
  ) {
    actions.push({ label: 'Explorar Projetos', type: 'navigate', value: '#projetos' });
  }
  if (combined.includes('certifica') || combined.includes('badge') || combined.includes('credencia')) {
    actions.push({ label: 'Ver Certificações', type: 'navigate', value: '#certificacoes' });
  }
  if (combined.includes('typescript')) {
    actions.push({ label: 'Destacar TypeScript', type: 'filter_tech', value: 'TypeScript' });
  } else if (combined.includes('react')) {
    actions.push({ label: 'Destacar React', type: 'filter_tech', value: 'React' });
  }
  if (
    combined.includes('currículo') ||
    combined.includes('curriculo') ||
    combined.includes('cv') ||
    combined.includes('contratar') ||
    combined.includes('contato') ||
    combined.includes('recrutador')
  ) {
    actions.push({ label: 'Baixar CV (.MD)', type: 'export_cv', value: 'md' });
  }

  if (actions.length === 0) {
    actions.push(
      { label: 'Ver Experiências', type: 'navigate', value: '#experiencias' },
      { label: 'Explorar Projetos', type: 'navigate', value: '#projetos' }
    );
  }

  return actions.slice(0, 3);
}

function buildLocalDossierFallback(query: string): string {
  const q = query.toLowerCase().trim();
  const d = DEFAULT_PORTFOLIO_DATA;

  if (q.length <= 4 && !q.includes('xp') && !q.includes('ia') && !q.includes('cv')) {
    return `Olá! Posso te apresentar as experiências profissionais do **${d.profile.name}**, detalhar a arquitetura dos projetos dele (como o *CloudOS* e o *Nexus Command*), listar sua stack principal (*TypeScript, React 19, Node.js, WebSockets*) ou gerar um resumo rápido para sua vaga.`;
  }

  if (q.includes('nome') || q.includes('quem é') || q.includes('quem e')) {
    return `O portfólio pertence a **${d.profile.name}** (${d.profile.shortName}), Senior Frontend & Full-Stack Software Engineer baseado no **${d.profile.location}**. Contato direto: \`${d.profile.email}\`.`;
  }

  if (q.includes('xp') || q.includes('experi') || q.includes('trabalh') || q.includes('carreira')) {
    const exp1 = d.experiences[0];
    const exp2 = d.experiences[1];
    return `A principal experiência do Pedro é como **${exp1.role}** (${exp1.period}), liderando arquiteturas Mobile-First em React 19, TypeScript e Node.js com redução de **38% no LCP** e 100/100 no Core Web Vitals.\n\nAnteriormente, atuou como **${exp2.role}** (${exp2.period}), construindo plataformas analíticas e automações que geraram **+60% de eficiência operacional** e consultas P95 em 190ms.`;
  }

  if (q.includes('projet') || q.includes('arquitetura') || q.includes('portfólio')) {
    return `Os 3 projetos principais em destaque são:\n- **${d.projects[0].title}**: Plataforma de observabilidade a 60fps para 100k+ eventos usando Ring Buffer reativo e SVG procedural.\n- **${d.projects[1].title}**: War-room colaborativa em tempo real com pool de Web Workers decodificando 14 cifras em < 12ms.\n- **${d.projects[2].title}**: Planejador tático Offline-First com máquina de estados determinística e IndexedDB.`;
  }

  if (q.includes('stack') || q.includes('tecnologia') || q.includes('linguagen') || q.includes('skill')) {
    return `A stack principal do Pedro combina **TypeScript estrito, React 19, Next.js, Node.js, Express, WebSockets, PostgreSQL e Tailwind CSS**, com forte foco em performance de renderização (60fps), ergonomia Mobile-First e dados estruturados para agentes de IA (\`/llms.txt\` e \`Schema.org\`).`;
  }

  if (q.includes('gata') || q.includes('gato') || q.includes('morcega') || q.includes('banguela') || q.includes('tomada') || q.includes('pet')) {
    return `O Pedro divide o escritório com 3 gatas:\n- **Morcega**: a mais velha e gordinha, parece uma morceguinha e supervisiona deploys dormindo.\n- **Banguela**: a do meio e menorzinha das três — uma gatinha preta com carinha de esquilo (bochechas grandes cheias de comida) e sem 1 presa.\n- **Tomada**: o caçula GRANDE, magro/esguio e ligado no 220V, pura energia!`;
  }

  if (q.includes('jogo') || q.includes('rpg') || q.includes('baldur') || q.includes('dota') || q.includes('valorant') || q.includes('gincana') || q.includes('café') || q.includes('cafe')) {
    return `Fora do código (e sempre movido a muito **café** ☕), o Pedro participa ativamente das tradicionais **Gincanas no Rio Grande do Sul** no **Setor de Diversas** (um setor extremamente focado em dados, pesquisa de documentos, informações pessoais e locais sob pressão), treina musculação 5–6x por semana e joga RPGs e jogos táticos como **Baldur's Gate 3, Valheim, Dota 2, Valorant e Cities: Skylines**.`;
  }

  return `**${d.profile.name}** é engenheiro de software focado em **TypeScript, React 19 e Node.js**, com resultados comprovados em performance web (-38% LCP) e automação (+60% de eficiência). Atualmente está **${d.profile.availability.toLowerCase()}** a partir do Rio Grande do Sul.`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // AI-Friendly Crawler & Export Endpoints
  app.get('/llms.txt', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(generateLlmsTxt(DEFAULT_PORTFOLIO_DATA));
  });

  app.get('/cv-pedro-lopes.md', (_req, res) => {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Pedro_Henriques_Lopes_CV.md"');
    res.send(generateLlmsTxt(DEFAULT_PORTFOLIO_DATA));
  });

  app.get('/ai.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({
      crawlerProtocol: 'AI-Friendly-Portfolio-v2',
      candidate: DEFAULT_PORTFOLIO_DATA.profile.name,
      contact: DEFAULT_PORTFOLIO_DATA.profile.email,
      schemaOrgJsonLd: generateJsonLdSchema(DEFAULT_PORTFOLIO_DATA),
      structuredDossier: DEFAULT_PORTFOLIO_DATA
    });
  });

  // Portfolio Assistant Endpoint with Zod Guardrail Validation & Token-Efficient System Prompt
  app.post('/api/chat', async (req, res) => {
    const parsed = ChatRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      const issueMessage = parsed.error.issues[0]?.message || 'Entrada inválida.';
      res.json({
        blockedByZod: true,
        reply: `**${issueMessage}**\n\nRespondo exclusivamente sobre a carreira, arquitetura de software, projetos, stack e bastidores de **Pedro Henriques Lopes**. Como posso ajudar com essas informações?`,
        actions: [
          { label: 'Ver Experiências', type: 'navigate', value: '#experiencias' },
          { label: 'Explorar Projetos', type: 'navigate', value: '#projetos' }
        ]
      });
      return;
    }

    const { message, history } = parsed.data;
    const systemInstruction = buildTokenEfficientSystemPrompt(DEFAULT_PORTFOLIO_DATA);

    // Ensure history starts with a 'user' message so Gemini multi-turn validation never fails
    const sanitizedHistory = [...history];
    while (sanitizedHistory.length > 0 && sanitizedHistory[0].role !== 'user') {
      sanitizedHistory.shift();
    }

    const conversationContents = [
      ...sanitizedHistory.map((item) => ({
        role: item.role,
        parts: [{ text: item.text }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const modelsToTry = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let replyText = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: conversationContents,
          config: {
            systemInstruction,
            temperature: 0.3
          }
        });
        if (response.text) {
          replyText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} transient error, trying fallback...`);
      }
    }

    if (!replyText) {
      replyText = buildLocalDossierFallback(message);
    }

    const actions = inferContextualActions(message, replyText);
    res.json({ reply: replyText, actions, blockedByZod: false });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
