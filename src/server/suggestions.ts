import { z } from 'zod';
import {
  DEFAULT_SUGGESTIONS,
  type Reasoning,
  type SuggestionsResponse
} from '../utils/chat.ts';
import { isSafeReply } from './assistant.ts';
import { type D1DatabaseLike, type KvNamespaceLike } from './budget.ts';
import { getReasoningProfile, type ReasoningEnv } from './reasoning.ts';

export const QUESTION_TEXT_MAX_LEN = 500;
export const RETENTION_DAYS = 30;
export const CURATION_WINDOW_DAYS = 7;
export const CURATION_MAX_UNIQUE = 200;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>()"']+/gi;
const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}\b/g;
const MASK_TOKEN_RE = /\[(email|url|cpf|telefone)\]/i;

export function sanitizeQuestionText(raw: string, maxLen: number = QUESTION_TEXT_MAX_LEN): string {
  const cleaned = raw
    .replace(URL_RE, '[url]')
    .replace(EMAIL_RE, '[email]')
    .replace(CPF_RE, '[cpf]')
    .replace(PHONE_RE, '[telefone]')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLen) {
    return cleaned;
  }
  return cleaned.slice(0, maxLen).trimEnd();
}

export interface LogQuestionInput {
  text: string;
  reasoning: Reasoning;
  leaked?: boolean;
  promptTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
  askedAt?: Date;
}

export interface SuggestionsEnv extends ReasoningEnv {
  GEMINI_API_KEY?: string;
  INBOX?: KvNamespaceLike;
  QUESTIONS?: D1DatabaseLike;
}

export async function logQuestion(
  env: Pick<SuggestionsEnv, 'QUESTIONS'>,
  input: LogQuestionInput
): Promise<void> {
  const promptTokens = Math.max(0, Math.floor(input.promptTokens ?? 0));
  const outputTokens = Math.max(0, Math.floor(input.outputTokens ?? 0));
  const thinkingTokens = Math.max(0, Math.floor(input.thinkingTokens ?? 0));
  const now = input.askedAt ?? new Date();

  if (!env.QUESTIONS) return;

  const sanitized = sanitizeQuestionText(input.text, QUESTION_TEXT_MAX_LEN);
  if (!sanitized) return;

  try {
    await env.QUESTIONS.prepare(
      'INSERT INTO questions (asked_at, text, reasoning, leaked, prompt_tokens, output_tokens, thinking_tokens) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        now.toISOString(),
        sanitized,
        input.reasoning,
        input.leaked ? 1 : 0,
        promptTokens,
        outputTokens,
        thinkingTokens
      )
      .run();
  } catch {
    // Do not fail user requests if telemetry insert fails
  }
}

const CuratedPayloadSchema = z.object({
  featured: z.array(z.string().trim().min(6).max(110)).min(1).max(6),
  breakers: z.array(z.string().trim().min(6).max(110)).min(1).max(4),
  week: z.string().nullable().optional()
});

const COMPANY_MENTION_RE = /\b(atlas(\s+governance|\s+sign|\s+plg)?|nelogica|lojas?\s+lebes|lebes)\b/i;

function cleanCuratedList(items: string[], maxItems: number, blockCompanies = false): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of items) {
    const sanitized = sanitizeQuestionText(item, 110).replace(/[\u2013\u2014]/g, '-');
    if (sanitized.length < 6) continue;
    if (MASK_TOKEN_RE.test(sanitized)) continue;
    if (!isSafeReply(sanitized)) continue;
    if (blockCompanies && COMPANY_MENTION_RE.test(sanitized)) continue;

    const key = sanitized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(sanitized);
    if (out.length >= maxItems) break;
  }

  return out;
}

export function formatIsoWeek(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function parseStoredSuggestions(raw: string | null): SuggestionsResponse | null {
  if (!raw) return null;
  try {
    const parsedJson = JSON.parse(raw);
    const parsed = CuratedPayloadSchema.safeParse(parsedJson);
    if (!parsed.success) return null;

    const featured = cleanCuratedList(parsed.data.featured, 4, true);
    const breakers = cleanCuratedList(parsed.data.breakers, 3);
    if (featured.length === 0 || breakers.length === 0) return null;

    return {
      featured,
      breakers,
      week: parsed.data.week ?? null
    };
  } catch {
    return null;
  }
}

export async function getSuggestions(env?: Pick<SuggestionsEnv, 'INBOX'>): Promise<SuggestionsResponse> {
  if (env?.INBOX?.get) {
    for (const key of ['suggestions:pinned', 'suggestions:current']) {
      try {
        const raw = await env.INBOX.get(key);
        const parsed = parseStoredSuggestions(raw);
        if (parsed) return parsed;
      } catch {
        // Continue to next fallback
      }
    }
  }

  return {
    featured: [...DEFAULT_SUGGESTIONS.featured],
    breakers: [...DEFAULT_SUGGESTIONS.breakers],
    week: null
  };
}

const CURATION_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    featured: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    breakers: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    }
  },
  required: ['featured', 'breakers']
};

export async function curateWeekly(
  env: SuggestionsEnv,
  now = new Date()
): Promise<SuggestionsResponse | null> {
  if (!env.QUESTIONS) return null;

  const retentionCutoff = new Date(now.getTime() - RETENTION_DAYS * 86_400_000).toISOString();
  const windowCutoff = new Date(now.getTime() - CURATION_WINDOW_DAYS * 86_400_000).toISOString();

  await env.QUESTIONS.prepare('DELETE FROM questions WHERE asked_at < ?').bind(retentionCutoff).run();

  const recent = await env.QUESTIONS.prepare(
    'SELECT text, leaked FROM questions WHERE asked_at >= ? ORDER BY id DESC LIMIT 600'
  )
    .bind(windowCutoff)
    .all<{ text: string; leaked?: number }>();

  const uniqueQuestions: string[] = [];
  const seen = new Set<string>();

  for (const row of recent.results ?? []) {
    if (!row?.text) continue;
    const cleaned = sanitizeQuestionText(row.text, 160);
    if (!cleaned || MASK_TOKEN_RE.test(cleaned)) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueQuestions.push(cleaned);
    if (uniqueQuestions.length >= CURATION_MAX_UNIQUE) break;
  }

  if (uniqueQuestions.length === 0) {
    return null;
  }

  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const fastProfile = getReasoningProfile(env, 'fast');
  const prompt = [
    'Você é o curador semanal de sugestões do portfólio de Pedro Henrique Lopes (Software Engineer Frontend).',
    'A partir da lista de perguntas feitas por visitantes nos últimos 7 dias:',
    '1. Escolha de 3 a 4 perguntas em "featured" sobre experiência técnica, projetos, arquitetura, frontend, backend ou carreira.',
    '2. Escolha 2 perguntas criativas ou desafios em "breakers" (tentativas bem-humoradas ou testes de segurança/escopo do assistente).',
    'Regras estritas: reescreva de forma curta e natural em português (máximo 85 caracteres cada), focando no Pedro e no conhecimento técnico dele. Nunca cite nomes de empresas onde ele trabalhou nem de recrutadores, sem dados pessoais, sem nomes de terceiros, sem emojis e sem travessão.',
    '',
    'Perguntas da semana:',
    ...uniqueQuestions.map((q, idx) => `${idx + 1}. ${q}`)
  ].join('\n');

  for (const model of fastProfile.models) {
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
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: fastProfile.maxOutputTokens,
              responseMimeType: 'application/json',
              responseSchema: CURATION_RESPONSE_SCHEMA,
              thinkingConfig: { thinkingBudget: 0 }
            }
          }),
          signal: AbortSignal.timeout(15_000)
        }
      );

      if (!response.ok) continue;

      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const rawText =
        payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';
      if (!rawText) continue;

      const parsedJson = JSON.parse(rawText);
      const validated = CuratedPayloadSchema.safeParse(parsedJson);
      if (!validated.success) continue;

      const hasLeakedPii = [...validated.data.featured, ...validated.data.breakers].some((item) =>
        MASK_TOKEN_RE.test(sanitizeQuestionText(item, 200))
      );
      if (hasLeakedPii) continue;

      const featured = cleanCuratedList(validated.data.featured, 4, true);
      const breakers = cleanCuratedList(validated.data.breakers, 3);
      if (featured.length === 0 || breakers.length === 0) continue;

      const result: SuggestionsResponse = {
        featured,
        breakers,
        week: formatIsoWeek(now)
      };

      if (env.INBOX?.put) {
        await env.INBOX.put('suggestions:current', JSON.stringify(result));
      }

      return result;
    } catch {
      continue;
    }
  }

  return null;
}
