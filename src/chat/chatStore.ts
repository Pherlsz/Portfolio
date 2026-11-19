import { useSyncExternalStore } from 'react';
import { t } from '../i18n/pt-BR.ts';
import {
  HISTORY_LIMIT,
  MESSAGE_LIMIT,
  type ChatAction,
  type ChatCardKind,
  type ChatCardRef,
  type ChatSkill,
  type ChatSseEvent,
  type Reasoning
} from '../utils/chat.ts';

export const CHAT_STORAGE_KEY = 'pherls.chats.v1';
export const MAX_CHATS = 30;

export type ChatMessageStatus = 'streaming' | 'done' | 'error' | 'aborted';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  status: ChatMessageStatus;
  createdAt: number;
  reasoning?: Reasoning;
  skill?: ChatSkill;
  attachmentName?: string;
  cards?: ChatCardRef[];
  actions?: ChatAction[];
  notice?: string;
  error?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  reasoning: Reasoning;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatStoreState {
  chats: ChatThread[];
  activeChatId: string | null;
  defaultReasoning: Reasoning;
  isStreaming: boolean;
}

export interface SendOptions {
  skill?: ChatSkill;
  attachmentText?: string;
  attachmentName?: string;
  chatId?: string | null;
  regenerate?: boolean;
}

export interface CreateChatStoreOptions {
  storage?: Storage | null;
  fetchImpl?: typeof fetch;
  storageKey?: string;
}

const VALID_REASONING = new Set<Reasoning>(['fast', 'default', 'high']);
const VALID_SKILLS = new Set<ChatSkill>(['vaga', 'resumo']);
const VALID_CARD_KINDS = new Set<ChatCardKind>([
  'project',
  'experience',
  'certificate',
  'study',
  'article',
  'contact',
  'v1'
]);
const VALID_ACTION_TYPES = new Set<ChatAction['type']>(['route', 'export_cv', 'contact', 'navigate']);
const VALID_ROLES = new Set<ChatMessage['role']>(['user', 'assistant']);
const VALID_STATUSES = new Set<ChatMessageStatus>(['streaming', 'done', 'error', 'aborted']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseCardRef(raw: unknown): ChatCardRef | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.kind !== 'string' || !VALID_CARD_KINDS.has(raw.kind as ChatCardKind)) return null;
  if (raw.id !== undefined && typeof raw.id !== 'string') return null;
  if (raw.prefill !== undefined && typeof raw.prefill !== 'string') return null;
  return {
    kind: raw.kind as ChatCardKind,
    ...(raw.id !== undefined ? { id: raw.id } : {}),
    ...(raw.prefill !== undefined ? { prefill: raw.prefill } : {})
  };
}

function parseAction(raw: unknown): ChatAction | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.label !== 'string' || raw.label.length === 0) return null;
  if (typeof raw.type !== 'string' || !VALID_ACTION_TYPES.has(raw.type as ChatAction['type'])) return null;
  if (typeof raw.value !== 'string') return null;
  return {
    label: raw.label,
    type: raw.type as ChatAction['type'],
    value: raw.value
  };
}

function parseStoredMessage(raw: unknown): ChatMessage | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null;
  if (typeof raw.role !== 'string' || !VALID_ROLES.has(raw.role as ChatMessage['role'])) return null;
  if (typeof raw.text !== 'string') return null;
  if (typeof raw.status !== 'string' || !VALID_STATUSES.has(raw.status as ChatMessageStatus)) return null;
  if (!isFiniteNumber(raw.createdAt)) return null;

  if (raw.reasoning !== undefined && (typeof raw.reasoning !== 'string' || !VALID_REASONING.has(raw.reasoning as Reasoning))) {
    return null;
  }
  if (raw.skill !== undefined && (typeof raw.skill !== 'string' || !VALID_SKILLS.has(raw.skill as ChatSkill))) {
    return null;
  }
  if (raw.attachmentName !== undefined && typeof raw.attachmentName !== 'string') return null;
  if (raw.notice !== undefined && typeof raw.notice !== 'string') return null;
  if (raw.error !== undefined && typeof raw.error !== 'string') return null;

  let cards: ChatCardRef[] | undefined;
  if (raw.cards !== undefined) {
    if (!Array.isArray(raw.cards)) return null;
    cards = [];
    for (const item of raw.cards) {
      const parsed = parseCardRef(item);
      if (!parsed) return null;
      cards.push(parsed);
    }
  }

  let actions: ChatAction[] | undefined;
  if (raw.actions !== undefined) {
    if (!Array.isArray(raw.actions)) return null;
    actions = [];
    for (const item of raw.actions) {
      const parsed = parseAction(item);
      if (!parsed) return null;
      actions.push(parsed);
    }
  }

  return {
    id: raw.id,
    role: raw.role as ChatMessage['role'],
    text: raw.text,
    status: raw.status as ChatMessageStatus,
    createdAt: raw.createdAt,
    ...(raw.reasoning !== undefined ? { reasoning: raw.reasoning as Reasoning } : {}),
    ...(raw.skill !== undefined ? { skill: raw.skill as ChatSkill } : {}),
    ...(raw.attachmentName !== undefined ? { attachmentName: raw.attachmentName } : {}),
    ...(cards !== undefined ? { cards } : {}),
    ...(actions !== undefined ? { actions } : {}),
    ...(raw.notice !== undefined ? { notice: raw.notice } : {}),
    ...(raw.error !== undefined ? { error: raw.error } : {})
  };
}

function parseStoredThread(raw: unknown): ChatThread | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null;
  if (typeof raw.title !== 'string') return null;
  if (!isFiniteNumber(raw.createdAt) || !isFiniteNumber(raw.updatedAt)) return null;
  if (!Array.isArray(raw.messages)) return null;

  const reasoning: Reasoning =
    raw.reasoning === undefined
      ? 'default'
      : typeof raw.reasoning === 'string' && VALID_REASONING.has(raw.reasoning as Reasoning)
        ? (raw.reasoning as Reasoning)
        : (null as unknown as Reasoning);
  if (!reasoning) return null;

  const messages: ChatMessage[] = [];
  for (const item of raw.messages) {
    const parsed = parseStoredMessage(item);
    if (!parsed) return null;
    messages.push(parsed);
  }

  return {
    id: raw.id,
    title: raw.title,
    reasoning,
    messages,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
}

function parsePersistedStore(raw: unknown): Omit<ChatStoreState, 'isStreaming'> | null {
  if (!isRecord(raw)) return null;

  const chats: ChatThread[] = [];
  if (raw.chats !== undefined) {
    if (!Array.isArray(raw.chats)) return null;
    for (const item of raw.chats) {
      const parsed = parseStoredThread(item);
      if (!parsed) return null;
      chats.push(parsed);
    }
  }

  let activeChatId: string | null = null;
  if (raw.activeChatId !== undefined && raw.activeChatId !== null) {
    if (typeof raw.activeChatId !== 'string') return null;
    activeChatId = raw.activeChatId;
  }

  let defaultReasoning: Reasoning = 'default';
  if (raw.defaultReasoning !== undefined) {
    if (typeof raw.defaultReasoning !== 'string' || !VALID_REASONING.has(raw.defaultReasoning as Reasoning)) {
      return null;
    }
    defaultReasoning = raw.defaultReasoning as Reasoning;
  }

  return { chats, activeChatId, defaultReasoning };
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function deriveTitle(text: string, fallback = 'Nova conversa'): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallback;
  if (cleaned.length <= 56) return cleaned;
  return `${cleaned.slice(0, 53).trimEnd()}...`;
}

function pruneChats(chats: ChatThread[]): ChatThread[] {
  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
  return sorted.slice(0, MAX_CHATS);
}

function sanitizeLoadedChats(chats: ChatThread[]): ChatThread[] {
  return pruneChats(
    chats.map((chat) => ({
      ...chat,
      messages: chat.messages.map((msg) =>
        msg.status === 'streaming' ? { ...msg, status: 'aborted' as const } : msg
      )
    }))
  );
}

function getDefaultStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadFromStorage(storage: Storage | null, key: string): Omit<ChatStoreState, 'isStreaming'> {
  const empty: Omit<ChatStoreState, 'isStreaming'> = {
    chats: [],
    activeChatId: null,
    defaultReasoning: 'default'
  };
  if (!storage) return empty;
  try {
    const raw = storage.getItem(key);
    if (!raw) return empty;
    const parsedJson: unknown = JSON.parse(raw);
    const parsed = parsePersistedStore(parsedJson);
    if (!parsed) {
      storage.removeItem(key);
      return empty;
    }
    const chats = sanitizeLoadedChats(parsed.chats);
    const activeExists = parsed.activeChatId
      ? chats.some((chat) => chat.id === parsed.activeChatId)
      : false;
    return {
      chats,
      activeChatId: activeExists ? parsed.activeChatId : null,
      defaultReasoning: parsed.defaultReasoning
    };
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore storage removal errors in restricted contexts.
    }
    return empty;
  }
}

function saveToStorage(storage: Storage | null, key: string, state: ChatStoreState): void {
  if (!storage) return;
  try {
    const payload = {
      chats: pruneChats(state.chats),
      activeChatId: state.activeChatId,
      defaultReasoning: state.defaultReasoning
    };
    storage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

interface ParsedSlashCommand {
  kind: 'local-v1' | 'local-contact' | 'local-help' | 'remote';
  skill?: ChatSkill;
  content: string;
  prefill?: string;
}

function parseSlashCommand(rawText: string, explicitSkill?: ChatSkill): ParsedSlashCommand {
  const trimmed = rawText.trim();
  const match = /^\/([a-z0-9_-]+)(?:\s+([\s\S]*))?$/i.exec(trimmed);
  if (!match) {
    return { kind: 'remote', skill: explicitSkill, content: trimmed };
  }

  const command = match[1].toLowerCase();
  const rest = (match[2] ?? '').trim();

  if (command === 'v1') {
    return { kind: 'local-v1', content: trimmed };
  }
  if (command === 'contato' || command === 'contact') {
    return { kind: 'local-contact', content: trimmed, prefill: rest };
  }
  if (command === 'help' || command === 'ajuda') {
    return { kind: 'local-help', content: trimmed };
  }
  if (command === 'vaga') {
    return { kind: 'remote', skill: 'vaga', content: rest };
  }
  if (command === 'resumo') {
    return { kind: 'remote', skill: 'resumo', content: rest };
  }

  return { kind: 'remote', skill: explicitSkill, content: trimmed };
}

function parseSseBlock(block: string): ChatSseEvent | null {
  const lines = block.split('\n');
  let eventName = '';
  const dataLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  const rawData = dataLines.join('\n').trim();
  if (!rawData) return null;
  if (rawData === '[DONE]') return { type: 'done' };

  try {
    const parsed = JSON.parse(rawData) as Record<string, unknown>;
    const type = (typeof parsed.type === 'string' ? parsed.type : eventName) as ChatSseEvent['type'];

    switch (type) {
      case 'delta':
        return typeof parsed.text === 'string' ? { type: 'delta', text: parsed.text } : null;
      case 'cards':
        return Array.isArray(parsed.cards) ? { type: 'cards', cards: parsed.cards as ChatCardRef[] } : null;
      case 'actions':
        return Array.isArray(parsed.actions)
          ? { type: 'actions', actions: parsed.actions as ChatAction[] }
          : null;
      case 'notice':
        return typeof parsed.text === 'string' ? { type: 'notice', text: parsed.text } : null;
      case 'retract':
        return typeof parsed.reply === 'string' ? { type: 'retract', reply: parsed.reply } : null;
      case 'error':
        return typeof parsed.reply === 'string'
          ? { type: 'error', reply: parsed.reply }
          : typeof parsed.error === 'string'
            ? { type: 'error', reply: parsed.error }
            : null;
      case 'done':
        return { type: 'done' };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function createChatStore(options: CreateChatStoreOptions = {}) {
  const storage = options.storage !== undefined ? options.storage : getDefaultStorage();
  const storageKey = options.storageKey ?? CHAT_STORAGE_KEY;
  const fetchFn: typeof fetch | undefined =
    options.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : undefined);

  const initial = loadFromStorage(storage, storageKey);
  let state: ChatStoreState = {
    ...initial,
    isStreaming: false
  };

  const listeners = new Set<() => void>();
  let activeAbort: AbortController | null = null;
  let streamingTarget: { chatId: string; messageId: string } | null = null;

  function emit() {
    for (const listener of listeners) {
      listener();
    }
  }

  function setState(next: ChatStoreState, persist = true) {
    state = next;
    if (persist) {
      saveToStorage(storage, storageKey, state);
    }
    emit();
  }

  function updateChat(chatId: string, updater: (chat: ChatThread) => ChatThread, persist = true) {
    let changed = false;
    const nextChats = state.chats.map((chat) => {
      if (chat.id !== chatId) return chat;
      changed = true;
      return updater(chat);
    });
    if (!changed) return;
    setState({ ...state, chats: pruneChats(nextChats) }, persist);
  }

  function updateMessage(
    chatId: string,
    messageId: string,
    updater: (msg: ChatMessage) => ChatMessage,
    persist = true
  ) {
    updateChat(
      chatId,
      (chat) => ({
        ...chat,
        updatedAt: Date.now(),
        messages: chat.messages.map((msg) => (msg.id === messageId ? updater(msg) : msg))
      }),
      persist
    );
  }

  if (typeof window !== 'undefined' && storage) {
    window.addEventListener('storage', (event) => {
      if (event.key !== storageKey) return;
      const synced = loadFromStorage(storage, storageKey);
      setState(
        {
          ...synced,
          isStreaming: state.isStreaming
        },
        false
      );
    });
  }

  function getSnapshot(): ChatStoreState {
    return state;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function abort(): void {
    if (activeAbort) {
      activeAbort.abort();
      activeAbort = null;
    }
    if (streamingTarget) {
      const { chatId, messageId } = streamingTarget;
      streamingTarget = null;
      updateMessage(chatId, messageId, (msg) =>
        msg.status === 'streaming' ? { ...msg, status: 'aborted' } : msg
      );
    }
    if (state.isStreaming) {
      setState({ ...state, isStreaming: false }, true);
    }
  }

  function newChat(): null {
    setState({ ...state, activeChatId: null }, true);
    return null;
  }

  function selectChat(id: string | null): void {
    if (id === null) {
      setState({ ...state, activeChatId: null }, true);
      return;
    }
    if (!state.chats.some((chat) => chat.id === id)) return;
    if (state.activeChatId === id) return;
    setState({ ...state, activeChatId: id }, true);
  }

  function setReasoning(chatId: string | null, reasoning: Reasoning): void {
    const targetId = chatId ?? state.activeChatId;
    const nextChats = targetId
      ? state.chats.map((chat) => (chat.id === targetId ? { ...chat, reasoning } : chat))
      : state.chats;
    setState(
      {
        ...state,
        defaultReasoning: reasoning,
        chats: nextChats
      },
      true
    );
  }

  function rename(chatId: string, title: string): void {
    const nextTitle = title.replace(/\s+/g, ' ').trim();
    if (!nextTitle) return;
    updateChat(chatId, (chat) => ({
      ...chat,
      title: nextTitle.slice(0, 80),
      updatedAt: Date.now()
    }));
  }

  function remove(chatId: string): void {
    if (streamingTarget?.chatId === chatId) {
      abort();
    }
    const nextChats = state.chats.filter((chat) => chat.id !== chatId);
    const nextActive = state.activeChatId === chatId ? null : state.activeChatId;
    setState(
      {
        ...state,
        chats: nextChats,
        activeChatId: nextActive
      },
      true
    );
  }

  function ensureThread(targetChatId: string | null | undefined, titleSeed: string): ChatThread {
    const resolvedId = targetChatId !== undefined ? targetChatId : state.activeChatId;
    if (resolvedId) {
      const existing = state.chats.find((chat) => chat.id === resolvedId);
      if (existing) return existing;
    }

    const now = Date.now();
    const created: ChatThread = {
      id: createId(),
      title: deriveTitle(titleSeed),
      reasoning: state.defaultReasoning,
      messages: [],
      createdAt: now,
      updatedAt: now
    };
    setState(
      {
        ...state,
        chats: pruneChats([created, ...state.chats]),
        activeChatId: created.id
      },
      true
    );
    return created;
  }

  async function runRemoteTurn(
    chatId: string,
    assistantId: string,
    payloadMessage: string,
    history: Array<{ role: 'user' | 'model'; text: string }>,
    reasoning: Reasoning,
    skill?: ChatSkill,
    regenerate?: boolean
  ): Promise<void> {
    if (!fetchFn) {
      updateMessage(chatId, assistantId, (msg) => ({
        ...msg,
        status: 'error',
        text: t('chat.unavailable'),
        error: t('chat.unavailable')
      }));
      setState({ ...state, isStreaming: false }, true);
      return;
    }

    const controller = new AbortController();
    activeAbort = controller;
    streamingTarget = { chatId, messageId: assistantId };
    setState({ ...state, isStreaming: true }, false);

    let deltaBuffer = '';
    let rafId: number | null = null;
    let finishedByEvent = false;

    const flushDelta = () => {
      if (rafId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (!deltaBuffer) return;
      const chunk = deltaBuffer;
      deltaBuffer = '';
      updateMessage(
        chatId,
        assistantId,
        (msg) => ({
          ...msg,
          text: msg.text + chunk
        }),
        false
      );
    };

    const scheduleFlush = () => {
      if (typeof requestAnimationFrame !== 'function') {
        flushDelta();
        return;
      }
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        flushDelta();
      });
    };

    const handleEvent = (event: ChatSseEvent) => {
      switch (event.type) {
        case 'delta':
          deltaBuffer += event.text;
          scheduleFlush();
          break;
        case 'cards':
          flushDelta();
          updateMessage(chatId, assistantId, (msg) => ({ ...msg, cards: event.cards }), false);
          break;
        case 'actions':
          flushDelta();
          updateMessage(chatId, assistantId, (msg) => ({ ...msg, actions: event.actions }), false);
          break;
        case 'notice':
          flushDelta();
          updateMessage(chatId, assistantId, (msg) => ({ ...msg, notice: event.text }), false);
          break;
        case 'retract':
          deltaBuffer = '';
          if (rafId !== null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          finishedByEvent = true;
          updateMessage(chatId, assistantId, (msg) => ({
            ...msg,
            text: event.reply,
            cards: undefined,
            actions: undefined,
            status: 'done'
          }));
          break;
        case 'error':
          flushDelta();
          finishedByEvent = true;
          updateMessage(chatId, assistantId, (msg) => ({
            ...msg,
            text: msg.text || event.reply,
            error: event.reply,
            status: 'error'
          }));
          break;
        case 'done':
          flushDelta();
          finishedByEvent = true;
          updateMessage(chatId, assistantId, (msg) => ({
            ...msg,
            status: msg.status === 'error' ? 'error' : 'done'
          }));
          break;
      }
    };

    try {
      const requestBody: Record<string, unknown> = {
        message: payloadMessage.slice(0, MESSAGE_LIMIT),
        history,
        reasoning
      };
      if (skill) {
        requestBody.skill = skill;
      }
      if (regenerate) {
        requestBody.regenerate = true;
      }

      const response = await fetchFn('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        let errorText = t('chat.unavailable');
        try {
          const errJson = (await response.json()) as { error?: string; reply?: string };
          errorText = errJson.error || errJson.reply || errorText;
        } catch {
          // Use fallback message.
        }
        updateMessage(chatId, assistantId, (msg) => ({
          ...msg,
          text: errorText,
          error: errorText,
          status: 'error'
        }));
        return;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!response.body || !contentType.includes('text/event-stream')) {
        try {
          const json = (await response.json()) as {
            reply?: string;
            actions?: ChatAction[];
            cards?: ChatCardRef[];
            error?: string;
          };
          updateMessage(chatId, assistantId, (msg) => ({
            ...msg,
            text: json.reply || json.error || t('chat.unavailable'),
            actions: json.actions,
            cards: json.cards,
            error: json.error,
            status: json.error && !json.reply ? 'error' : 'done'
          }));
        } catch {
          updateMessage(chatId, assistantId, (msg) => ({
            ...msg,
            text: t('chat.unavailable'),
            error: t('chat.unavailable'),
            status: 'error'
          }));
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

        let splitIndex = buffer.indexOf('\n\n');
        while (splitIndex !== -1) {
          const rawBlock = buffer.slice(0, splitIndex);
          buffer = buffer.slice(splitIndex + 2);
          const event = parseSseBlock(rawBlock);
          if (event) handleEvent(event);
          splitIndex = buffer.indexOf('\n\n');
        }
      }

      buffer += decoder.decode().replace(/\r\n/g, '\n');
      if (buffer.trim()) {
        const event = parseSseBlock(buffer);
        if (event) handleEvent(event);
      }

      flushDelta();
      if (!finishedByEvent) {
        updateMessage(chatId, assistantId, (msg) => ({
          ...msg,
          status: msg.status === 'streaming' ? 'done' : msg.status
        }));
      }
    } catch (err) {
      flushDelta();
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      if (isAbort) {
        updateMessage(chatId, assistantId, (msg) => ({
          ...msg,
          status: 'aborted'
        }));
      } else {
        updateMessage(chatId, assistantId, (msg) => ({
          ...msg,
          text: msg.text || t('chat.unavailable'),
          error: t('chat.unavailable'),
          status: 'error'
        }));
      }
    } finally {
      if (rafId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
      }
      if (activeAbort === controller) {
        activeAbort = null;
      }
      if (streamingTarget?.messageId === assistantId) {
        streamingTarget = null;
      }
      setState({ ...state, isStreaming: false }, true);
    }
  }

  async function send(rawText: string, opts: SendOptions = {}): Promise<string | null> {
    const trimmed = rawText.trim();
    const attachmentText = opts.attachmentText?.trim() ?? '';
    if (!trimmed && !attachmentText) return null;

    if (state.isStreaming) {
      abort();
    }

    const parsed = parseSlashCommand(trimmed, opts.skill);
    const displayUserText = trimmed || (opts.attachmentName ? `Arquivo anexado: ${opts.attachmentName}` : '');
    const thread = ensureThread(opts.chatId, displayUserText);
    const now = Date.now();

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      text: displayUserText,
      status: 'done',
      createdAt: now,
      skill: parsed.kind === 'remote' ? parsed.skill : undefined,
      attachmentName: opts.attachmentName
    };

    if (parsed.kind === 'local-v1') {
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: 'A primeira versão do portfólio continua arquivada por aqui. Você pode abrir o card abaixo para visitar o `/v1`.',
        status: 'done',
        createdAt: now + 1,
        cards: [{ kind: 'v1' }],
        actions: [{ label: 'Abrir v1', type: 'route', value: '/v1' }]
      };
      updateChat(thread.id, (chat) => ({
        ...chat,
        updatedAt: now + 1,
        messages: [...chat.messages, userMessage, assistantMessage]
      }));
      return thread.id;
    }

    if (parsed.kind === 'local-contact') {
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: 'Preencha o formulário abaixo para enviar um recado direto para o Pedro. O envio só acontece quando você clicar no botão.',
        status: 'done',
        createdAt: now + 1,
        cards: [{ kind: 'contact', prefill: parsed.prefill || undefined }]
      };
      updateChat(thread.id, (chat) => ({
        ...chat,
        updatedAt: now + 1,
        messages: [...chat.messages, userMessage, assistantMessage]
      }));
      return thread.id;
    }

    if (parsed.kind === 'local-help') {
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: [
          'Comandos disponíveis neste chat:',
          '',
          '- `/vaga [descrição]`: compara os requisitos de uma vaga com a experiência real do Pedro',
          '- `/resumo`: gera um resumo direto do perfil para recrutadores',
          '- `/contato [mensagem]`: abre o formulário para enviar um recado',
          '- `/v1`: mostra o card da primeira versão arquivada do portfólio'
        ].join('\n'),
        status: 'done',
        createdAt: now + 1
      };
      updateChat(thread.id, (chat) => ({
        ...chat,
        updatedAt: now + 1,
        messages: [...chat.messages, userMessage, assistantMessage]
      }));
      return thread.id;
    }

    if (parsed.skill === 'vaga' && !parsed.content && !attachmentText) {
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: 'Cole a descrição da vaga depois de `/vaga` ou anexe um arquivo `.txt` ou `.md` pelo botão `+` para avaliar a aderência.',
        status: 'done',
        createdAt: now + 1
      };
      updateChat(thread.id, (chat) => ({
        ...chat,
        updatedAt: now + 1,
        messages: [...chat.messages, userMessage, assistantMessage]
      }));
      return thread.id;
    }

    let remoteText = parsed.content;
    if (parsed.skill === 'resumo' && !remoteText && !attachmentText) {
      remoteText = 'Gere um resumo rápido do perfil do Pedro para recrutadores.';
    }
    if (attachmentText) {
      const header = opts.attachmentName ? `[Anexo: ${opts.attachmentName}]\n` : '[Anexo]\n';
      remoteText = remoteText ? `${remoteText}\n\n${header}${attachmentText}` : `${header}${attachmentText}`;
    }

    const latestThread = state.chats.find((c) => c.id === thread.id) ?? thread;
    const history = latestThread.messages
      .filter((msg) => msg.status === 'done' && msg.text.trim().length > 0)
      .slice(-HISTORY_LIMIT)
      .map((msg) => ({
        role: msg.role === 'user' ? ('user' as const) : ('model' as const),
        text: msg.text.slice(0, MESSAGE_LIMIT)
      }));

    const assistantMessage: ChatMessage = {
      id: createId(),
      role: 'assistant',
      text: '',
      status: 'streaming',
      createdAt: now + 1,
      reasoning: latestThread.reasoning,
      skill: parsed.skill
    };

    updateChat(thread.id, (chat) => ({
      ...chat,
      updatedAt: now + 1,
      messages: [...chat.messages, userMessage, assistantMessage]
    }));

    await runRemoteTurn(
      thread.id,
      assistantMessage.id,
      remoteText,
      history,
      latestThread.reasoning,
      parsed.skill,
      opts.regenerate
    );

    return thread.id;
  }

  async function regenerate(chatId: string): Promise<string | null> {
    const thread = state.chats.find((c) => c.id === chatId);
    if (!thread || thread.messages.length === 0) return null;

    if (state.isStreaming) {
      abort();
    }

    let lastUserIndex = -1;
    for (let i = thread.messages.length - 1; i >= 0; i -= 1) {
      if (thread.messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return null;

    const lastUser = thread.messages[lastUserIndex];
    const keptMessages = thread.messages.slice(0, lastUserIndex);

    updateChat(chatId, (chat) => ({
      ...chat,
      messages: keptMessages,
      updatedAt: Date.now()
    }));

    return send(lastUser.text, {
      chatId,
      skill: lastUser.skill,
      attachmentName: lastUser.attachmentName,
      regenerate: true
    });
  }

  return {
    getSnapshot,
    subscribe,
    newChat,
    selectChat,
    send,
    abort,
    regenerate,
    rename,
    remove,
    setReasoning
  };
}

export type ChatStore = ReturnType<typeof createChatStore>;

export const chatStore = createChatStore();

export function useChatStore(): ChatStoreState {
  return useSyncExternalStore(chatStore.subscribe, chatStore.getSnapshot, chatStore.getSnapshot);
}
