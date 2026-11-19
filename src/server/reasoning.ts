import { z } from 'zod';
import type { Reasoning } from '../utils/chat.ts';

export type ThinkingLevel = 'minimal' | 'low' | 'medium';

export interface ReasoningProfile {
  models: string[];
  temperature: number;
  maxOutputTokens: number;
  thinkingBudget: number;
  thinkingLevel: ThinkingLevel;
}

export type ReasoningProfilesMap = Record<Reasoning, ReasoningProfile>;

export const HARD_CAPS = {
  fast: {
    maxOutputTokens: 450,
    thinkingBudget: 0,
    allowedLevels: ['minimal'] as const,
    defaultLevel: 'minimal' as const
  },
  default: {
    maxOutputTokens: 600,
    thinkingBudget: 1024,
    allowedLevels: ['minimal', 'low'] as const,
    defaultLevel: 'low' as const
  },
  high: {
    maxOutputTokens: 900,
    thinkingBudget: 4096,
    allowedLevels: ['minimal', 'low', 'medium'] as const,
    defaultLevel: 'medium' as const
  }
} as const;

export const DEFAULT_PROFILES: ReasoningProfilesMap = {
  fast: {
    models: ['gemini-3.5-flash-lite', 'gemini-3.8-flash'],
    temperature: 0.25,
    maxOutputTokens: 450,
    thinkingBudget: 0,
    thinkingLevel: 'minimal'
  },
  default: {
    models: ['gemini-3.8-flash', 'gemini-3.5-flash-lite'],
    temperature: 0.3,
    maxOutputTokens: 600,
    thinkingBudget: 512,
    thinkingLevel: 'low'
  },
  high: {
    models: ['gemini-3.8-flash', 'gemini-3.5-flash-lite'],
    temperature: 0.3,
    maxOutputTokens: 900,
    thinkingBudget: 2048,
    thinkingLevel: 'medium'
  }
};

const RawProfileInputSchema = z
  .object({
    models: z.union([z.array(z.string()), z.string()]).optional(),
    model: z.string().optional(),
    temperature: z.number().optional(),
    maxOutputTokens: z.number().optional(),
    thinkingBudget: z.number().optional(),
    thinkingLevel: z.string().optional()
  })
  .passthrough();

const RawProfilesEnvelopeSchema = z
  .object({
    fast: RawProfileInputSchema.optional(),
    default: RawProfileInputSchema.optional(),
    high: RawProfileInputSchema.optional()
  })
  .passthrough();

function parseModelsList(
  rawModels: string[] | string | undefined,
  rawSingleModel: string | undefined,
  fallback: string[]
): string[] {
  if (Array.isArray(rawModels)) {
    const cleaned = rawModels.map((item) => item.trim()).filter(Boolean);
    if (cleaned.length > 0) return cleaned;
  } else if (typeof rawModels === 'string') {
    const cleaned = rawModels
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (cleaned.length > 0) return cleaned;
  }

  if (typeof rawSingleModel === 'string' && rawSingleModel.trim()) {
    return [rawSingleModel.trim()];
  }

  return [...fallback];
}

function clampProfile(
  tier: Reasoning,
  raw: z.infer<typeof RawProfileInputSchema> | undefined,
  fallbackModels?: string[]
): ReasoningProfile {
  const base = DEFAULT_PROFILES[tier];
  const cap = HARD_CAPS[tier];
  const defaultModels = fallbackModels && fallbackModels.length > 0 ? fallbackModels : base.models;

  if (!raw) {
    return {
      ...base,
      models: [...defaultModels]
    };
  }

  const models = parseModelsList(raw.models, raw.model, defaultModels);

  const rawTemp = typeof raw.temperature === 'number' && Number.isFinite(raw.temperature)
    ? raw.temperature
    : base.temperature;
  const temperature = Math.max(0, Math.min(1, rawTemp));

  const rawMaxOut =
    typeof raw.maxOutputTokens === 'number' && Number.isFinite(raw.maxOutputTokens) && raw.maxOutputTokens > 0
      ? Math.floor(raw.maxOutputTokens)
      : base.maxOutputTokens;
  const maxOutputTokens = Math.max(64, Math.min(rawMaxOut, cap.maxOutputTokens));

  let thinkingBudget = base.thinkingBudget;
  if (tier === 'fast') {
    thinkingBudget = 0;
  } else if (typeof raw.thinkingBudget === 'number' && Number.isFinite(raw.thinkingBudget)) {
    // Never allow -1 (dynamic thinking) or negative values; clamp strictly to [0, cap.thinkingBudget]
    const normalizedBudget = raw.thinkingBudget < 0 ? cap.thinkingBudget : Math.floor(raw.thinkingBudget);
    thinkingBudget = Math.max(0, Math.min(normalizedBudget, cap.thinkingBudget));
  }

  let thinkingLevel: ThinkingLevel = cap.defaultLevel;
  if (
    typeof raw.thinkingLevel === 'string' &&
    (cap.allowedLevels as readonly string[]).includes(raw.thinkingLevel)
  ) {
    thinkingLevel = raw.thinkingLevel as ThinkingLevel;
  }

  return {
    models,
    temperature,
    maxOutputTokens,
    thinkingBudget,
    thinkingLevel
  };
}

export interface ReasoningEnv {
  REASONING_PROFILES?: string;
  GEMINI_MODELS?: string;
}

export function resolveReasoningProfiles(env?: ReasoningEnv): ReasoningProfilesMap {
  const envFallbackModels = env?.GEMINI_MODELS
    ? env.GEMINI_MODELS.split(',')
        .map((m) => m.trim())
        .filter(Boolean)
    : undefined;

  const rawJson = env?.REASONING_PROFILES?.trim();
  if (!rawJson) {
    return {
      fast: clampProfile('fast', undefined, envFallbackModels),
      default: clampProfile('default', undefined, envFallbackModels),
      high: clampProfile('high', undefined, envFallbackModels)
    };
  }

  try {
    const parsedJson = JSON.parse(rawJson);
    const parsed = RawProfilesEnvelopeSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return {
        fast: clampProfile('fast', undefined, envFallbackModels),
        default: clampProfile('default', undefined, envFallbackModels),
        high: clampProfile('high', undefined, envFallbackModels)
      };
    }

    return {
      fast: clampProfile('fast', parsed.data.fast, envFallbackModels),
      default: clampProfile('default', parsed.data.default, envFallbackModels),
      high: clampProfile('high', parsed.data.high, envFallbackModels)
    };
  } catch {
    return {
      fast: clampProfile('fast', undefined, envFallbackModels),
      default: clampProfile('default', undefined, envFallbackModels),
      high: clampProfile('high', undefined, envFallbackModels)
    };
  }
}

export function getReasoningProfile(env: ReasoningEnv | undefined, reasoning: Reasoning): ReasoningProfile {
  const profiles = resolveReasoningProfiles(env);
  return profiles[reasoning] ?? profiles.default;
}

const THINKING_LEVEL_MODEL_RE = /^gemini-(?:[3-9]|\d{2,})(?:[.-]|$)/i;

export function usesThinkingLevel(model?: string): boolean {
  return typeof model === 'string' && THINKING_LEVEL_MODEL_RE.test(model.trim());
}

export function buildGenerationConfig(
  profile: ReasoningProfile,
  model?: string
): Record<string, unknown> {
  const targetModel = model ?? profile.models[0];
  const thinkingConfig = usesThinkingLevel(targetModel)
    ? { thinkingLevel: profile.thinkingLevel }
    : { thinkingBudget: profile.thinkingBudget };

  return {
    temperature: profile.temperature,
    maxOutputTokens: profile.maxOutputTokens,
    thinkingConfig
  };
}
