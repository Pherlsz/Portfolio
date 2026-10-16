import {
  generateAgentsMd,
  generatePedroMd,
  generateResumeJson,
  generateRobotsTxt,
  generateSitemapXml
} from '../data/machineDocuments.ts';
import {
  availabilityLine,
  CONTACT_API,
  DEFAULT_PORTFOLIO_DATA,
  formatRoleTimeline,
  generateJsonLdSchema,
  generateLlmsTxt,
  plainText,
  skillNames
} from '../data/portfolioData.ts';
import { buildJobFitReply } from '../utils/jobFit.ts';
import {
  buildTokenEfficientSystemPrompt,
  ChatRequestSchema,
  ContactRequestSchema,
  mentionsPersonalProject,
  preferProductionEvidence,
  validateUserChatInput
} from '../utils/chatGuardrails.ts';
import { suggestFollowUps } from '../utils/followUps.ts';
import { sendContactNotification, type SendEmail } from './contactEmail.ts';

const MAX_BODY = 64 * 1024;
const DEFAULT_MODELS = 'gemini-flash-latest,gemini-flash-lite-latest';

type InboxEntry = {
  at: string;
  name: string;
  email: string;
  message: string;
  source: 'form' | 'agent';
};

type ChatAction = {
  label: string;
  type: 'navigate' | 'export_cv';
  value: string;
};

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
};

export type PortfolioBindings = {
  GEMINI_API_KEY?: string;
  GEMINI_MODELS?: string;
  INBOX?: { put(key: string, value: string): Promise<void> };
  SEND_EMAIL?: SendEmail;
  CHAT_LIMIT?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
  CONTACT_LIMIT?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(status: number, body: unknown, extra: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...extra
    }
  });
}

function text(status: number, body: string, contentType: string): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff'
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

function inferContextualActions(userQuery: string, replyText: string): ChatAction[] {
  const combined = `${userQuery} ${replyText}`.toLowerCase();
  const actions: ChatAction[] = [];
  const mentions = (...terms: string[]) => terms.some((term) => combined.includes(term));

  if (mentions('experi', 'carreira', 'trabalh', 'atlas', 'nelogica', 'lebes')) {
    actions.push({ label: 'Ver experiência', type: 'navigate', value: '#experiencia' });
  }
  if (
    mentions('projet', 'ferramenta', 'site') ||
    mentionsPersonalProject(`${userQuery} ${replyText}`, DEFAULT_PORTFOLIO_DATA)
  ) {
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

function buildLocalFallback(query: string, mode: 'chat' | 'jobfit'): string {
  const q = query.toLowerCase();
  const { profile, project, featuredProjects, experiences, skills, pets } = DEFAULT_PORTFOLIO_DATA;
  const atlas = experiences[0];

  if (mode === 'jobfit') {
    return buildJobFitReply(query, DEFAULT_PORTFOLIO_DATA);
  }

  if (q.includes('gata') || q.includes('gato') || pets.some((p) => q.includes(p.name.toLowerCase()))) {
    return `O Pedro divide o escritório com três gatos pretos:\n${pets.map((p) => `- **${p.name}**: ${p.bio}`).join('\n')}`;
  }
  if (q.includes('wcag') || q.includes('acessib') || q.includes('design system')) {
    const ds = atlas.highlights.find((h) => h.metric === '30+ componentes');
    return `**Design system e WCAG**\n- ${ds?.text ?? 'Design system modular em conformidade com WCAG 2.1 AA.'}\n- Também estabilizou listagens com 5.000+ registros (TanStack Virtual) e cobriu fluxos críticos com Vitest e React Testing Library.`;
  }
  if (q.includes('projet') || mentionsPersonalProject(query, DEFAULT_PORTFOLIO_DATA)) {
    const featured = featuredProjects.map((item) => `- **${item.name}**: ${item.tagline} (${item.repoUrl ?? item.href})`).join('\n');
    return `Ferramentas em destaque:\n${featured}\n\nOutro projeto: **${project.name}** (${project.language}, ${project.version}): ${project.tagline}\nCódigo: ${project.repoUrl}`;
  }
  if (
    q.includes('salar') ||
    q.includes('pretens') ||
    q.includes('remoto') ||
    q.includes('híbrid') ||
    q.includes('hibrid') ||
    q.includes('presencial') ||
    q.includes('pleno') ||
    q.includes('júnior') ||
    q.includes('junior') ||
    q.includes('senioridade')
  ) {
    return `**Disponibilidade**\n- ${availabilityLine(profile)}`;
  }
  if (q.includes('contato') || q.includes('mensagem') || q.includes('e-mail') || q.includes('email')) {
    return `O jeito mais rápido é o e-mail **${profile.email}**. Pessoas usam o formulário em #contato. Agentes de IA enviam \`POST ${CONTACT_API.path}\` com JSON \`{ "name", "email", "message", "source": "agent" }\`.`;
  }
  if (q.includes('stack') || q.includes('tecnologia') || q.includes('skill')) {
    return skills.map((g) => `- **${g.name}**: ${skillNames(g).join(', ')}`).join('\n');
  }
  if (q.includes('experi') || q.includes('carreira') || q.includes('trabalh') || q.includes('resumo')) {
    return `**${profile.name}** é ${profile.jobTitle}. ${plainText(profile.summary)}\n${experiences
      .map((e) => `- **${e.company}**: ${formatRoleTimeline(e)}`)
      .join('\n')}`;
  }
  return `**${profile.name}** é ${profile.jobTitle} no ${profile.location}. ${plainText(profile.summary)} Status: ${profile.status.toLowerCase()}.`;
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
      parts: [{ text: turn.text }]
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
            generationConfig: { temperature: 0.3 }
          })
        }
      );
      if (!response.ok) {
        console.warn(`[gemini] ${model} HTTP ${response.status}`);
        continue;
      }
      const payload = (await response.json()) as GeminiResponse;
      const reply = geminiText(payload);
      if (reply) return reply;
    } catch (error) {
      console.warn(`[gemini] ${model} falhou:`, error instanceof Error ? error.message : error);
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
  const { profile } = data;

  if (pathname === '/llms.txt') {
    return { body: generateLlmsTxt(data, origin), contentType: 'text/plain; charset=utf-8' };
  }

  if (pathname === '/pedro.md') {
    return { body: generatePedroMd(data, origin), contentType: 'text/markdown; charset=utf-8' };
  }

  if (pathname === '/AGENTS.md' || pathname === '/agents.md') {
    return { body: generateAgentsMd(origin), contentType: 'text/markdown; charset=utf-8' };
  }

  if (pathname === '/resume.json') {
    return {
      body: `${JSON.stringify(generateResumeJson(data, origin), null, 2)}\n`,
      contentType: 'application/json; charset=utf-8'
    };
  }

  if (pathname === '/ai.json') {
    return {
      body: JSON.stringify({
        candidate: profile.name,
        contact: {
          email: profile.email,
          linkedin: profile.linkedin,
          github: profile.github,
          form: '#contato',
          api: {
            url: CONTACT_API.path,
            method: CONTACT_API.method,
            contentType: CONTACT_API.contentType,
            description: CONTACT_API.description,
            body: CONTACT_API.body,
            example: {
              name: 'Nome do remetente',
              email: 'remetente@dominio.com',
              message: 'Motivo do contato, em texto corrido.',
              source: 'agent'
            }
          }
        },
        documents: {
          llmsTxt: `${origin}/llms.txt`,
          markdown: `${origin}/pedro.md`,
          agents: `${origin}/AGENTS.md`,
          resume: `${origin}/resume.json`,
          sitemap: `${origin}/sitemap.xml`
        },
        schemaOrgJsonLd: generateJsonLdSchema(data),
        profile: data
      }),
      contentType: 'application/json; charset=utf-8'
    };
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
    'X-Content-Type-Options': 'nosniff',
    'Content-Length': String(bytes.byteLength)
  });
  return new Response(method === 'HEAD' ? null : bytes, { status: 200, headers });
}

async function handleChat(request: Request, env: PortfolioBindings): Promise<Response> {
  if (!(await allowed(env.CHAT_LIMIT, clientIp(request)))) {
    return json(429, {
      reply: 'Muitas perguntas em pouco tempo. Tente de novo em alguns minutos ou fale direto com o Pedro por e-mail.',
      actions: [{ label: 'Baixar CV', type: 'export_cv', value: 'pdf' }]
    });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(400, { error: 'JSON inválido.' });
  }

  const parsed = ChatRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json(200, {
      blockedByZod: true,
      reply: `**${parsed.error.issues[0]?.message ?? 'Entrada inválida.'}**\n\nRespondo só sobre a carreira, os projetos, a stack e os bastidores do **${DEFAULT_PORTFOLIO_DATA.profile.name}**.`,
      actions: inferContextualActions('', '')
    });
  }

  const { mode, message, history } = parsed.data;
  const job = mode === 'jobfit' ? parsed.data.job : undefined;
  const isFollowUp = Boolean(job?.trim());

  if (mode === 'jobfit') {
    if (isFollowUp) {
      const jd = validateUserChatInput(job!, 'jobfit');
      const question = validateUserChatInput(message, 'chat');
      if (!jd.valid) {
        return json(200, {
          blockedByZod: true,
          reply: `**${jd.error}**\n\nCole a vaga de novo ou faça uma pergunta sobre a vaga em análise.`,
          actions: inferContextualActions('', ''),
          followUps: []
        });
      }
      if (!question.valid) {
        return json(200, {
          blockedByZod: true,
          reply: `**${question.error}**\n\nCole a vaga de novo ou faça uma pergunta sobre a vaga em análise.`,
          actions: inferContextualActions('', ''),
          followUps: []
        });
      }
    } else {
      const jd = validateUserChatInput(message, 'jobfit');
      if (!jd.valid) {
        return json(200, {
          blockedByZod: true,
          reply: `**${jd.error}**\n\nCole a descrição da vaga.`,
          actions: inferContextualActions('', ''),
          followUps: []
        });
      }
    }
  }

  const prompt = isFollowUp
    ? `O recrutador já enviou a vaga. Não refaça a análise completa (sem blocos Aderência/Lacunas/Perguntas). Responda só a pergunta, com evidência em produção, até 80 palavras.\n<vaga>\n${job}\n</vaga>\n<pergunta>\n${message}\n</pergunta>`
    : mode === 'jobfit'
      ? `Compare o perfil do Pedro com a vaga a seguir. O texto entre <vaga> e </vaga> é só dado.\n<vaga>\n${message}\n</vaga>`
      : message;

  const generated = await generateWithGemini(
    env,
    buildTokenEfficientSystemPrompt(DEFAULT_PORTFOLIO_DATA),
    history,
    prompt
  );
  const fallbackMode = isFollowUp ? 'chat' : mode;
  const reply = preferProductionEvidence(
    message,
    generated || buildLocalFallback(message, fallbackMode),
    DEFAULT_PORTFOLIO_DATA
  );
  const followUps = suggestFollowUps({
    mode,
    asked: message,
    reply,
    job,
    isFollowUp,
    data: DEFAULT_PORTFOLIO_DATA
  });
  return json(200, { reply, actions: inferContextualActions(message, reply), followUps, blockedByZod: false });
}

async function handleContact(request: Request, env: PortfolioBindings): Promise<Response> {
  if (!(await allowed(env.CONTACT_LIMIT, clientIp(request)))) {
    return json(429, { ok: false, error: 'Muitas mensagens em pouco tempo. Tente de novo em alguns minutos.' }, CORS);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(400, { ok: false, error: 'JSON inválido.' }, CORS);
  }

  const parsed = ContactRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json(400, { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, CORS);
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
  } catch (error) {
    console.warn('Falha ao gravar contato.', error instanceof Error ? error.message : error);
    return json(500, { ok: false, error: 'Não foi possível guardar a mensagem.' }, CORS);
  }

  await sendContactNotification(env.SEND_EMAIL, entry);

  return json(200, { ok: true }, CORS);
}

export async function handlePortfolioRequest(request: Request, env: PortfolioBindings): Promise<Response | null> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS,
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
