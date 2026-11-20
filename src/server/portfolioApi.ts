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
  chatCopy,
  obfuscationReply,
  refusesObfuscatedPayload,
  replyLanguage,
  ChatRequestSchema,
  ContactRequestSchema,
  isSafeReply,
  LEAK_RE
} from './assistant.ts';
import {
  cacheSuggestionReplyIfEligible,
  createUpstreamAbortSignal,
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

const KNOWN_STUDY_SLUGS = new Set<string>(STUDIES.map((s) => s.slug));
const KNOWN_ARTICLE_SLUGS = new Set<string>(ARTICLES.map((a) => a.slug));

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
    terms.some((term) => term.length > 0 && combinedFolded.includes(foldText(term)));
  const queryMentions = (...terms: string[]) =>
    terms.some((term) => term.length > 0 && queryFolded.includes(foldText(term)));

  const primaryExperience = DEFAULT_PORTFOLIO_DATA.experiences[0];
  if ((skill === 'vaga' || skill === 'resumo') && primaryExperience) {
    candidates.push({ kind: 'experience', id: primaryExperience.id });
  }

  for (const exp of DEFAULT_PORTFOLIO_DATA.experiences) {
    const companyWords = exp.company.split(/\s+/).filter((w) => w.length >= 4);
    if (mentions(exp.company, exp.id, ...companyWords)) {
      candidates.push({ kind: 'experience', id: exp.id });
    }
  }

  for (const proj of DEFAULT_PORTFOLIO_DATA.projects) {
    if (proj.href === '/v1' || proj.id === 'portfolio-v1') {
      if (
        queryMentions(
          proj.name,
          proj.id,
          '/v1',
          'primeira versao',
          'primeira edicao',
          'adesivos'
        )
      ) {
        candidates.push({ kind: 'v1' });
      }
      continue;
    }

    const moduleTerms = (proj.modules ?? [])
      .map((m) => m.name)
      .filter((name) => name.length >= 6);
    if (mentions(proj.name, proj.id, ...moduleTerms)) {
      candidates.push({ kind: 'project', id: proj.id });
    }
  }

  if (
    queryMentions('projeto', 'projetos', 'github', 'repositorio') &&
    !candidates.some((c) => c.kind === 'project')
  ) {
    for (const proj of DEFAULT_PORTFOLIO_DATA.projects
      .filter((p) => p.href !== '/v1')
      .slice(0, 2)) {
      candidates.push({ kind: 'project', id: proj.id });
    }
  }

  for (const study of STUDIES) {
    const tagTerms = study.tags.filter((tag) => tag.length >= 5);
    if (mentions(study.title, study.slug, ...tagTerms)) {
      candidates.push({ kind: 'study', id: study.slug });
    }
  }

  for (const article of ARTICLES) {
    const tagTerms = article.tags.filter((tag) => tag.length >= 5);
    if (mentions(article.title, article.slug, ...tagTerms)) {
      candidates.push({ kind: 'article', id: article.slug });
    }
  }

  for (const cert of DEFAULT_PORTFOLIO_DATA.certificates) {
    if (mentions(cert.title, cert.code, cert.slug)) {
      candidates.push({ kind: 'certificate', id: cert.slug });
    }
  }
  if (
    mentions('certificado', 'certificados', 'certificacao', 'certificacoes', 'credly') &&
    !candidates.some((c) => c.kind === 'certificate') &&
    DEFAULT_PORTFOLIO_DATA.certificates[0]
  ) {
    candidates.push({
      kind: 'certificate',
      id: DEFAULT_PORTFOLIO_DATA.certificates[0].slug
    });
  }

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
  const mentions = (...terms: string[]) =>
    terms.some((term) => term.length > 0 && combined.includes(foldText(term)));

  const companyNames = DEFAULT_PORTFOLIO_DATA.experiences.map((e) => e.company);
  const projectNames = DEFAULT_PORTFOLIO_DATA.projects.map((p) => p.name);
  const certCodes = DEFAULT_PORTFOLIO_DATA.certificates.map((c) => c.code);

  if (
    visiblePaths.has('/experiencia') &&
    mentions('experi', 'experience', 'career', 'carreira', 'trabalh', ...companyNames)
  ) {
    actions.push({ label: chatCopy(userQuery, 'viewExperience'), type: 'route', value: '/experiencia' });
  }
  if (visiblePaths.has('/projetos') && mentions('projet', 'project', 'ferramenta', 'site', 'tool', ...projectNames)) {
    actions.push({ label: chatCopy(userQuery, 'viewProjects'), type: 'route', value: '/projetos' });
  }
  if (
    visiblePaths.has('/estudos') &&
    mentions('estudo', 'study', 'studies', 'certifica', 'certificate', ...certCodes, ...STUDIES.map((s) => s.title))
  ) {
    actions.push({ label: chatCopy(userQuery, 'viewStudies'), type: 'route', value: '/estudos' });
  }
  if (
    visiblePaths.has('/artigos') &&
    isSectionVisible('articles') &&
    mentions('artigo', 'article', ...ARTICLES.map((a) => a.title))
  ) {
    actions.push({ label: chatCopy(userQuery, 'readArticles'), type: 'route', value: '/artigos' });
  }
  if (mentions('curriculo', 'cv', 'resume', 'contratar', 'recrutador', 'recruiter', 'vaga', 'fit')) {
    actions.push({
      label: chatCopy(userQuery, 'downloadCv'),
      type: 'export_cv',
      value: DEFAULT_PORTFOLIO_DATA.profile.cvUrl
    });
  }
  if (mentions('contato', 'contact', 'e-mail', 'email', 'mensagem', 'message', 'recado', 'falar')) {
    actions.push({ label: chatCopy(userQuery, 'sendNote'), type: 'contact', value: '/contato' });
  }

  if (actions.length === 0) {
    if (visiblePaths.has('/experiencia')) {
      actions.push({ label: chatCopy(userQuery, 'viewExperience'), type: 'route', value: '/experiencia' });
    }
    if (visiblePaths.has('/projetos')) {
      actions.push({ label: chatCopy(userQuery, 'viewProjects'), type: 'route', value: '/projetos' });
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

function localizedIssue(rawMessage: string, issue: string): string {
  if (replyLanguage(rawMessage) !== 'en') return issue;
  const max = issue.match(/^Use no máximo (\d+) caracteres\.$/);
  if (max) return `Use at most ${max[1]} characters.`;
  if (issue === 'Digite uma pergunta.') return 'Type a question.';
  if (issue === 'Entrada inválida.') return 'Invalid input.';
  if (issue === 'Turno vazio.') return 'Empty turn.';
  return issue;
}

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
  const body = await readJsonBody(request);
  if (!body.ok) {
    return json(body.status, { error: BODY_ERRORS[body.status] });
  }

  const parsed = ChatRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    const rawMessage =
      body.value &&
      typeof body.value === 'object' &&
      'message' in body.value &&
      typeof body.value.message === 'string'
        ? body.value.message
        : '';
    const issueMsg = localizedIssue(
      rawMessage,
      parsed.error.issues[0]?.message ?? 'Entrada inválida.'
    );
    return json(400, {
      error: issueMsg,
      reply: `**${issueMsg}**`,
      source: 'local'
    });
  }

  const { message, history, reasoning, skill, regenerate } = parsed.data;

  if (!(await allowed(env.CHAT_LIMIT, ip))) {
    const reply = chatCopy(message, 'rateLimit');
    return json(429, {
      error: reply,
      reply,
      source: 'local',
      actions: [{ label: chatCopy(message, 'downloadCv'), type: 'export_cv', value: 'pdf' }]
    });
  }

  if (reasoning === 'high' && !(await allowed(env.CHAT_HIGH_LIMIT, ip))) {
    const reply = chatCopy(message, 'deepLimit');
    return json(429, {
      error: reply,
      reply,
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

        if (refusesObfuscatedPayload(message)) {
          const reply = obfuscationReply(message);
          emit({ type: 'delta', text: reply });
          const actions = inferContextualActions(message, reply);
          if (actions.length > 0) emit({ type: 'actions', actions });
          emit({ type: 'done' });
          controller.close();
          return;
        }

        const apiKey = env.GEMINI_API_KEY?.trim();

        if (!apiKey) {
          emit({ type: 'delta', text: chatCopy(message, 'unavailable') });
          const actions = inferContextualActions(message, '');
          if (actions.length > 0) emit({ type: 'actions', actions });
          emit({ type: 'done' });
          controller.close();
          return;
        }

        const profile = getReasoningProfile(env, reasoning);
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
          emit({ type: 'error', reply: chatCopy(message, 'unavailable') });
          emit({ type: 'done' });
          controller.close();
          return;
        }

        if (finalResult?.leaked) {
          emit({ type: 'retract', reply: chatCopy(message, 'retract') });
          emit({ type: 'done' });
          scheduleBackground(
            ctx,
            logQuestion(env, {
              text: message,
              reasoning,
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
            emit({ type: 'retract', reply: chatCopy(message, 'retract') });
            emit({ type: 'done' });
          } else {
            emit({ type: 'delta', text: chatCopy(message, 'unavailable') });
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
              reasoning
            ),
            logQuestion(env, {
              text: message,
              reasoning,
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
          emit({ type: 'error', reply: chatCopy(message, 'unavailable') });
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
