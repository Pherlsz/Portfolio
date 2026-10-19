import type { PortfolioData } from '../data/portfolioData.ts';
import { mentionsPersonalProject, type ChatMode } from './chatGuardrails.ts';
import { presetChipText, type PresetQuestionId } from './presetQuestions.ts';

function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = fold(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function alreadyAsked(asked: string, chip: string): boolean {
  const a = fold(asked);
  const c = fold(chip);
  if (!a || !c) return false;
  return a.includes(c.slice(0, 22)) || c.includes(a.slice(0, 22));
}

function presetChips(...ids: PresetQuestionId[]): string[] {
  return ids.map((id) => presetChipText(id));
}

export type FollowUpInput = {
  mode: ChatMode;
  asked: string;
  reply: string;
  job?: string;
  isFollowUp?: boolean;
  data: PortfolioData;
};

function pickFollowUps(asked: string, candidates: string[]): string[] {
  return unique(candidates.filter((chip) => !alreadyAsked(asked, chip))).slice(0, 3);
}

/** Full unsliced chip list before dedupe, alreadyAsked filter, and slice(0, 3). */
function followUpCandidates(input: FollowUpInput): string[] {
  const { mode, asked, reply, job, isFollowUp, data } = input;
  const q = fold(asked);
  const replyAndJob = `${fold(reply)} ${fold(job ?? '')}`;

  if (mode === 'jobfit') {
    const fromJd = fold(job ?? '') || q;
    const chips: string[] = [];
    if (!/senior|staff|principal|pleno|junior/.test(fromJd)) {
      chips.push('E se a vaga for sênior?');
    }
    if (!/teste|vitest|jest|testing library/.test(fromJd)) {
      chips.push('A vaga pede testes automatizados?');
    }
    if (/hibrid/.test(fromJd) && !/porto alegre/.test(fromJd)) {
      chips.push('O híbrido é em Porto Alegre?');
    }
    if (
      /llm|function calling|tool calling|inteligencia artificial/.test(fromJd) ||
      /(?:^|[^a-z0-9+#])ia(?:[^a-z0-9+#]|$)/.test(fromJd)
    ) {
      chips.push('A IA é function calling em fluxo real?');
    }
    if (isFollowUp) {
      chips.push('Quais perguntas eu faço na entrevista?');
    }
    chips.push('Resume em 5 linhas para colar no LinkedIn.');
    return chips;
  }

  const chips: string[] = [];
  if (mentionsPersonalProject(asked, data) || /\bprojet/.test(q)) {
    chips.push('Qual a stack desse projeto?', 'Ele usa isso em produção?');
  } else if (/stack|tecnolog|skill/.test(q)) {
    chips.push(...presetChips('atlas_ai', 'compare_job_fit', 'recruiter_summary'));
  } else if (/salar|remoto|hibrid|senioridade|pleno|pretens/.test(q)) {
    chips.push(presetChipText('compare_job_fit'));
  } else if (
    /wcag|acessib|design system|atlas|sign|plg|experi|carreira|trabalh|ia\b/.test(q) ||
    /wcag|acessib|design system|atlas|sign|plg|experi|carreira|trabalh/.test(replyAndJob)
  ) {
    chips.push(...presetChips('atlas_ai', 'stack', 'recruiter_summary'));
  } else if (/stack|tecnolog|skill/.test(replyAndJob)) {
    chips.push(...presetChips('atlas_ai', 'compare_job_fit'));
  } else if (/salar|remoto|hibrid|senioridade|pleno|pretens/.test(replyAndJob)) {
    chips.push(presetChipText('compare_job_fit'));
  }

  chips.push(...presetChips('recruiter_summary', 'stack', 'atlas_ai', 'compare_job_fit'));
  return chips;
}

export function suggestFollowUps(input: FollowUpInput): string[] {
  const { asked } = input;
  return pickFollowUps(asked, followUpCandidates(input));
}
