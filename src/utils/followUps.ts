import type { PortfolioData } from '../data/portfolioData.ts';
import { mentionsPersonalProject, type ChatMode } from './chatGuardrails.ts';
import { presetChipText } from './presetQuestions.ts';

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

export function suggestFollowUps(input: {
  mode: ChatMode;
  asked: string;
  reply: string;
  job?: string;
  isFollowUp?: boolean;
  data: PortfolioData;
}): string[] {
  const { mode, asked, reply, job, isFollowUp, data } = input;
  const q = fold(asked);
  const r = fold(reply);
  const jd = fold(job ?? '');
  const combined = `${q} ${r} ${jd}`;

  const pick = (...candidates: string[]) =>
    unique(candidates.filter((chip) => !alreadyAsked(asked, chip))).slice(0, 3);

  if (mode === 'jobfit') {
    const fromJd = jd || q;
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
    return pick(...chips);
  }

  const chips: string[] = [];
  if (mentionsPersonalProject(asked, data) || /\bprojet/.test(q)) {
    chips.push('Qual a stack desse projeto?', 'Ele usa isso em produção?');
  } else if (/wcag|acessib|design system/.test(combined)) {
    chips.push(presetChipText('accessibility_testing'), presetChipText('atlas_list_performance'));
  } else if (/atlas|sign|plg|experi|carreira|trabalh/.test(combined)) {
    chips.push(
      presetChipText('design_system_wcag'),
      presetChipText('atlas_sign_performance'),
      presetChipText('atlas_ai')
    );
  } else if (/stack|tecnolog|skill/.test(combined)) {
    chips.push(presetChipText('production_backend'), presetChipText('atlas_testing'));
  } else if (/salar|remoto|hibrid|senioridade|pleno|pretens/.test(combined)) {
    chips.push(presetChipText('compare_job_fit'));
  }

  chips.push(
    presetChipText('experience'),
    presetChipText('recruiter_summary'),
    presetChipText('design_system_wcag')
  );
  return pick(...chips);
}
