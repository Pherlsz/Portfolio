import { z } from 'zod';
import { plainText, skillNames, type PortfolioData } from '../data/portfolioData.ts';

const PRESET_QUESTIONS = {
  recruiter_summary: 'Resumo rápido para recrutador',
  stack: 'Qual a stack principal?',
  atlas_ai: 'O que ele fez com IA na Atlas?',
  compare_job_fit: 'Quer comparar o perfil com uma vaga?'
} as const;

export type PresetQuestionId = keyof typeof PRESET_QUESTIONS;

export const SUGGESTED_PRESET_IDS = Object.keys(PRESET_QUESTIONS) as [
  PresetQuestionId,
  ...PresetQuestionId[]
];

export const PresetQuestionIdSchema = z.enum(SUGGESTED_PRESET_IDS);

export function presetChipText(id: PresetQuestionId): string {
  const text = PRESET_QUESTIONS[id];
  if (!text) {
    throw new Error(`Unknown preset id: ${id}`);
  }
  return text;
}

export function presetIdForChipText(text: string): PresetQuestionId | undefined {
  const trimmed = text.trim();
  return SUGGESTED_PRESET_IDS.find((id) => PRESET_QUESTIONS[id] === trimmed);
}

export function buildPresetFallback(id: PresetQuestionId, data: PortfolioData): string {
  const { profile, experiences, skills } = data;
  const atlas = experiences[0];

  switch (id) {
    case 'recruiter_summary': {
      const summary = plainText(profile.summary);
      return `**${profile.name}** — ${profile.jobTitle} (${profile.location}).\n\n${summary} Trajetória de estágio a júnior; aberto a vagas pleno quando houver fit.\n\nStatus: ${profile.status.toLowerCase()}. Contato: ${profile.email}.`;
    }
    case 'stack': {
      const lines = skills.map((g) => `- **${g.name}**: ${skillNames(g).join(', ')}`);
      return `**Stack principal**\n${lines.join('\n')}`;
    }
    case 'atlas_ai': {
      return `**IA na ${atlas.company}**\n- Pedro criou as interfaces visuais do chat da IA e suas funcionalidades no frontend da plataforma, consumindo APIs REST em Python e C# / .NET Core.\n- A integração direta de modelos de IA (tools, RAG e orquestração multimodal) está nos projetos pessoais **Gymkhana Database** e **Gymkhana Core**.`;
    }
    case 'compare_job_fit': {
      return `Use o modo **Fit com vaga** neste assistente: cole o anúncio e a análise compara os requisitos com a experiência do Pedro em produção.\n\nSenioridade: ${profile.seniority} · Formato: ${profile.workMode} · Pretensão: ${profile.salary}.`;
    }
  }
}
