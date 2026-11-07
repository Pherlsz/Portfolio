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

export const MESSAGE_LIMIT = 4000;
export const HISTORY_LIMIT = 6;

export const SUGGESTED_QUESTIONS = [
  'Resumo rápido para recrutador',
  'Qual a stack principal?',
  'Qual a experiência dele com IA?'
] as const;
