import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { ArrowUpRight, Briefcase, Check, Copy, Loader2, MessageSquare, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { CTA } from './CTA';
import { smoothScrollToSection } from './ui';
import {
  JOB_DESCRIPTION_LIMIT,
  QUESTION_LIMIT,
  type ChatMode
} from '../utils/chatGuardrails';
import { presetChipText, SUGGESTED_PRESET_IDS } from '../utils/presetQuestions';
import { AiReplyBadge } from './AiReplyBadge';
import type { AssistantSession, ChatAction } from '../utils/assistantSession';

export type { ChatAction };

function truncatePreview(raw: string, maxChars = 72): string {
  const flat = raw.replace(/\s+/g, ' ').trim();
  if (!flat || flat.length <= maxChars) return flat;
  return `${flat.slice(0, maxChars - 1).trimEnd()}…`;
}

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
  mode,
  onOpenChange,
  onModeChange,
  onOpenCv
}: {
  session: AssistantSession;
  open: boolean;
  mode: ChatMode;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: ChatMode) => void;
  onOpenCv: () => void;
}) {
  const sessionState = useSyncExternalStore(session.subscribe, session.getState, session.getState);
  const { messages, question, jobDescription, jobQuestion, activeJob, jobExpanded, isLoading } = sessionState;
  const { setQuestion, setJobDescription, setJobQuestion, setJobExpanded, clearChat, send } = session;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const jobRef = useRef<HTMLTextAreaElement>(null);
  const jobDisclosureRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const jobCollapsed = Boolean(activeJob) && !jobExpanded;
  const jobPreview = truncatePreview(activeJob ?? jobDescription);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      const field = (mode === 'jobfit' ? jobRef : inputRef).current;
      if (field instanceof HTMLTextAreaElement) field.style.height = '';
      field?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, mode]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isLoading, open]);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(max-width: 639px)');
    const { documentElement: html, body } = document;
    let prevHtmlOverflow = '';
    let prevBodyOverflow = '';
    let locked = false;

    const lock = () => {
      if (!mq.matches || locked) return;
      prevHtmlOverflow = html.style.overflow;
      prevBodyOverflow = body.style.overflow;
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      locked = true;
    };

    const unlock = () => {
      if (!locked) return;
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      locked = false;
    };

    lock();
    const onMqChange = () => {
      if (mq.matches) lock();
      else unlock();
    };
    mq.addEventListener('change', onMqChange);
    return () => {
      mq.removeEventListener('change', onMqChange);
      unlock();
    };
  }, [open]);

  useEffect(() => {
    if (jobExpanded) jobRef.current?.focus();
  }, [jobExpanded]);

  useEffect(() => {
    if (!activeJob || jobExpanded) return;
    requestAnimationFrame(() => jobDisclosureRef.current?.focus());
  }, [activeJob, jobExpanded]);

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
    void send(question, 'chat');
    setQuestion('');
  };

  const submitJob = (event: FormEvent) => {
    event.preventDefault();
    void send(jobDescription, 'jobfit');
  };

  const expandJobDescription = () => {
    setJobExpanded(true);
  };

  const collapseJobDescription = () => {
    if (activeJob) setJobDescription(activeJob);
    setJobExpanded(false);
    requestAnimationFrame(() => jobDisclosureRef.current?.focus());
  };

  const submitJobFollowUp = (event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    if (!activeJob) return;
    void send(jobQuestion, 'jobfit', { job: activeJob });
    setJobQuestion('');
  };

  const sendFollowUp = (text: string) => {
    if (mode === 'jobfit' && activeJob) {
      void send(text, 'jobfit', { job: activeJob });
      return;
    }
    void send(text, 'chat');
  };

  const lastModelId = [...messages]
    .reverse()
    .find((msg) => msg.role === 'model' && msg.id !== 'welcome')?.id;

  const tabClass = (active: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-sm font-semibold transition-colors short-mobile:gap-1 short-mobile:px-2 short-mobile:text-xs ${
      active ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
    }`;

  return (
    <dialog
      ref={dialogRef}
      id="assistente"
      aria-labelledby="assistente-titulo"
      onClose={() => onOpenChange(false)}
      onCancel={(event) => {
        if (mode === 'jobfit' && activeJob && jobExpanded) {
          event.preventDefault();
          collapseJobDescription();
        }
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onOpenChange(false);
      }}
      className="assistant-dialog no-print fixed inset-x-0 bottom-0 top-auto m-0 h-[86dvh] max-h-none w-full max-w-none flex-col overflow-hidden border border-line bg-surface p-0 text-ink shadow-2xl shadow-neutral-950/30 open:flex short-mobile:inset-0 short-mobile:top-0 short-mobile:h-dvh sm:inset-y-0 sm:left-auto sm:right-0 sm:h-dvh sm:max-w-md"
    >
      <h2 id="assistente-titulo" className="sr-only">
        Assistente do portfólio
      </h2>

      <div className="flex items-start justify-between gap-3 border-b border-line px-3 py-3 short-mobile:hidden sm:px-5 sm:py-4">
        <div>
          <p className="display text-lg" aria-hidden="true">Assistente do portfólio</p>
          <p className="hidden text-sm text-muted sm:block">Responde só sobre o Pedro, com base neste site.</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Fechar assistente"
          className="icon-btn shrink-0"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2 short-mobile:flex-nowrap short-mobile:gap-1 short-mobile:px-2 short-mobile:py-1.5 sm:px-5 sm:py-2.5">
        <div
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] short-mobile:gap-0.5"
          role="group"
          aria-label="Modo do assistente"
        >
          <button type="button" aria-pressed={mode === 'chat'} onClick={() => onModeChange('chat')} className={tabClass(mode === 'chat')}>
            <MessageSquare className="size-4 shrink-0 short-mobile:size-3.5" aria-hidden="true" />
            Perguntas
          </button>
          <button type="button" aria-pressed={mode === 'jobfit'} onClick={() => onModeChange('jobfit')} className={tabClass(mode === 'jobfit')}>
            <Briefcase className="size-4 shrink-0 short-mobile:size-3.5" aria-hidden="true" />
            Fit com vaga
          </button>
        </div>
        {messages.length > 1 && (
          <button
            type="button"
            onClick={clearChat}
            aria-label="Limpar conversa"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 px-3 text-sm text-ink-soft hover:text-ink short-mobile:min-w-11 short-mobile:px-1.5"
          >
            <RotateCcw className="size-4 short-mobile:size-3.5" aria-hidden="true" />
            <span className="short-mobile:hidden">Limpar</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Fechar assistente"
          className="icon-btn hidden shrink-0 short-mobile:inline-flex"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div
        role="log"
        aria-live="polite"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 sm:p-5 short-mobile:p-2 short-mobile:space-y-3"
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
            {msg.role === 'model' && !isLoading && msg.id === lastModelId && msg.followUps && msg.followUps.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {msg.followUps.map((followUp) => (
                  <button
                    key={followUp}
                    type="button"
                    onClick={() => sendFollowUp(followUp)}
                    disabled={isLoading}
                    className="inline-flex min-h-11 items-center border border-dashed border-control px-3 text-sm text-ink-soft hover:border-ink hover:text-ink disabled:opacity-50"
                  >
                    {followUp}
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

      {mode === 'jobfit' ? (
        <form
          onSubmit={submitJob}
          className={`min-h-0 shrink-0 border-t border-line sm:max-h-none sm:overflow-visible sm:p-4 short-mobile:p-1.5 ${
            jobCollapsed ? 'p-2 max-sm:max-h-none max-sm:overflow-visible' : 'max-h-[45%] overflow-y-auto overscroll-contain p-3'
          }`}
        >
          <p className="hidden text-[0.9375rem] text-ink-soft sm:block">
            {activeJob
              ? 'Pergunte sobre a vaga em análise ou cole outra descrição para substituir.'
              : 'Cole o anúncio da vaga. A análise usa esse texto, não um modelo pronto.'}
          </p>
          {activeJob && (
            <div className="flex items-center gap-1.5 sm:mt-3 sm:gap-2 short-mobile:gap-1">
              <label htmlFor="assistente-vaga-pergunta" className="sr-only">
                Pergunta sobre a vaga
              </label>
              <input
                id="assistente-vaga-pergunta"
                name="vaga-pergunta"
                autoComplete="off"
                maxLength={QUESTION_LIMIT}
                value={jobQuestion}
                onChange={(e) => setJobQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || e.shiftKey) return;
                  e.preventDefault();
                  submitJobFollowUp(e);
                }}
                placeholder="Pergunte sobre esta vaga…"
                className="min-h-11 w-full border border-control bg-paper px-3 text-[0.9375rem] placeholder:text-muted short-mobile:px-2.5 short-mobile:text-sm sm:px-4"
              />
              <button
                type="button"
                onClick={(e) => submitJobFollowUp(e)}
                disabled={!jobQuestion.trim() || isLoading}
                aria-label="Enviar pergunta sobre a vaga"
                className="icon-btn shrink-0 bg-ink text-paper disabled:opacity-40"
              >
                <Send className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
          {jobCollapsed ? (
            <button
              ref={jobDisclosureRef}
              type="button"
              id="assistente-vaga-disclosure"
              aria-expanded={false}
              aria-label={`Vaga em análise. Editar descrição da vaga: ${jobPreview}`}
              onClick={expandJobDescription}
              className="mt-1.5 flex min-h-11 w-full flex-col justify-center border border-control bg-paper px-3 py-2 text-left outline-none transition-colors hover:border-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface short-mobile:mt-1 short-mobile:flex-row short-mobile:items-center short-mobile:gap-1.5 short-mobile:px-2.5 short-mobile:py-2 sm:mt-3 sm:px-4 sm:py-3"
            >
              <span className="font-semibold text-ink short-mobile:shrink-0 short-mobile:text-sm">
                Vaga em análise · Editar
              </span>
              <span className="mt-1 block truncate text-sm text-muted short-mobile:mt-0 short-mobile:min-w-0 short-mobile:flex-1">
                {jobPreview}
              </span>
            </button>
          ) : (
            <>
              <label htmlFor="assistente-vaga-editor" className="mt-2 block font-semibold sm:mt-3">
                Descrição da vaga
              </label>
              <textarea
                ref={jobRef}
                id="assistente-vaga-editor"
                name="vaga"
                rows={4}
                maxLength={JOB_DESCRIPTION_LIMIT}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Escape' || !activeJob) return;
                  e.preventDefault();
                  collapseJobDescription();
                }}
                placeholder="Cole aqui os requisitos da vaga…"
                className="mt-2 block max-h-[calc(8lh+2rem)] min-h-[calc(4lh+2rem)] w-full resize-y overflow-y-auto border border-control bg-paper p-4 text-[0.9375rem] leading-relaxed placeholder:text-muted"
              />
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                {activeJob && (
                  <button
                    type="button"
                    onClick={collapseJobDescription}
                    className="inline-flex min-h-11 w-full items-center justify-center border border-line px-4 text-sm font-semibold text-ink-soft hover:border-ink hover:text-ink sm:w-auto"
                  >
                    Cancelar
                  </button>
                )}
                <CTA
                  type="submit"
                  variant="secondary"
                  disabled={!jobDescription.trim() || isLoading}
                  className="w-full sm:flex-1"
                  icon={<Sparkles className="size-4" aria-hidden="true" />}
                >
                  Analisar fit
                </CTA>
              </div>
            </>
          )}
        </form>
      ) : (
        <div className="shrink-0 border-t border-line p-4">
          {messages.length <= 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-3 [scrollbar-width:none]">
              {SUGGESTED_PRESET_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => send(presetChipText(id), 'chat', { presetId: id })}
                  disabled={isLoading}
                  className="shrink-0 whitespace-nowrap border border-line px-3 py-1.5 text-sm text-ink-soft hover:border-ink hover:text-ink disabled:opacity-50"
                >
                  {presetChipText(id)}
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
              maxLength={QUESTION_LIMIT}
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
      )}
    </dialog>
  );
}
