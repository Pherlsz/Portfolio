import type { ChatAction, ChatResponse, ChatSource } from './chat.ts';
import { HISTORY_LIMIT } from './chat.ts';

export type { ChatAction };

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  source?: ChatSource;
  actions?: ChatAction[];
  failed?: boolean;
}

export const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'Oi! Posso resumir a experiência do **Pedro**, responder dúvidas sobre a stack e projetos ou comparar o perfil dele se você colar os requisitos de uma vaga.',
  actions: [
    { label: 'Ver experiência', type: 'navigate', value: '#experiencia' },
    { label: 'Ver projetos', type: 'navigate', value: '#projeto' },
    { label: 'Ver CV', type: 'export_cv', value: 'pdf' }
  ]
};

export interface AssistantSessionState {
  open: boolean;
  messages: ChatMessage[];
  question: string;
  isLoading: boolean;
}

export interface AssistantSessionOptions {
  fetchImpl?: typeof fetch;
}

type Listener = () => void;

function createInitialState(): AssistantSessionState {
  return {
    open: false,
    messages: [WELCOME_MESSAGE],
    question: '',
    isLoading: false
  };
}

export async function requestAssistantChat(
  payload: {
    message: string;
    history: Array<{ role: 'user' | 'model'; text: string }>;
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

  const setQuestion = (question: string) => {
    setState((prev) => ({ ...prev, question }));
  };

  const clearChat = () => {
    activeRequestId += 1;
    setState((prev) => ({
      ...prev,
      messages: [WELCOME_MESSAGE],
      question: '',
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

  const send = async (text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed || state.isLoading) return;

    const history = buildHistory(state.messages);
    const userMsgId = `user-${nextMessageSeq++}`;
    const requestId = ++activeRequestId;

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, { id: userMsgId, role: 'user', text: trimmed }],
      isLoading: true
    }));

    let reply: ChatMessage;
    try {
      const data = await requestAssistantChat(
        { message: trimmed, history },
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
    setQuestion,
    clearChat,
    resetForPageNavigation,
    send
  };
}

export type AssistantSession = ReturnType<typeof createAssistantSession>;
