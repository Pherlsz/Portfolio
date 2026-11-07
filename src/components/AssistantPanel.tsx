import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { ArrowUpRight, Check, Copy, Loader2, RotateCcw, Send, X } from 'lucide-react';
import { smoothScrollToSection } from './ui';
import { MESSAGE_LIMIT, SUGGESTED_QUESTIONS } from '../utils/chat';
import { AiReplyBadge } from './AiReplyBadge';
import type { AssistantSession, ChatAction } from '../utils/assistantSession';

export type { ChatAction };

function renderFormattedText(text: string) {
  return text.split('\n').map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={lineIdx} className="h-2" />;

    const isBullet = /^[-*•]\s/.test(trimmed);
    const isHeading = trimmed.startsWith('#');
    const content = isBullet ? trimmed.slice(2) : isHeading ? trimmed.replace(/^#+\s*/, '') : trimmed;

    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-bold text-ink">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={pIdx} className="rounded bg-paper px-1.5 py-0.5 font-mono text-[0.8125rem]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={pIdx}>{part}</span>;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex gap-2 py-0.5">
          <span aria-hidden="true" className="mt-[0.8em] h-px w-3 shrink-0 bg-current" />
          <span className="flex-1">{parts}</span>
        </div>
      );
    }
    return (
      <p key={lineIdx} className={`py-0.5 ${isHeading ? 'font-bold text-ink' : ''}`}>
        {parts}
      </p>
    );
  });
}

export function AssistantPanel({
  session,
  open,
  onOpenChange,
  onOpenCv
}: {
  session: AssistantSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCv: () => void;
}) {
  const { messages, question, isLoading } = useSyncExternalStore(
    session.subscribe,
    session.getState,
    session.getState
  );
  const { setQuestion, clearChat, send } = session;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isLoading, open]);

  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const keepTailVisible = () => {
      endRef.current?.scrollIntoView({ block: 'end' });
    };
    viewport.addEventListener('resize', keepTailVisible);
    return () => viewport.removeEventListener('resize', keepTailVisible);
  }, [open]);

  const runAction = (action: ChatAction) => {
    if (action.type === 'export_cv') {
      onOpenChange(false);
      onOpenCv();
      return;
    }
    onOpenChange(false);
    requestAnimationFrame(() => {
      smoothScrollToSection(action.value);
    });
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1600);
    });
  };

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    void send(question);
    setQuestion('');
  };

  return (
    <dialog
      ref={dialogRef}
      id="assistente"
      aria-labelledby="assistente-titulo"
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.target === dialogRef.current) onOpenChange(false);
      }}
      className="assistant-dialog no-print fixed inset-x-0 bottom-0 top-auto m-0 h-[86dvh] max-h-none w-full max-w-none flex-col overflow-hidden border border-line bg-surface p-0 text-ink shadow-2xl shadow-neutral-950/30 open:flex short-mobile:inset-0 short-mobile:top-0 short-mobile:h-dvh sm:inset-y-0 sm:left-auto sm:right-0 sm:h-dvh sm:max-w-md"
    >
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <h2 id="assistente-titulo" className="display text-lg">
            Assistente do portfólio
          </h2>
          <p className="hidden text-sm text-muted sm:block">Responde sobre experiência, stack e projetos.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {messages.length > 1 && (
            <button
              type="button"
              onClick={clearChat}
              aria-label="Limpar conversa"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 px-3 text-sm text-ink-soft hover:text-ink"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar assistente"
            className="icon-btn shrink-0"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        role="log"
        aria-live="polite"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 sm:p-5"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`group relative max-w-[90%] rounded-2xl px-4 py-3 text-[0.9375rem] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-ink text-paper'
                  : 'border border-line bg-paper pr-10 text-ink-soft'
              }`}
            >
              {msg.role === 'model' && msg.source === 'ai' && <AiReplyBadge />}
              {msg.role === 'model' ? renderFormattedText(msg.text) : <p className="whitespace-pre-wrap">{msg.text}</p>}
              {msg.role === 'model' && msg.id !== 'welcome' && (
                <button
                  type="button"
                  onClick={() => copyMessage(msg.id, msg.text)}
                  aria-label="Copiar resposta"
                  className="absolute right-2 top-2 inline-flex size-8 items-center justify-center border border-control bg-surface text-muted hover:text-ink"
                >
                  {copiedId === msg.id ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
            {msg.role === 'model' && msg.actions && msg.actions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {msg.actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => runAction(action)}
                    className="inline-flex min-h-11 items-center gap-1 border border-line px-3 text-sm hover:border-ink"
                  >
                    {action.label}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start">
            <div className="inline-flex items-center gap-2.5 rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink-soft">
              <Loader2 className="size-4 animate-spin text-ink" aria-hidden="true" />
              <span>Consultando o portfólio…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-line p-4">
        {messages.length <= 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-3 [scrollbar-width:none]">
            {SUGGESTED_QUESTIONS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => send(text)}
                disabled={isLoading}
                className="shrink-0 whitespace-nowrap border border-line px-3 py-1.5 text-sm text-ink-soft hover:border-ink hover:text-ink disabled:opacity-50"
              >
                {text}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={submitQuestion} className="flex items-center gap-2">
          <label htmlFor="assistente-pergunta" className="sr-only">
            Sua pergunta
          </label>
          <input
            ref={inputRef}
            id="assistente-pergunta"
            name="pergunta"
            autoComplete="off"
            maxLength={MESSAGE_LIMIT}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pergunte sobre experiência, stack ou projetos…"
            className="min-h-11 w-full border border-control bg-paper px-4 text-[0.9375rem] placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            aria-label="Enviar pergunta"
            className="icon-btn shrink-0 bg-ink text-paper disabled:opacity-40"
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </dialog>
  );
}
