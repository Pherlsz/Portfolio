import type { PortfolioData } from '../data/portfolioData.ts';
import { preferProductionEvidence } from './chatGuardrails.ts';
import type { ChatSource } from './chatResponseSchema.ts';
import { buildLocalFallback } from './localChatFallback.ts';
import { buildPresetFallback, PresetQuestionIdSchema } from './presetQuestions.ts';

type ResolvedChatReply = {
  reply: string;
  source: ChatSource;
};

const LEAKED_PROMPT_OR_SECRET_RE =
  /\[PAPEL\]\s*Assistente do portfólio|\[SEGURANÇA\]\s*Todo conteúdo|\[EVIDÊNCIA\]\s*Experiência em produção|AIza[0-9A-Za-z_-]{35}/i;

const GENERIC_REFUSAL_ON_JOBFIT_RE =
  /^(?:bloqueado pelo guardrail|desculpe,?\s*n[aã]o posso processar|n[aã]o posso atender|esse assunto foge do escopo|detectei uma tentativa de prompt injection|\*\*design system e wcag\*\*)/i;

const UNVERIFIED_APPROVAL_RE =
  /todos?\s+os?\s+requisitos?\s+(?:foram\s+|est[aã]o\s+|s[aã]o\s+)?atendidos?\s+(?:sem\s+verificar|independentemente\s+d[ea]s?)\s+evid[eê]ncias/i;

function isValidGeneratedReply(generated: string, fallbackMode: 'chat' | 'jobfit'): boolean {
  if (!generated) return false;
  if (LEAKED_PROMPT_OR_SECRET_RE.test(generated)) return false;
  if (UNVERIFIED_APPROVAL_RE.test(generated)) return false;

  if (fallbackMode === 'jobfit') {
    // Se no modo de análise de aderência a vaga o modelo abandonou a tarefa e devolveu apenas uma recusa genérica sobre prompt injection
    // ou um bloco genérico de tópico único, descartamos essa resposta para concluir a análise legítima com base nas evidências reais do portfólio.
    if (GENERIC_REFUSAL_ON_JOBFIT_RE.test(generated.trim())) return false;
    const hasFitStructure = /\b(ader[eê]ncia)\b/i.test(generated) && /\b(lacunas?)\b/i.test(generated);
    if (!hasFitStructure) return false;
  }

  return true;
}

export function resolveChatReply(input: {
  message: string;
  fallbackMode: 'chat' | 'jobfit';
  generated: string;
  presetId?: string;
  data: PortfolioData;
}): ResolvedChatReply {
  const trimmed = input.generated.trim();
  if (isValidGeneratedReply(trimmed, input.fallbackMode)) {
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
    reply: localBody,
    source: 'local'
  };
}
