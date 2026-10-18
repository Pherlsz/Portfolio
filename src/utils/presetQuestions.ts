import { z } from 'zod';
import {
  DEFAULT_PORTFOLIO_DATA,
  formatPeriod,
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

export function buildPresetFallback(id: PresetQuestionId, data: PortfolioData = DEFAULT_PORTFOLIO_DATA): string {
  const { profile, experiences, skills } = data;
  const atlas = experiences[0];
  const engineer = atlas.roles[0];
  const intern = atlas.roles[1];

  switch (id) {
    case 'experience': {
      return `A experiência principal do Pedro é na **${atlas.company}**, plataforma de governança corporativa. Começou como estagiário (${formatPeriod(intern.start, intern.end)}) e seguiu como ${engineer.title} (${formatPeriod(engineer.start, engineer.end)}), com foco no frontend do Atlas PLG e do Atlas Sign, em design system e em integração de IA.`;
    }
    case 'recruiter_summary': {
      const summary = plainText(profile.summary).replace(/^um /, '');
      return `**${profile.name}** — ${profile.jobTitle} (Rio Grande do Sul).\n\n${summary} Trajetória de estágio a júnior; aberto a vagas pleno quando houver fit.\n\nStatus: ${profile.status.toLowerCase()}. Contato: ${profile.email}.`;
    }
    case 'design_system_wcag': {
      return `**Design system e WCAG na ${atlas.company}**\n- Design system modular com **30+ componentes** em conformidade com **WCAG 2.1 AA**, base do frontend do Atlas PLG (React, Next.js e TypeScript).`;
    }
    case 'atlas_ai': {
      return `**IA na ${atlas.company}**\n- Pedro integrou modelos de IA aos fluxos de negócio com function calling e tool calling, via APIs REST em Python e C#/.NET Core.`;
    }
    case 'stack': {
      const lines = skills.map((g) => `- **${g.name}**: ${skillNames(g).join(', ')}`);
      return `**Stack principal**\n${lines.join('\n')}`;
    }
    case 'accessibility_testing': {
      return `**Acessibilidade na ${atlas.company}**\n- O design system tem **30+ componentes** em conformidade com **WCAG 2.1 AA**.\n- O portfólio não detalha as ferramentas de auditoria de acessibilidade usadas (como axe ou testes com leitor de tela).`;
    }
    case 'atlas_list_performance': {
      return `**Listas na ${atlas.company}**\n- Listagens do Atlas Sign com **5.000+ registros** sem travar, usando virtualização de DOM (TanStack Virtual) e code splitting.\n- Pedro também separou estado de servidor e de interface (TanStack Query, Zustand e Context API), eliminando requisições redundantes.`;
    }
    case 'atlas_sign_performance': {
      return `**Como a performance foi medida no Atlas Sign**\nO portfólio não traz métricas de ferramenta (como Lighthouse ou Web Vitals). O resultado registrado é prático: as listagens com 5.000+ registros deixaram de travar depois da virtualização e do code splitting. Para números, vale perguntar direto ao Pedro.`;
    }
    case 'production_backend': {
      const backendStack = atlas.stack.filter((tech) => /python|\.net|c#/i.test(tech)).join(' e ');
      return `**Backend em produção**\n- **Stack na ${atlas.company}**: ${backendStack}.\n- Pedro refatorou o serviço de mensageria em C#/.NET Core, consolidando templates de e-mail legados em modelos parametrizados, com Docker e CI/CD no Azure DevOps.`;
    }
    case 'atlas_testing': {
      return `**Testes na ${atlas.company}**\n- Fluxos críticos de assinatura eletrônica (Atlas Sign, 10.000+ usuários) cobertos com **Vitest** e **React Testing Library**, com Error Boundaries na navegação.`;
    }
    case 'compare_job_fit': {
      return `Use o modo **Fit com vaga** neste assistente: cole o anúncio e a análise compara os requisitos com a experiência do Pedro em produção.\n\nSenioridade: ${profile.seniority} · Formato: ${profile.workMode.toLowerCase()} · Pretensão: ${profile.salary.toLowerCase()}.`;
    }
  }
}
