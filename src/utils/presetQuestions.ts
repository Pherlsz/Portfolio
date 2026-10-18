import { z } from 'zod';
import {
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
  { id: 'stack', text: 'Qual a stack principal?' }
] as const;

export type PresetQuestionId = (typeof PRESET_QUESTIONS)[number]['id'];

export const PresetQuestionIdSchema = z.enum([
  'experience',
  'recruiter_summary',
  'design_system_wcag',
  'atlas_ai',
  'stack'
]);

export function buildPresetFallback(id: PresetQuestionId, data: PortfolioData = DEFAULT_PORTFOLIO_DATA): string {
  const { profile, experiences, skills } = data;
  const atlas = experiences[0];

  switch (id) {
    case 'experience': {
      const highlights = atlas.highlights
        .slice(0, 3)
        .map((h) => (h.metric ? `- **${h.metric}**: ${h.text}` : `- ${h.text}`))
        .join('\n');
      return `**${atlas.company}** é a experiência principal.\n${formatRoleTimeline(atlas)}.\n${plainText(atlas.summary)}\n\nDestaques:\n${highlights}`;
    }
    case 'recruiter_summary': {
      return `**${profile.name}** — ${profile.jobTitle}, ${profile.location}.\n\n${plainText(profile.summary)}\n\n${profile.trustCopy}\n\nStatus: ${profile.status}. Contato: ${profile.email}.`;
    }
    case 'design_system_wcag': {
      const ds = atlas.highlights.find((h) => h.metric === '30+ componentes');
      const perf = atlas.highlights.find((h) => h.metric === '5.000+ registros');
      const tests = atlas.highlights.find((h) => h.metric === '10.000+ usuários');
      const lines = [
        ds ? `- **${ds.metric}**: ${ds.text}` : '- Design system modular em conformidade com WCAG 2.1 AA.',
        perf ? `- **${perf.metric}**: ${perf.text}` : '',
        tests ? `- **${tests.metric}**: ${tests.text}` : ''
      ].filter(Boolean);
      return `**Design system e WCAG na ${atlas.company}**\n${lines.join('\n')}`;
    }
    case 'atlas_ai': {
      const llm = atlas.highlights.find((h) => h.metric === 'LLMs em produção');
      const line = llm?.text ?? 'Integrou modelos de IA aos fluxos de negócio.';
      return `**IA na ${atlas.company}**\n- ${line}`;
    }
    case 'stack': {
      const lines = skills.map((g) => `- **${g.name}**: ${skillNames(g).join(', ')}`);
      return `**Stack principal**\n${lines.join('\n')}`;
    }
  }
}
