import type { ChatAction, ChatMode, ChatResponse, ChatSource } from './chat.ts';
import { HISTORY_LIMIT } from './chat.ts';

export type { ChatAction };

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  source?: ChatSource;
  actions?: ChatAction[];
  /** Erro de validação: fica fora do histórico enviado ao modelo. */
  failed?: boolean;
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

/** Cliente HTTP da API de chat. Validação e prompt ficam no servidor. */
export async function requestAssistantChat(
  payload: {
    mode: ChatMode;
    message: string;
    history: Array<{ role: 'user' | 'model'; text: string }>;
    job?: string;
  },
  fetchFn: typeof fetch = globalThis.fetch
): Promise<ChatResponse & { ok: boolean }> {
  const response = await fetchFn('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = (await response.json()) as Partial<ChatResponse>;
  if (typeof data.reply !== 'string' || !data.reply) {
    throw new Error(data.error ?? 'Resposta inválida');
  }
  return { ok: response.ok, reply: data.reply, source: data.source ?? 'local', actions: data.actions };
}

export function createAssistantSession(options: AssistantSessionOptions = {}) {
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

  const buildHistory = (messages: ChatMessage[]) =>
    messages
      .filter((message, i) => message.id !== 'welcome' && !message.failed && !messages[i + 1]?.failed)
      .map(({ role, text }) => ({ role, text }))
      .slice(-HISTORY_LIMIT);

  const send = async (text: string, sendMode: ChatMode, opts?: { job?: string }): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed || state.isLoading) return;

    const history = buildHistory(state.messages);
    const userMsgId = `user-${nextMessageSeq++}`;
    const requestId = ++activeRequestId;
    const isNewJob = sendMode === 'jobfit' && !opts?.job;

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, { id: userMsgId, role: 'user', text: trimmed }],
      activeJob: isNewJob ? trimmed : prev.activeJob,
      jobExpanded: isNewJob ? false : prev.jobExpanded,
      isLoading: true
    }));

    let reply: ChatMessage;
    try {
      const data = await requestAssistantChat(
        { mode: sendMode, message: trimmed, history, ...(opts?.job ? { job: opts.job } : {}) },
        options.fetchImpl ?? globalThis.fetch
      );
      reply = {
        id: `model-${nextMessageSeq++}`,
        role: 'model',
        text: data.reply,
        source: data.source,
        actions: data.actions,
        failed: !data.ok
      };
    } catch {
      reply = {
        id: `model-${nextMessageSeq++}`,
        role: 'model',
        text: 'Não consegui responder agora. As seções de **Experiência** e **Projetos** têm o resumo completo, e o CV está a um clique.',
        actions: WELCOME_MESSAGE.actions,
        failed: true
      };
    }

    if (requestId !== activeRequestId) return;
    setState((prev) => ({ ...prev, messages: [...prev.messages, reply], isLoading: false }));
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
