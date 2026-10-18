import { z } from 'zod';
import {
  DEFAULT_PORTFOLIO_DATA,
  plainText,
  skillNames,
  type PortfolioData
} from '../data/portfolioData.ts';

export const PRESET_QUESTIONS = [
  { id: 'recruiter_summary', text: 'Resumo rápido para recrutador' },
  { id: 'stack', text: 'Qual a stack principal?' },
  { id: 'atlas_ai', text: 'O que ele fez com IA na Atlas?' },
  { id: 'compare_job_fit', text: 'Quer comparar o perfil com uma vaga?' }
] as const;

export type PresetQuestionId = (typeof PRESET_QUESTIONS)[number]['id'];

export const SUGGESTED_PRESET_IDS: PresetQuestionId[] = [
  'recruiter_summary',
  'stack',
  'atlas_ai',
  'compare_job_fit'
];

export const PresetQuestionIdSchema = z.enum([
  'recruiter_summary',
  'stack',
  'atlas_ai',
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

export function buildPresetFallback(id: PresetQuestionId, data: PortfolioData = DEFAULT_PORTFOLIO_DATA): string {
  const { profile, experiences, skills } = data;
  const atlas = experiences[0];

  switch (id) {
    case 'recruiter_summary': {
      const summary = plainText(profile.summary);
      return `**${profile.name}** — ${profile.jobTitle} (Rio Grande do Sul).\n\n${summary} Trajetória de estágio a júnior; aberto a vagas pleno quando houver fit.\n\nStatus: ${profile.status.toLowerCase()}. Contato: ${profile.email}.`;
    }
    case 'stack': {
      const lines = skills.map((g) => `- **${g.name}**: ${skillNames(g).join(', ')}`);
      return `**Stack principal**\n${lines.join('\n')}`;
    }
    case 'atlas_ai': {
      return `**IA na ${atlas.company}**\n- Pedro integrou modelos de IA aos fluxos de negócio com function calling e tool calling, via APIs REST em Python e C# / .NET Core.`;
    }
    case 'compare_job_fit': {
      return `Use o modo **Fit com vaga** neste assistente: cole o anúncio e a análise compara os requisitos com a experiência do Pedro em produção.\n\nSenioridade: ${profile.seniority} · Formato: ${profile.workMode} · Pretensão: ${profile.salary}.`;
    }
  }
}
