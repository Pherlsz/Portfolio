import { z } from 'zod';
import {
  availabilityLine,
  DEFAULT_PORTFOLIO_DATA,
  formatRoleTimeline,
  plainText,
  skillNames,
  type PortfolioData
} from '../data/portfolioData.ts';

export const PRESET_QUESTIONS = [
  { id: 'experience', text: 'Qual a principal experiência dele?' },
  { id: 'recruiter_summary', text: 'Resumo rápido para recrutador' },
  { id: 'design_system_wcag', text: 'Como ficou o design system e a WCAG?' },
  { id: 'atlas_ai', text: 'O que ele fez com IA na Atlas?' },
  { id: 'stack', text: 'Qual a stack principal?' },
  { id: 'accessibility_testing', text: 'Como testavam acessibilidade?' },
  { id: 'atlas_list_performance', text: 'E a performance das listas na Atlas?' },
  { id: 'atlas_sign_performance', text: 'Como mediam performance no Atlas Sign?' },
  { id: 'production_backend', text: 'Qual o backend em produção?' },
  { id: 'atlas_testing', text: 'E testes na Atlas?' },
  { id: 'compare_job_fit', text: 'Quer comparar o perfil com uma vaga?' }
] as const;

export type PresetQuestionId = (typeof PRESET_QUESTIONS)[number]['id'];

export const SUGGESTED_PRESET_IDS: PresetQuestionId[] = [
  'experience',
  'recruiter_summary',
  'design_system_wcag',
  'atlas_ai',
  'stack'
];

export const PresetQuestionIdSchema = z.enum([
  'experience',
  'recruiter_summary',
  'design_system_wcag',
  'atlas_ai',
  'stack',
  'accessibility_testing',
  'atlas_list_performance',
  'atlas_sign_performance',
  'production_backend',
  'atlas_testing',
  'compare_job_fit'
]);

export function presetChipText(id: PresetQuestionId): string {
  const item = PRESET_QUESTIONS.find((preset) => preset.id === id);
  if (!item) {
    throw new Error(`Unknown preset id: ${id}`);
  }
  return item.text;
}

export function presetIdForChipText(text: string): PresetQuestionId | undefined {
  const trimmed = text.trim();
  return PRESET_QUESTIONS.find((preset) => preset.text === trimmed)?.id;
}

function atlasHighlight(data: PortfolioData, metric: string) {
  return data.experiences[0].highlights.find((h) => h.metric === metric);
}

export function buildPresetFallback(id: PresetQuestionId, data: PortfolioData = DEFAULT_PORTFOLIO_DATA): string {
  const { profile, experiences, skills } = data;
  const atlas = experiences[0];

  switch (id) {
    case 'experience': {
      return `**${atlas.company}** é a experiência principal.\n${formatRoleTimeline(atlas)}.\n${plainText(atlas.summary)}`;
    }
    case 'recruiter_summary': {
      return `**${profile.name}** — ${profile.jobTitle}, ${profile.location}.\n\n${plainText(profile.summary)}\n\n${profile.trustCopy}\n\nStatus: ${profile.status}. Contato: ${profile.email}.`;
    }
    case 'design_system_wcag': {
      const ds = atlasHighlight(data, '30+ componentes');
      const line = ds ? `- **${ds.metric}**: ${ds.text}` : '- Design system modular em conformidade com WCAG 2.1 AA.';
      return `**Design system e WCAG na ${atlas.company}**\n${line}`;
    }
    case 'atlas_ai': {
      const llm = atlasHighlight(data, 'LLMs em produção');
      const line = llm?.text ?? 'Integrou modelos de IA aos fluxos de negócio.';
      return `**IA na ${atlas.company}**\n- ${line}`;
    }
    case 'stack': {
      const lines = skills.map((g) => `- **${g.name}**: ${skillNames(g).join(', ')}`);
      return `**Stack principal**\n${lines.join('\n')}`;
    }
    case 'accessibility_testing': {
      const ds = atlasHighlight(data, '30+ componentes');
      const flows = atlasHighlight(data, '10.000+ usuários');
      const lines = [
        ds ? `- Conformidade **WCAG 2.1 AA** no design system (${ds.metric}).` : '- Design system em conformidade com WCAG 2.1 AA.',
        flows ? `- ${flows.text}` : ''
      ].filter(Boolean);
      return `**Acessibilidade e testes na ${atlas.company}**\n${lines.join('\n')}`;
    }
    case 'atlas_list_performance': {
      const perf = atlasHighlight(data, '5.000+ registros');
      const line = perf?.text ?? 'Listagens grandes com virtualização de DOM.';
      return `**Listas na ${atlas.company}**\n- ${line}`;
    }
    case 'atlas_sign_performance': {
      const perf = atlasHighlight(data, '5.000+ registros');
      const line =
        perf?.text ??
        'Listagens do Atlas Sign com virtualização e code splitting para reduzir gargalos de renderização.';
      return `**Performance no Atlas Sign**\n- ${line}\n\nO portfólio não detalha ferramentas de medição além da estabilização dessas listagens em produção.`;
    }
    case 'production_backend': {
      const llm = atlasHighlight(data, 'LLMs em produção');
      const messaging = atlasHighlight(data, '1.000+ templates');
      const stackLine = `- **Stack em produção (Atlas)**: ${atlas.stack.filter((t) => /python|\.net|c#/i.test(t)).join(', ') || atlas.stack.join(', ')}.`;
      const lines = [stackLine];
      if (llm) lines.push(`- ${llm.text}`);
      if (messaging) lines.push(`- ${messaging.text}`);
      return `**Backend em produção**\n${lines.join('\n')}`;
    }
    case 'atlas_testing': {
      const tests = atlasHighlight(data, '10.000+ usuários');
      const line =
        tests?.text ??
        'Fluxos críticos cobertos com Vitest e React Testing Library, com Error Boundaries na navegação.';
      return `**Testes na ${atlas.company}**\n- ${line}`;
    }
    case 'compare_job_fit': {
      return `Use o modo **Fit com vaga** neste assistente: cole o anúncio e a análise compara os requisitos com a experiência em produção do Pedro.\n\n${availabilityLine(profile)}\n\n${profile.trustCopy}`;
    }
  }
}
