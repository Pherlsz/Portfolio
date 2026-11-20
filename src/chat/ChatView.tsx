import { Suspense, lazy, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown } from 'lucide-react';
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
  const messagesWrapperRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const stickToBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const getScrollParent = useCallback((): HTMLElement | null => {
    const inner = scrollContainerRef.current;
    if (inner && inner.scrollHeight > inner.clientHeight + 4) {
      return inner;
    }
    const main = document.getElementById('conteudo');
    return main instanceof HTMLElement ? main : inner;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveBehavior: ScrollBehavior = prefersReduced ? 'auto' : behavior;
    bottomAnchorRef.current?.scrollIntoView({ behavior: effectiveBehavior, block: 'end' });
  }, []);

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
    if (messages.length === 0) {
      prevMessageCountRef.current = 0;
      stickToBottomRef.current = true;
      setShowScrollButton(false);
      return;
    }

    const addedNewMessages = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (addedNewMessages) {
      stickToBottomRef.current = true;
      setShowScrollButton(false);
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
      return;
    }

    const scroller = getScrollParent();
    if (!scroller) return;
    const distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (stickToBottomRef.current || distanceFromBottom < 260) {
      scrollToBottom('auto');
    }
  }, [
    messages.length,
    lastMessage?.text,
    lastMessage?.status,
    getScrollParent,
    scrollToBottom
  ]);

  useEffect(() => {
    if (messages.length === 0) return;

    const handleScroll = () => {
      const scroller = getScrollParent();
      if (!scroller) return;
      const distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      if (distanceFromBottom > 220) {
        stickToBottomRef.current = false;
        setShowScrollButton(true);
      } else {
        stickToBottomRef.current = true;
        setShowScrollButton(false);
      }
    };

    const inner = scrollContainerRef.current;
    const main = document.getElementById('conteudo');
    inner?.addEventListener('scroll', handleScroll, { passive: true });
    main?.addEventListener('scroll', handleScroll, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && messagesWrapperRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (stickToBottomRef.current) {
          scrollToBottom('auto');
        }
      });
      resizeObserver.observe(messagesWrapperRef.current);
    }

    handleScroll();

    return () => {
      inner?.removeEventListener('scroll', handleScroll);
      main?.removeEventListener('scroll', handleScroll);
      resizeObserver?.disconnect();
    };
  }, [messages.length, getScrollParent, scrollToBottom]);

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
      <div className="flex min-h-full w-full flex-col items-center px-4 pt-20 pb-8 sm:px-8 sm:py-12">
        <div className="flex w-full max-w-[46rem] flex-col items-center sm:my-auto">
          <p className="mb-3.5 flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center font-mono text-micro text-muted sm:mb-4">
            <span className="font-medium text-ink-soft">{profile.name}</span>
            <span aria-hidden="true">·</span>
            <span>{profile.jobTitle}</span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span className="basis-full sm:basis-auto">{profile.location}</span>
          </p>

          <h1 className="mb-6 max-w-[18ch] text-center font-display text-[length:var(--text-poster)] font-extrabold leading-[1.03] tracking-[-0.035em] text-ink sm:mb-8">
            <span className="word-reveal">
              <span
                className="word-reveal-inner"
                style={{ '--reveal-delay': '0ms' } as CSSProperties}
              >
                O que você quer saber
              </span>
            </span>{' '}
            <span className="word-reveal">
              <span
                className="word-reveal-inner"
                style={{ '--reveal-delay': '70ms' } as CSSProperties}
              >
                sobre o trabalho do Pedro?
              </span>
            </span>
          </h1>

          <div className="w-full max-w-[44rem]">
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
        <div ref={messagesWrapperRef} className="mx-auto flex w-full max-w-[44rem] flex-col gap-6">
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
        <div className="relative mx-auto w-full max-w-[44rem]">
          {showScrollButton ? (
            <div className="pointer-events-none absolute -top-11 right-0 left-0 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  stickToBottomRef.current = true;
                  setShowScrollButton(false);
                  scrollToBottom('smooth');
                }}
                aria-label="Ir para a mensagem mais recente"
                className="focus-ring pointer-events-auto inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-pill border border-border-strong bg-surface px-3 py-1 font-mono text-micro text-ink shadow-float transition-colors duration-150 hover:bg-surface-hover"
              >
                <ArrowDown className="size-3.5" aria-hidden="true" />
                <span>Nova mensagem</span>
              </button>
            </div>
          ) : null}
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
