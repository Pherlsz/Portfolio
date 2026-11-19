import {
  DEFAULT_SUGGESTIONS,
  HISTORY_CHAR_BUDGET,
  SUGGESTED_QUESTIONS,
  type ChatSkill,
  type Reasoning
} from '../utils/chat.ts';
import { isSafeReply } from './assistant.ts';

export const MODEL_TURN_CHAR_LIMIT = 1200;
export const DEFAULT_DAILY_SOFT_BUDGET = 250_000;
export const DEFAULT_DAILY_HARD_BUDGET = 500_000;
export const BUDGET_CACHE_TTL_MS = 60_000;
export const SUGGESTION_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface HistoryTurn {
  role: 'user' | 'model';
  text: string;
}

export interface KvNamespaceLike {
  get?(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

export interface BudgetEnv {
  INBOX?: KvNamespaceLike;
  QUESTIONS?: D1DatabaseLike;
  DAILY_SOFT_BUDGET?: string | number;
  DAILY_HARD_BUDGET?: string | number;
}

export function trimHistoryToBudget(
  history: HistoryTurn[],
  charBudget: number = HISTORY_CHAR_BUDGET,
  modelTurnLimit: number = MODEL_TURN_CHAR_LIMIT
): HistoryTurn[] {
  if (!history.length || charBudget <= 0) return [];

  const truncated = history.map((turn) => {
    if (turn.role === 'model' && turn.text.length > modelTurnLimit) {
      return {
        role: turn.role,
        text: `${turn.text.slice(0, Math.max(0, modelTurnLimit - 3)).trimEnd()}...`
      };
    }
    return { role: turn.role, text: turn.text };
  });

  const selectedReversed: HistoryTurn[] = [];
  let usedChars = 0;

  for (let i = truncated.length - 1; i >= 0; i--) {
    const turn = truncated[i];
    const len = turn.text.length;
    if (usedChars + len > charBudget) {
      if (selectedReversed.length === 0 && len > 0) {
        selectedReversed.push({
          role: turn.role,
          text: turn.text.slice(0, charBudget)
        });
      }
      break;
    }
    selectedReversed.push(turn);
    usedChars += len;
  }

  const ordered = selectedReversed.reverse();
  const firstUserIdx = ordered.findIndex((turn) => turn.role === 'user');
  return firstUserIdx === -1 ? [] : ordered.slice(firstUserIdx);
}

export function normalizeSuggestionPrompt(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function hashSuggestionPrompt(text: string): string {
  const normalized = normalizeSuggestionPrompt(text);
  let h1 = 0xdeadbeef ^ normalized.length;
  let h2 = 0x41c6ce57 ^ normalized.length;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${hex1}${hex2}`;
}

export function suggestionCacheKey(text: string): string {
  return `cache:sug:${hashSuggestionPrompt(text)}`;
}

async function loadKnownSuggestionsSet(env?: BudgetEnv): Promise<Set<string>> {
  const known = new Set<string>();
  for (const item of DEFAULT_SUGGESTIONS.featured) {
    known.add(normalizeSuggestionPrompt(item));
  }
  for (const item of DEFAULT_SUGGESTIONS.breakers) {
    known.add(normalizeSuggestionPrompt(item));
  }
  for (const item of SUGGESTED_QUESTIONS) {
    known.add(normalizeSuggestionPrompt(item));
  }

  if (env?.INBOX?.get) {
    for (const kvKey of ['suggestions:pinned', 'suggestions:current']) {
      try {
        const raw = await env.INBOX.get(kvKey);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as { featured?: unknown; breakers?: unknown };
        if (Array.isArray(parsed.featured)) {
          for (const item of parsed.featured) {
            if (typeof item === 'string') known.add(normalizeSuggestionPrompt(item));
          }
        }
        if (Array.isArray(parsed.breakers)) {
          for (const item of parsed.breakers) {
            if (typeof item === 'string') known.add(normalizeSuggestionPrompt(item));
          }
        }
      } catch {
        // Ignore malformed KV entries
      }
    }
  }

  return known;
}

export async function isKnownSuggestionPrompt(env: BudgetEnv | undefined, message: string): Promise<boolean> {
  const normalized = normalizeSuggestionPrompt(message);
  if (!normalized) return false;
  const known = await loadKnownSuggestionsSet(env);
  return known.has(normalized);
}

export async function getCachedSuggestionReply(
  env: BudgetEnv | undefined,
  message: string,
  history: HistoryTurn[],
  skill?: ChatSkill
): Promise<string | null> {
  if (history.length > 0 || skill || !env?.INBOX?.get) {
    return null;
  }

  if (!(await isKnownSuggestionPrompt(env, message))) {
    return null;
  }

  try {
    const raw = await env.INBOX.get(suggestionCacheKey(message));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { reply?: unknown };
      if (typeof parsed.reply === 'string' && isSafeReply(parsed.reply)) {
        return parsed.reply;
      }
    } catch {
      if (isSafeReply(raw)) return raw;
    }
  } catch {
    return null;
  }

  return null;
}

export async function cacheSuggestionReplyIfEligible(
  env: BudgetEnv | undefined,
  message: string,
  history: HistoryTurn[],
  skill: ChatSkill | undefined,
  reply: string
): Promise<void> {
  if (history.length > 0 || skill || !env?.INBOX?.put || !isSafeReply(reply)) {
    return;
  }

  if (!(await isKnownSuggestionPrompt(env, message))) {
    return;
  }

  try {
    await env.INBOX.put(
      suggestionCacheKey(message),
      JSON.stringify({ reply, cachedAt: new Date().toISOString() }),
      { expirationTtl: SUGGESTION_CACHE_TTL_SECONDS }
    );
  } catch {
    // Best-effort KV caching
  }
}

let isolateUsageCache: {
  dayKey: string;
  totalTokens: number;
  expiresAt: number;
} | null = null;

export function resetBudgetCacheForTests(): void {
  isolateUsageCache = null;
}

export function recordTokensInMemoryCache(tokensDelta: number, now = new Date()): void {
  if (!Number.isFinite(tokensDelta) || tokensDelta <= 0) return;
  const dayKey = now.toISOString().slice(0, 10);
  if (isolateUsageCache && isolateUsageCache.dayKey === dayKey) {
    isolateUsageCache.totalTokens += Math.floor(tokensDelta);
  } else {
    isolateUsageCache = {
      dayKey,
      totalTokens: Math.floor(tokensDelta),
      expiresAt: Date.now() + BUDGET_CACHE_TTL_MS
    };
  }
}

function parsePositiveBudget(raw: string | number | undefined, fallback: number): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw);
  }
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw.trim());
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
  }
  return fallback;
}

export async function getDailyTokenUsage(env: BudgetEnv | undefined, now = new Date()): Promise<number> {
  const dayKey = now.toISOString().slice(0, 10);
  const nowMs = Date.now();

  if (isolateUsageCache && isolateUsageCache.dayKey === dayKey && nowMs < isolateUsageCache.expiresAt) {
    return isolateUsageCache.totalTokens;
  }

  if (!env?.QUESTIONS) {
    return isolateUsageCache?.dayKey === dayKey ? isolateUsageCache.totalTokens : 0;
  }

  const dayStartIso = `${dayKey}T00:00:00.000Z`;
  try {
    const row = await env.QUESTIONS.prepare(
      'SELECT COALESCE(SUM(prompt_tokens + output_tokens + thinking_tokens), 0) AS total_tokens FROM questions WHERE asked_at >= ?'
    )
      .bind(dayStartIso)
      .first<{ total_tokens?: number | string }>();

    const total = Number(row?.total_tokens ?? 0);
    const totalTokens = Number.isFinite(total) && total >= 0 ? Math.floor(total) : 0;

    isolateUsageCache = {
      dayKey,
      totalTokens,
      expiresAt: nowMs + BUDGET_CACHE_TTL_MS
    };
    return totalTokens;
  } catch {
    return isolateUsageCache?.dayKey === dayKey ? isolateUsageCache.totalTokens : 0;
  }
}

export type CircuitBreakerDecision =
  | {
      status: 'ok';
      effectiveReasoning: Reasoning;
      totalTokens: number;
    }
  | {
      status: 'soft_downgraded';
      effectiveReasoning: 'fast';
      totalTokens: number;
      notice: string;
    }
  | {
      status: 'hard_exceeded';
      effectiveReasoning: 'fast';
      totalTokens: number;
      reply: string;
    };

export const HARD_BUDGET_UNAVAILABLE_REPLY =
  'A cota diária do assistente foi atingida hoje. Você ainda pode explorar **Experiência**, **Projetos** e **Estudos** pelo menu lateral ou baixar o CV completo.';

export const SOFT_BUDGET_DOWNGRADE_NOTICE =
  'Modo Rápido ativado automaticamente para manter o assistente disponível dentro da cota diária.';

export async function evaluateBudgetCircuitBreaker(
  env: BudgetEnv | undefined,
  requestedReasoning: Reasoning,
  now = new Date()
): Promise<CircuitBreakerDecision> {
  const softBudget = parsePositiveBudget(env?.DAILY_SOFT_BUDGET, DEFAULT_DAILY_SOFT_BUDGET);
  const hardBudget = Math.max(
    softBudget,
    parsePositiveBudget(env?.DAILY_HARD_BUDGET, DEFAULT_DAILY_HARD_BUDGET)
  );

  const totalTokens = await getDailyTokenUsage(env, now);

  if (totalTokens >= hardBudget) {
    return {
      status: 'hard_exceeded',
      effectiveReasoning: 'fast',
      totalTokens,
      reply: HARD_BUDGET_UNAVAILABLE_REPLY
    };
  }

  if (totalTokens >= softBudget && requestedReasoning !== 'fast') {
    return {
      status: 'soft_downgraded',
      effectiveReasoning: 'fast',
      totalTokens,
      notice: SOFT_BUDGET_DOWNGRADE_NOTICE
    };
  }

  return {
    status: 'ok',
    effectiveReasoning: requestedReasoning,
    totalTokens
  };
}

export function createUpstreamAbortSignal(
  requestSignal?: AbortSignal | null,
  timeoutMs: number = 15_000
): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!requestSignal) {
    return timeoutSignal;
  }
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([requestSignal, timeoutSignal]);
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (requestSignal.aborted || timeoutSignal.aborted) {
    controller.abort();
    return controller.signal;
  }
  requestSignal.addEventListener('abort', onAbort, { once: true });
  timeoutSignal.addEventListener('abort', onAbort, { once: true });
  return controller.signal;
}
