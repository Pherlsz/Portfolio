import { Suspense, lazy, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { t } from '../i18n/pt-BR';
import type { Reasoning } from '../utils/chat';
import { chatStore, useChatStore } from './chatStore';
import Composer, { type ComposerSubmitPayload } from './Composer';
import Suggestions from './Suggestions';

const MessageBubble = lazy(() => import('./MessageBubble'));

interface ChatViewProps {
  chatId?: string;
}

export default function ChatView({ chatId }: ChatViewProps) {
  const state = useChatStore();
  const [location, setLocation] = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      if (state.activeChatId !== chatId && state.chats.some((c) => c.id === chatId)) {
        chatStore.selectChat(chatId);
      }
    } else if (location === '/' && state.activeChatId !== null && !state.isStreaming) {
      chatStore.selectChat(null);
    }
  }, [chatId, location, state.activeChatId, state.chats, state.isStreaming]);

  const activeThread = chatId
    ? state.chats.find((c) => c.id === chatId) ?? null
    : state.activeChatId
      ? state.chats.find((c) => c.id === state.activeChatId) ?? null
      : null;

  const reasoning: Reasoning = activeThread?.reasoning ?? state.defaultReasoning;
  const messages = activeThread?.messages ?? [];
  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || messages.length === 0) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 240 || lastMessage?.role === 'user') {
      bottomAnchorRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [messages.length, lastMessage?.text, lastMessage?.status, lastMessage?.role]);

  const handleReasoningChange = useCallback(
    (next: Reasoning) => {
      chatStore.setReasoning(activeThread?.id ?? null, next);
    },
    [activeThread?.id]
  );

  const handleSend = useCallback(
    async (payload: ComposerSubmitPayload) => {
      const targetId = await chatStore.send(payload.text, {
        chatId: activeThread?.id ?? null,
        skill: payload.skill,
        attachmentText: payload.attachmentText,
        attachmentName: payload.attachmentName
      });
      if (targetId && location !== `/c/${targetId}`) {
        setLocation(`/c/${targetId}`);
      }
    },
    [activeThread?.id, location, setLocation]
  );

  const handleSuggestionSelect = useCallback(
    async (prompt: string) => {
      const targetId = await chatStore.send(prompt, {
        chatId: activeThread?.id ?? null
      });
      if (targetId && location !== `/c/${targetId}`) {
        setLocation(`/c/${targetId}`);
      }
    },
    [activeThread?.id, location, setLocation]
  );

  const handleStop = useCallback(() => {
    chatStore.abort();
  }, []);

  const handleRegenerate = useCallback(() => {
    if (!activeThread) return;
    void chatStore.regenerate(activeThread.id);
  }, [activeThread]);

  const handleContactAction = useCallback(
    async (prefill?: string) => {
      const cmd = prefill ? `/contato ${prefill}` : '/contato';
      const targetId = await chatStore.send(cmd, { chatId: activeThread?.id ?? null });
      if (targetId && location !== `/c/${targetId}`) {
        setLocation(`/c/${targetId}`);
      }
    },
    [activeThread?.id, location, setLocation]
  );

  const { profile } = DEFAULT_PORTFOLIO_DATA;

  if (!activeThread || messages.length === 0) {
    return (
      <div className="ambient-glow flex min-h-full flex-col items-center justify-center px-4 pt-16 pb-10 sm:px-8 lg:py-12">
        <div className="flex w-full max-w-[44rem] flex-col items-center">
          <p className="mb-4 flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center text-ui text-muted">
            <span className="font-medium text-ink-soft">{profile.name}</span>
            <span aria-hidden="true">·</span>
            <span>{profile.jobTitle}</span>
            <span aria-hidden="true">·</span>
            <span>{profile.location}</span>
          </p>

          <h1 className="mb-8 text-center font-display text-hero font-bold tracking-[-0.025em] text-ink">
            {t('chat.greeting')}
          </h1>

          <Composer
            reasoning={reasoning}
            onReasoningChange={handleReasoningChange}
            isStreaming={state.isStreaming}
            onSend={handleSend}
            onStop={handleStop}
            autoFocus
          />

          <Suggestions onSelect={handleSuggestionSelect} disabled={state.isStreaming} />
        </div>
      </div>
    );
  }

  const olderCutoff = Math.max(0, messages.length - 4);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h1 className="sr-only">{activeThread?.title || t('nav.newChat')}</h1>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scroll-pb-44 px-4 pt-16 pb-6 sm:px-8 lg:pt-10"
      >
        <div className="mx-auto flex w-full max-w-[44rem] flex-col gap-6">
          <Suspense fallback={null}>
            {messages.map((message, index) => {
              const isOlder = index < olderCutoff;
              const isLastAssistant =
                index === messages.length - 1 &&
                message.role === 'assistant' &&
                message.status !== 'streaming';

              return (
                <div
                  key={message.id}
                  style={
                    isOlder
                      ? {
                          contentVisibility: 'auto',
                          containIntrinsicSize: 'auto 120px'
                        }
                      : undefined
                  }
                >
                  <MessageBubble
                    message={message}
                    canRegenerate={isLastAssistant}
                    onRegenerate={isLastAssistant ? handleRegenerate : undefined}
                    onContactAction={handleContactAction}
                  />
                </div>
              );
            })}
          </Suspense>
          <div ref={bottomAnchorRef} aria-hidden="true" className="h-2" />
        </div>
      </div>

      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-canvas via-canvas/95 to-transparent px-4 pt-6 pb-4 sm:px-8">
        <div className="mx-auto w-full max-w-[44rem]">
          <Composer
            reasoning={reasoning}
            onReasoningChange={handleReasoningChange}
            isStreaming={state.isStreaming}
            onSend={handleSend}
            onStop={handleStop}
          />
        </div>
      </div>
    </div>
  );
}
