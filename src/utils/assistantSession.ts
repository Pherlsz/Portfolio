import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData.ts';
import { JobDescriptionSchema, QuestionSchema, type ChatMode } from './chatGuardrails.ts';
import { ChatResponseSchema, type ChatSource } from './chatResponseSchema.ts';
import { presetIdForChipText } from './presetQuestions.ts';

export interface ChatAction {
  label: string;
  type: 'navigate' | 'export_cv';
  value: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  source?: ChatSource;
  actions?: ChatAction[];
  followUps?: string[];
  blockedByGuardrail?: boolean;
}

export const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'Oi! Posso resumir a carreira do **Pedro**, falar dos projetos ou comparar o perfil dele com a sua vaga. Respondo só sobre ele.',
  actions: [
    { label: 'Ver experiência', type: 'navigate', value: '#experiencia' },
    { label: 'Ver projetos', type: 'navigate', value: '#projeto' },
    { label: 'Ver CV', type: 'export_cv', value: 'pdf' }
  ]
};

export interface AssistantSessionState {
  sessionId: string;
  open: boolean;
  mode: ChatMode;
  messages: ChatMessage[];
  question: string;
  jobDescription: string;
  jobQuestion: string;
  activeJob: string | null;
  jobExpanded: boolean;
  isLoading: boolean;
}

export interface AssistantSessionOptions {
  fetchImpl?: typeof fetch;
  ownerName?: string;
}

type Listener = () => void;

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createInitialState(): AssistantSessionState {
  return {
    sessionId: createSessionId(),
    open: false,
    mode: 'chat',
    messages: [WELCOME_MESSAGE],
    question: '',
    jobDescription: '',
    jobQuestion: '',
    activeJob: null,
    jobExpanded: false,
    isLoading: false
  };
}

/**
 * Cliente HTTP da API de chat: envia a requisição e interpreta erros/schemas de resposta,
 * mantendo as regras de negócio e segurança no servidor.
 */
export async function requestAssistantChat(
  payload: {
    mode: ChatMode;
    message: string;
    history: Array<{ role: 'user' | 'model'; text: string }>;
    job?: string;
    presetId?: string;
  },
  fetchFn: typeof fetch = globalThis.fetch
) {
  const response = await fetchFn('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const raw: unknown = await response.json();
  const parsed = ChatResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('Resposta inválida');
  }
  if (!response.ok && !parsed.data.reply) {
    throw new Error(parsed.data.error ?? 'Erro ao consultar o assistente');
  }
  return parsed.data;
}

export function createAssistantSession(options: AssistantSessionOptions = {}) {
  const ownerName = options.ownerName ?? DEFAULT_PORTFOLIO_DATA.profile.name;
  let state: AssistantSessionState = createInitialState();
  let nextMessageSeq = 1;
  let activeRequestId = 0;
  const listeners = new Set<Listener>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setState = (updater: (prev: AssistantSessionState) => AssistantSessionState) => {
    state = updater(state);
    notify();
  };

  const getState = (): AssistantSessionState => state;

  const subscribe = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const setOpen = (open: boolean) => {
    if (state.open === open) return;
    setState((prev) => ({ ...prev, open }));
  };

  const setMode = (mode: ChatMode) => {
    if (state.mode === mode) return;
    setState((prev) => ({ ...prev, mode }));
  };

  const setQuestion = (question: string) => {
    setState((prev) => ({ ...prev, question }));
  };

  const setJobDescription = (jobDescription: string) => {
    setState((prev) => ({ ...prev, jobDescription }));
  };

  const setJobQuestion = (jobQuestion: string) => {
    setState((prev) => ({ ...prev, jobQuestion }));
  };

  const setJobExpanded = (jobExpanded: boolean) => {
    setState((prev) => ({ ...prev, jobExpanded }));
  };

  const clearChat = () => {
    activeRequestId += 1;
    setState((prev) => ({
      ...prev,
      messages: [WELCOME_MESSAGE],
      activeJob: null,
      jobQuestion: '',
      jobDescription: '',
      jobExpanded: false,
      isLoading: false
    }));
  };

  const resetForPageNavigation = () => {
    activeRequestId += 1;
    state = createInitialState();
    notify();
  };

  const buildSafeHistory = (messages: ChatMessage[]) => {
    const eligible: Array<{ role: 'user' | 'model'; text: string }> = [];
    for (let i = 0; i < messages.length; i += 1) {
      const current = messages[i];
      if (current.id === 'welcome' || current.blockedByGuardrail) continue;
      const next = messages[i + 1];
      if (current.role === 'user' && next?.role === 'model' && next.blockedByGuardrail) {
        continue;
      }
      eligible.push({ role: current.role, text: current.text });
    }
    return eligible.slice(-6);
  };

  const send = async (
    text: string,
    sendMode: ChatMode,
    opts?: { job?: string; presetId?: string }
  ): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed || state.isLoading) return;

    const history = buildSafeHistory(state.messages);
    const userMsgId = `user-${nextMessageSeq++}`;
    const inputMode: ChatMode = opts?.job ? 'chat' : sendMode;

    // O cliente valida apenas limites estruturais (tamanho/formato). A política de segurança roda no backend.
    const structural = (inputMode === 'jobfit' ? JobDescriptionSchema : QuestionSchema).safeParse(trimmed);
    if (!structural.success) {
      const modelMsgId = `model-${nextMessageSeq++}`;
      const errorMsg = structural.error.issues[0]?.message ?? 'Entrada inválida.';
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: userMsgId, role: 'user', text: trimmed, blockedByGuardrail: true },
          {
            id: modelMsgId,
            role: 'model',
            text: `**${errorMsg}**\n\nRespondo só sobre a carreira, os projetos, a stack e os bastidores do **${ownerName}**.`,
            blockedByGuardrail: true
          }
        ]
      }));
      return;
    }

    const sanitizedText = structural.data;
    const requestId = ++activeRequestId;

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, { id: userMsgId, role: 'user', text: trimmed }],
      activeJob: sendMode === 'jobfit' && !opts?.job ? sanitizedText : prev.activeJob,
      jobExpanded: sendMode === 'jobfit' && !opts?.job ? false : prev.jobExpanded,
      isLoading: true
    }));

    try {
      const presetId = opts?.presetId ?? presetIdForChipText(sanitizedText);
      const data = await requestAssistantChat(
        {
          mode: sendMode,
          message: sanitizedText,
          history,
          ...(opts?.job ? { job: opts.job } : {}),
          ...(presetId ? { presetId } : {})
        },
        options.fetchImpl ?? globalThis.fetch
      );

      if (requestId !== activeRequestId) {
        return;
      }

      const modelMsgId = `model-${nextMessageSeq++}`;
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: modelMsgId,
            role: 'model',
            text: data.reply ?? '',
            source: data.source,
            actions: data.actions,
            followUps: data.followUps,
            blockedByGuardrail: Boolean(data.blockedByZod)
          }
        ],
        isLoading: false
      }));
    } catch {
      if (requestId !== activeRequestId) {
        return;
      }
      const modelMsgId = `model-${nextMessageSeq++}`;
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: modelMsgId,
            role: 'model',
            text: 'Não consegui responder agora. As seções de **Experiência** e **Projeto** têm o resumo completo, e o CV está a um clique.',
            actions: WELCOME_MESSAGE.actions
          }
        ],
        isLoading: false
      }));
    }
  };

  return {
    getState,
    subscribe,
    setOpen,
    setMode,
    setQuestion,
    setJobDescription,
    setJobQuestion,
    setJobExpanded,
    clearChat,
    resetForPageNavigation,
    send
  };
}

export type AssistantSession = ReturnType<typeof createAssistantSession>;
