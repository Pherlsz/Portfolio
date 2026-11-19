import { ARTICLES, STUDIES } from '../content/collections.ts';
import { isSectionVisible, visibleSections } from '../content/sections.ts';
import {
  generateCvJsonResume,
  generateCvMarkdown,
  generateLlmsTxt,
  generateRobotsTxt,
  generateSitemapXml
} from '../data/machineDocuments.ts';
import { DEFAULT_PORTFOLIO_DATA, foldText } from '../data/portfolioData.ts';
import {
  HISTORY_CHAR_BUDGET,
  type ChatAction,
  type ChatCardRef,
  type ChatSkill,
  type ChatSseEvent
} from '../utils/chat.ts';
import {
  buildSystemPrompt,
  buildUserPrompt,
  ChatRequestSchema,
  ContactRequestSchema,
  isSafeReply,
  LEAK_RE
} from './assistant.ts';
import {
  cacheSuggestionReplyIfEligible,
  createUpstreamAbortSignal,
  evaluateBudgetCircuitBreaker,
  getCachedSuggestionReply,
  trimHistoryToBudget,
  type D1DatabaseLike,
  type KvNamespaceLike
} from './budget.ts';
import {
  buildGenerationConfig,
  getReasoningProfile,
  type ReasoningProfile
} from './reasoning.ts';
import { getSuggestions, logQuestion } from './suggestions.ts';

const MAX_BODY = 64 * 1024;

type InboxEntry = {
  at: string;
  name: string;
  email: string;
  message: string;
  source: 'form' | 'agent';
};

type GeminiPart = { text?: string; thought?: boolean };
type GeminiUsageMetadata = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  totalTokenCount?: number;
};
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  usageMetadata?: GeminiUsageMetadata;
};

export interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
}

export type RateLimiterBinding = {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
};

export type PortfolioBindings = {
  GEMINI_API_KEY?: string;
  GEMINI_MODELS?: string;
  REASONING_PROFILES?: string;
  DAILY_SOFT_BUDGET?: string | number;
  DAILY_HARD_BUDGET?: string | number;
  INBOX?: KvNamespaceLike;
  QUESTIONS?: D1DatabaseLike;
  CHAT_LIMIT?: RateLimiterBinding;
  CHAT_HIGH_LIMIT?: RateLimiterBinding;
  CONTACT_LIMIT?: RateLimiterBinding;
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
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

function text(status: number, body: string, contentType: string, extra: HeadersInit = {}): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': contentType,
      ...SECURITY_HEADERS,
      ...extra
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

async function allowed(limiter: RateLimiterBinding | undefined, key: string): Promise<boolean> {
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

const KNOWN_STUDY_SLUGS = new Set<string>([
  ...STUDIES.map((s) => s.slug),
  'virtualizacao-listagens-react',
  'gymkhana-core-pipeline',
  'portfolio-v2-arquitetura-ia'
]);

const KNOWN_ARTICLE_SLUGS = new Set<string>([
  ...ARTICLES.map((a) => a.slug),
  'design-system-wcag-aa'
]);

const VALID_PROJECT_IDS = new Set<string>(DEFAULT_PORTFOLIO_DATA.projects.map((p) => p.id));
const VALID_EXPERIENCE_IDS = new Set<string>(DEFAULT_PORTFOLIO_DATA.experiences.map((e) => e.id));
const VALID_CERTIFICATE_SLUGS = new Set<string>(DEFAULT_PORTFOLIO_DATA.certificates.map((c) => c.slug));

function isValidCardRef(card: ChatCardRef): boolean {
  switch (card.kind) {
    case 'project':
      return Boolean(card.id && VALID_PROJECT_IDS.has(card.id));
    case 'experience':
      return Boolean(card.id && VALID_EXPERIENCE_IDS.has(card.id));
    case 'certificate':
      return Boolean(card.id && VALID_CERTIFICATE_SLUGS.has(card.id));
    case 'study':
      return Boolean(card.id && KNOWN_STUDY_SLUGS.has(card.id));
    case 'article':
      return Boolean(card.id && KNOWN_ARTICLE_SLUGS.has(card.id));
    case 'contact':
    case 'v1':
      return true;
    default:
      return false;
  }
}

const CASUAL_QUERY_RE =
  /^(?:oi+|ola+|opa|eae|fala|salve|hey|hi|hello|bom dia|boa tarde|boa noite|tudo bem|td bem|beleza|blz|valeu|vlw|obrigad[oa]|thanks|thank you|ok|certo|entendi|show|legal|massa)[!?.,\s]*$/i;

export function inferContextualCards(
  userQuery: string,
  replyText: string,
  skill?: ChatSkill
): ChatCardRef[] {
  const queryFolded = foldText(userQuery);
  if (!skill && CASUAL_QUERY_RE.test(queryFolded)) {
    return [];
  }
  const combinedFolded = foldText(`${userQuery} ${replyText}`);
  const candidates: ChatCardRef[] = [];

  const mentions = (...terms: string[]) =>
    terms.some((term) => combinedFolded.includes(foldText(term)));
  const queryMentions = (...terms: string[]) =>
    terms.some((term) => queryFolded.includes(foldText(term)));

  if (skill === 'vaga' || skill === 'resumo') {
    candidates.push({ kind: 'experience', id: 'atlas' });
  }

  // Specific Experiences
  if (mentions('atlas', 'governanca', 'atlas sign', 'atlas plg')) {
    candidates.push({ kind: 'experience', id: 'atlas' });
  }
  if (mentions('nelogica', 'noc', 'grafana', 'zabbix', 'kibana', 'mttr')) {
    candidates.push({ kind: 'experience', id: 'nelogica' });
  }
  if (mentions('lebes', 'lojas lebes', 'erp', 'crm')) {
    candidates.push({ kind: 'experience', id: 'lebes' });
  }

  // Specific Projects
  if (mentions('gymkhana database', 'gymkhana-database', 'planilha')) {
    candidates.push({ kind: 'project', id: 'gymkhana-database' });
  }
  if (
    mentions(
      'gymkhana core',
      'gymkhana-core',
      'civiltime',
      'portablejson',
      'fingerprint',
      'biblioteca em go'
    )
  ) {
    candidates.push({ kind: 'project', id: 'gymkhana-core' });
  }
  if (mentions('pherls.dev v2', 'portfolio v2', 'portfolio-v2', 'segunda versao')) {
    candidates.push({ kind: 'project', id: 'portfolio-v2' });
  }
  if (queryMentions('pherls.dev v1', 'portfolio v1', '/v1', 'primeira versao', 'adesivos')) {
    candidates.push({ kind: 'v1' });
  }

  // Generic projects query fallback
  if (
    queryMentions('projeto', 'projetos', 'github', 'repositorio') &&
    !candidates.some((c) => c.kind === 'project')
  ) {
    candidates.push(
      { kind: 'project', id: 'gymkhana-database' },
      { kind: 'project', id: 'gymkhana-core' }
    );
  }

  // Specific Studies & Articles
  if (mentions('tanstack virtual', 'virtualizacao', '5.000+ registros', '5000 registros', 'layout thrashing')) {
    candidates.push({ kind: 'study', id: 'virtualizacao-listagens-react' });
  }
  if (mentions('pipeline', 'modulos do gymkhana', 'deduplicacao')) {
    candidates.push({ kind: 'study', id: 'gymkhana-core-pipeline' });
  }
  if (mentions('streaming sse', 'evento retract', 'curadoria semanal', 'arquitetura do assistente')) {
    candidates.push({ kind: 'study', id: 'portfolio-v2-arquitetura-ia' });
  }
  if (mentions('wcag', 'acessibilidade', '30+ componentes', 'design system')) {
    candidates.push({ kind: 'article', id: 'design-system-wcag-aa' });
  }

  // Certificates
  if (mentions('az-900', 'azure fundamentals', 'credly', 'certificado', 'certificacao', 'certificacoes')) {
    candidates.push({ kind: 'certificate', id: 'azure-fundamentals' });
  }
  if (mentions('igti', 'bootcamp')) {
    candidates.push({ kind: 'certificate', id: 'igti-azure-bootcamp' });
  }

  // Contact
  if (queryMentions('contato', 'enviar mensagem', 'mandar recado', 'falar com', 'contratar')) {
    candidates.push({ kind: 'contact' });
  }

  const seen = new Set<string>();
  const resolved: ChatCardRef[] = [];

  for (const card of candidates) {
    if (!isValidCardRef(card)) continue;
    const key = `${card.kind}:${card.id ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    resolved.push(card);
    if (resolved.length >= 3) break;
  }

  return resolved;
}

export function inferContextualActions(userQuery: string, replyText: string): ChatAction[] {
  const combined = foldText(`${userQuery} ${replyText}`);
  const actions: ChatAction[] = [];
  const visiblePaths = new Set(visibleSections().map((section) => section.path));
  const mentions = (...terms: string[]) => terms.some((term) => combined.includes(foldText(term)));

  if (
    visiblePaths.has('/experiencia') &&
    mentions('experi', 'carreira', 'trabalh', 'atlas', 'nelogica', 'lebes')
  ) {
    actions.push({ label: 'Ver experiência', type: 'route', value: '/experiencia' });
  }
  if (visiblePaths.has('/projetos') && mentions('projet', 'ferramenta', 'site', 'gymkhana')) {
    actions.push({ label: 'Ver projetos', type: 'route', value: '/projetos' });
  }
  if (
    visiblePaths.has('/estudos') &&
    mentions('estudo', 'certifica', 'az-900', 'azure', 'virtualiza', 'arquitetura')
  ) {
    actions.push({ label: 'Ver estudos e certificados', type: 'route', value: '/estudos' });
  }
  if (
    visiblePaths.has('/artigos') &&
    isSectionVisible('articles') &&
    mentions('artigo', 'design system', 'wcag', 'acessibilidade')
  ) {
    actions.push({ label: 'Ler artigos', type: 'route', value: '/artigos' });
  }
  if (mentions('curriculo', 'cv', 'contratar', 'recrutador', 'vaga', 'fit')) {
    actions.push({
      label: 'Baixar CV',
      type: 'export_cv',
      value: DEFAULT_PORTFOLIO_DATA.profile.cvUrl
    });
  }
  if (mentions('contato', 'e-mail', 'email', 'mensagem', 'recado', 'falar')) {
    actions.push({ label: 'Enviar recado', type: 'contact', value: '/contato' });
  }

  if (actions.length === 0) {
    if (visiblePaths.has('/experiencia')) {
      actions.push({ label: 'Ver experiência', type: 'route', value: '/experiencia' });
    }
    if (visiblePaths.has('/projetos')) {
      actions.push({ label: 'Ver projetos', type: 'route', value: '/projetos' });
    }
  }

  return actions.slice(0, 3);
}

function extractGeminiChunkText(payload: GeminiResponse): string {
  const parts = payload.candidates?.[0]?.content?.parts;
  if (!parts) return '';
  return parts
    .filter((part) => !part.thought)
    .map((part) => part.text ?? '')
    .join('');
}

function formatSseEvent(event: ChatSseEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

const UNAVAILABLE_REPLY =
  'O assistente está indisponível agora. Você pode explorar **Experiência**, **Projetos** e **Estudos** pelo menu lateral ou baixar o CV completo.';

const SAFE_RETRACT_REPLY =
  'Posso responder apenas sobre a experiência profissional, projetos, estudos técnicos, formação e contato de Pedro Henrique Lopes.';

interface StreamGeminiResult {
  ok: boolean;
  accumulated: string;
  leaked: boolean;
  streamError?: boolean;
  emittedAnyChunk: boolean;
  promptTokens: number;
  outputTokens: number;
  thinkingTokens: number;
}

async function streamFromSingleModel(
  model: string,
  apiKey: string,
  profile: ReasoningProfile,
  systemInstruction: string,
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  requestSignal: AbortSignal | undefined,
  onDelta: (textChunk: string, accumulated: string) => void
): Promise<StreamGeminiResult> {
  const signal = createUpstreamAbortSignal(requestSignal, 15_000);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: buildGenerationConfig(profile, model)
      }),
      signal
    }
  );

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => '');
    console.error(`[gemini] model=${model} status=${response.status} body=${errText.slice(0, 300)}`);
    return {
      ok: false,
      accumulated: '',
      leaked: false,
      emittedAnyChunk: false,
      promptTokens: 0,
      outputTokens: 0,
      thinkingTokens: 0
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let rawAll = '';
  let parsedSsePayloads = 0;
  let accumulated = '';
  let emittedAnyChunk = false;
  let leaked = false;
  let promptTokens = 0;
  let outputTokens = 0;
  let thinkingTokens = 0;

  const processPayload = (payload: GeminiResponse): boolean => {
    if (payload.usageMetadata) {
      promptTokens = payload.usageMetadata.promptTokenCount ?? promptTokens;
      outputTokens = payload.usageMetadata.candidatesTokenCount ?? outputTokens;
      thinkingTokens = payload.usageMetadata.thoughtsTokenCount ?? thinkingTokens;
    }

    const piece = extractGeminiChunkText(payload);
    if (!piece) return true;

    const nextAccumulated = accumulated + piece;
    if (LEAK_RE.test(nextAccumulated) || !isSafeReply(nextAccumulated)) {
      accumulated = nextAccumulated;
      leaked = true;
      return false;
    }

    accumulated = nextAccumulated;
    emittedAnyChunk = true;
    onDelta(piece, accumulated);
    return true;
  };

  const processLines = (lines: string[]): boolean => {
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const dataStr = line.slice(5).trim();
      if (!dataStr || dataStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(dataStr) as GeminiResponse;
        parsedSsePayloads++;
        if (!processPayload(parsed)) {
          return false;
        }
      } catch {
        // Ignore partial or malformed line
      }
    }
    return true;
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      const decoded = decoder.decode(value, { stream: true });
      rawAll += decoded;
      buffer += decoded.replace(/\r\n/g, '\n');

      const lastNewline = buffer.lastIndexOf('\n');
      if (lastNewline !== -1) {
        const completeChunk = buffer.slice(0, lastNewline);
        buffer = buffer.slice(lastNewline + 1);
        const keepGoing = processLines(completeChunk.split('\n'));
        if (!keepGoing) {
          await reader.cancel().catch(() => {});
          return {
            ok: true,
            accumulated,
            leaked: true,
            emittedAnyChunk,
            promptTokens,
            outputTokens,
            thinkingTokens
          };
        }
      }
    }

    const tail = decoder.decode();
    rawAll += tail;
    buffer += tail.replace(/\r\n/g, '\n');
    if (buffer.trim()) {
      const keepGoing = processLines(buffer.split('\n'));
      if (!keepGoing) {
        return {
          ok: true,
          accumulated,
          leaked: true,
          emittedAnyChunk,
          promptTokens,
          outputTokens,
          thinkingTokens
        };
      }
    }

    // Fallback for non-SSE JSON response bodies (such as unit test mocks returning application/json)
    if (parsedSsePayloads === 0 && rawAll.trim()) {
      try {
        const parsed = JSON.parse(rawAll.trim()) as GeminiResponse | GeminiResponse[];
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (!processPayload(item)) {
            return {
              ok: true,
              accumulated,
              leaked: true,
              emittedAnyChunk,
              promptTokens,
              outputTokens,
              thinkingTokens
            };
          }
        }
      } catch {
        // Not valid JSON either
      }
    }
  } catch (err) {
    await reader.cancel().catch(() => {});
    if (!emittedAnyChunk) {
      throw err;
    }
    return {
      ok: false,
      accumulated,
      leaked,
      streamError: true,
      emittedAnyChunk,
      promptTokens,
      outputTokens,
      thinkingTokens
    };
  }

  return {
    ok: emittedAnyChunk || leaked,
    accumulated,
    leaked,
    streamError: false,
    emittedAnyChunk,
    promptTokens,
    outputTokens,
    thinkingTokens
  };
}

function scheduleBackground(ctx: ExecutionContextLike | undefined, task: Promise<unknown>): void {
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(task);
  } else {
    void task.catch(() => {});
  }
}

async function handleChat(
  request: Request,
  env: PortfolioBindings,
  ctx?: ExecutionContextLike
): Promise<Response> {
  if (!isAllowedChatOrigin(request)) {
    return json(403, { error: 'Origem não autorizada.' });
  }
  if (!hasJsonContentType(request)) {
    return json(415, { error: 'Use Content-Type: application/json.' });
  }

  const ip = clientIp(request);
  if (!(await allowed(env.CHAT_LIMIT, ip))) {
    return json(429, {
      error: 'Muitas perguntas em pouco tempo. Tente de novo em alguns minutos ou fale direto com o Pedro por e-mail.',
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
    const issueMsg = parsed.error.issues[0]?.message ?? 'Entrada inválida.';
    return json(400, {
      error: issueMsg,
      reply: `**${issueMsg}**`,
      source: 'local'
    });
  }

  const { message, history, reasoning, skill, regenerate } = parsed.data;

  if (reasoning === 'high' && !(await allowed(env.CHAT_HIGH_LIMIT, ip))) {
    return json(429, {
      error: 'Limite de consultas no modo Profundo atingido. Tente o modo Padrão ou Rápido.',
      reply: 'Limite de consultas no modo Profundo atingido. Tente o modo Padrão ou Rápido.',
      source: 'local'
    });
  }

  const trimmedHistory = trimHistoryToBudget(history, HISTORY_CHAR_BUDGET);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: ChatSseEvent) => {
        controller.enqueue(encoder.encode(formatSseEvent(event)));
      };

      try {
        // 1. Check first-turn KV suggestion cache (0 tokens), bypassed on explicit regenerate
        const cachedReply = regenerate
          ? null
          : await getCachedSuggestionReply(env, message, trimmedHistory, skill, reasoning);
        if (cachedReply) {
          emit({ type: 'delta', text: cachedReply });
          const cards = inferContextualCards(message, cachedReply, skill);
          if (cards.length > 0) emit({ type: 'cards', cards });
          const actions = inferContextualActions(message, cachedReply);
          if (actions.length > 0) emit({ type: 'actions', actions });
          emit({ type: 'done' });
          scheduleBackground(
            ctx,
            logQuestion(env, {
              text: message,
              reasoning,
              leaked: false,
              promptTokens: 0,
              outputTokens: 0,
              thinkingTokens: 0
            })
          );
          controller.close();
          return;
        }

        // 2. Check daily D1 circuit breaker
        const budgetDecision = await evaluateBudgetCircuitBreaker(env, reasoning);
        if (budgetDecision.status === 'hard_exceeded') {
          emit({
            type: 'notice',
            text: 'Cota diária de demonstração atingida.'
          });
          emit({ type: 'delta', text: budgetDecision.reply });
          const cards = inferContextualCards(message, budgetDecision.reply, skill);
          if (cards.length > 0) emit({ type: 'cards', cards });
          const actions = inferContextualActions(message, budgetDecision.reply);
          if (actions.length > 0) emit({ type: 'actions', actions });
          emit({ type: 'done' });
          controller.close();
          return;
        }

        if (budgetDecision.status === 'soft_downgraded') {
          emit({ type: 'notice', text: budgetDecision.notice });
        }

        const effectiveReasoning = budgetDecision.effectiveReasoning;
        const apiKey = env.GEMINI_API_KEY?.trim();

        if (!apiKey) {
          emit({ type: 'delta', text: UNAVAILABLE_REPLY });
          const actions = inferContextualActions(message, '');
          if (actions.length > 0) emit({ type: 'actions', actions });
          emit({ type: 'done' });
          controller.close();
          return;
        }

        const profile = getReasoningProfile(env, effectiveReasoning);
        const systemInstruction = buildSystemPrompt(DEFAULT_PORTFOLIO_DATA);
        const userPrompt = buildUserPrompt({ message, history: trimmedHistory, skill });

        const contents = [
          ...trimmedHistory.map((turn) => ({
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
          { role: 'user' as const, parts: [{ text: userPrompt }] }
        ];

        let finalResult: StreamGeminiResult | null = null;

        for (const model of profile.models) {
          if (request.signal?.aborted) break;
          try {
            const res = await streamFromSingleModel(
              model,
              apiKey,
              profile,
              systemInstruction,
              contents,
              request.signal,
              (chunkText) => {
                emit({ type: 'delta', text: chunkText });
              }
            );

            if (res.leaked || res.streamError) {
              finalResult = res;
              break;
            }

            if (res.emittedAnyChunk) {
              finalResult = res;
              break;
            }
          } catch (err) {
            console.error(`[gemini] model=${model} fetch_error=${err instanceof Error ? err.message : String(err)}`);
            // Model failed before first chunk was emitted: try next model in fallback list
            continue;
          }
        }

        if (request.signal?.aborted) {
          controller.close();
          return;
        }

        if (finalResult?.streamError) {
          emit({ type: 'error', reply: UNAVAILABLE_REPLY });
          emit({ type: 'done' });
          controller.close();
          return;
        }

        if (finalResult?.leaked) {
          emit({ type: 'retract', reply: SAFE_RETRACT_REPLY });
          emit({ type: 'done' });
          scheduleBackground(
            ctx,
            logQuestion(env, {
              text: message,
              reasoning: effectiveReasoning,
              leaked: true,
              promptTokens: finalResult.promptTokens,
              outputTokens: finalResult.outputTokens,
              thinkingTokens: finalResult.thinkingTokens
            })
          );
          controller.close();
          return;
        }

        const accumulated = finalResult?.accumulated?.trim() ?? '';
        if (!accumulated || !isSafeReply(accumulated)) {
          if (finalResult?.emittedAnyChunk) {
            emit({ type: 'retract', reply: SAFE_RETRACT_REPLY });
            emit({ type: 'done' });
          } else {
            emit({ type: 'delta', text: UNAVAILABLE_REPLY });
            const actions = inferContextualActions(message, '');
            if (actions.length > 0) emit({ type: 'actions', actions });
            emit({ type: 'done' });
          }
          controller.close();
          return;
        }

        const cards = inferContextualCards(message, accumulated, skill);
        if (cards.length > 0) {
          emit({ type: 'cards', cards });
        }

        const actions = inferContextualActions(message, accumulated);
        if (actions.length > 0) {
          emit({ type: 'actions', actions });
        }

        emit({ type: 'done' });

        const estimatedPromptTokens =
          finalResult && finalResult.promptTokens > 0
            ? finalResult.promptTokens
            : Math.ceil((systemInstruction.length + userPrompt.length) / 4);
        const estimatedOutputTokens =
          finalResult && finalResult.outputTokens > 0
            ? finalResult.outputTokens
            : Math.ceil(accumulated.length / 4);
        const estimatedThinkingTokens = finalResult?.thinkingTokens ?? 0;

        scheduleBackground(
          ctx,
          Promise.all([
            cacheSuggestionReplyIfEligible(
              env,
              message,
              trimmedHistory,
              skill,
              accumulated,
              effectiveReasoning
            ),
            logQuestion(env, {
              text: message,
              reasoning: effectiveReasoning,
              leaked: false,
              promptTokens: estimatedPromptTokens,
              outputTokens: estimatedOutputTokens,
              thinkingTokens: estimatedThinkingTokens
            })
          ])
        );

        controller.close();
      } catch {
        try {
          emit({ type: 'error', reply: UNAVAILABLE_REPLY });
          emit({ type: 'done' });
        } catch {
          // Ignore enqueue on closed stream
        }
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      ...SECURITY_HEADERS
    }
  });
}

async function handleSuggestions(request: Request, env: PortfolioBindings): Promise<Response> {
  const payload = await getSuggestions(env);
  const body = JSON.stringify(payload);
  return new Response(request.method === 'HEAD' ? null : body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      ...SECURITY_HEADERS
    }
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

  if (pathname === '/cv.md') {
    return { body: generateCvMarkdown(data, origin), contentType: 'text/markdown; charset=utf-8' };
  }

  if (pathname === '/cv.json') {
    return {
      body: JSON.stringify(generateCvJsonResume(data, origin), null, 2),
      contentType: 'application/json; charset=utf-8'
    };
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

function isBlockedAdminOrStudioPath(pathname: string): boolean {
  return (
    pathname === '/studio' ||
    pathname.startsWith('/studio/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  );
}

export async function handlePortfolioRequest(
  request: Request,
  env: PortfolioBindings,
  ctx?: ExecutionContextLike
): Promise<Response | null> {
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

  if (
    isBlockedAdminOrStudioPath(pathname) ||
    pathname === '/.well-known' ||
    pathname.startsWith('/.well-known/')
  ) {
    return text(404, 'Not found', 'text/plain; charset=utf-8', { 'Cache-Control': 'no-store' });
  }

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY) {
    return json(413, { error: 'Pedido grande demais.' });
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    const document = machineDocument(url);
    if (document) return documentResponse(document, request.method);

    if (pathname === '/api/suggestions') {
      return handleSuggestions(request, env);
    }
  }

  if (pathname === '/api/chat' && request.method === 'POST') {
    return handleChat(request, env, ctx);
  }

  if (pathname === '/api/contact' && request.method === 'POST') {
    return handleContact(request, env);
  }

  if (pathname.startsWith('/api/')) {
    return json(404, { error: 'Não encontrado.' });
  }

  return null;
}
