import type { PortfolioData } from '../data/portfolioData.ts';
import { preferProductionEvidence } from './chatGuardrails.ts';
import type { ChatSource } from './chatResponseSchema.ts';
import { buildLocalFallback } from './localChatFallback.ts';
import { buildPresetFallback, PresetQuestionIdSchema } from './presetQuestions.ts';

export type ResolvedChatReply = {
  reply: string;
  source: ChatSource;
};

export function resolveChatReply(input: {
  message: string;
  fallbackMode: 'chat' | 'jobfit';
  generated: string;
  presetId?: string;
  data: PortfolioData;
}): ResolvedChatReply {
  const trimmed = input.generated.trim();
  if (trimmed) {
    return {
      reply: preferProductionEvidence(input.message, trimmed, input.data),
      source: 'ai'
    };
  }

  let localBody: string;
  if (input.fallbackMode === 'chat' && input.presetId) {
    const preset = PresetQuestionIdSchema.safeParse(input.presetId);
    localBody = preset.success ? buildPresetFallback(preset.data, input.data) : buildLocalFallback(input.message, input.fallbackMode, input.data);
  } else {
    localBody = buildLocalFallback(input.message, input.fallbackMode, input.data);
  }

  return {
    reply: preferProductionEvidence(input.message, localBody, input.data),
    source: 'local'
  };
}
