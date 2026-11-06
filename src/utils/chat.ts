/** Tipos e limites compartilhados entre o painel do assistente e a API. Sem dependências: entra no bundle do cliente. */

export type ChatMode = 'chat' | 'jobfit';
export type ChatSource = 'ai' | 'local';

export interface ChatAction {
  label: string;
  type: 'navigate' | 'export_cv';
  value: string;
}

export interface ChatResponse {
  reply: string;
  source: ChatSource;
  actions?: ChatAction[];
  error?: string;
}

export const QUESTION_LIMIT = 600;
export const JOB_DESCRIPTION_LIMIT = 5000;
export const HISTORY_LIMIT = 6;

export const SUGGESTED_QUESTIONS = [
  'Resumo rápido para recrutador',
  'Qual a stack principal?',
  'O que ele fez com IA na Atlas?'
] as const;
