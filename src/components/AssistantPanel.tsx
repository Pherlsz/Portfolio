import { useEffect, useReducer, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Briefcase, Check, Copy, MessageSquare, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CTA } from './CTA';
import {
  JOB_DESCRIPTION_LIMIT,
  QUESTION_LIMIT,
  validateUserChatInput,
  type ChatMode
} from '../utils/chatGuardrails';
import {
  initialJobDescriptionEditorState,
  jobDescriptionEditorReducer,
  showCollapsedJobDescription,
  truncateJobDescriptionPreview
} from '../utils/jobDescriptionDisclosure';

export interface ChatAction {
  label: string;
  type: 'navigate' | 'export_cv';
  value: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  actions?: ChatAction[];
  followUps?: string[];
}

const SUGGESTED_QUESTIONS = [
  'Qual a principal experiência dele?',
  'Resumo rápido para recrutador',
  'Como ficou o design system e a WCAG?',
  'O que ele fez com IA na Atlas?',
  'Qual a stack principal?'
];

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'Oi! Posso resumir a carreira do **Pedro**, falar dos projetos ou comparar o perfil dele com a sua vaga. Respondo só sobre ele.',
  actions: [
    { label: 'Ver experiência', type: 'navigate', value: '#experiencia' },
    { label: 'Ver projetos', type: 'navigate', value: '#projeto' },
    { label: 'Ver CV', type: 'export_cv', value: 'pdf' }
  ]
};

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
  open,
  mode,
  onOpenChange,
  onModeChange,
  onOpenCv
}: {
  open: boolean;
  mode: ChatMode;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: ChatMode) => void;
  onOpenCv: () => void;
}) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const jobRef = useRef<HTMLTextAreaElement>(null);
  const jobDisclosureRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [question, setQuestion] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobQuestion, setJobQuestion] = useState('');
  const [activeJob, setActiveJob] = useState<string | null>(null);
  const [jobEditor, dispatchJobEditor] = useReducer(jobDescriptionEditorReducer, initialJobDescriptionEditorState);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const jobCollapsed = showCollapsedJobDescription(activeJob, jobEditor);
  const jobPreview = truncateJobDescriptionPreview(activeJob ?? jobDescription);

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
    if (jobEditor.expanded) jobRef.current?.focus();
  }, [jobEditor.expanded]);

  useEffect(() => {
    if (!activeJob || jobEditor.expanded) return;
    requestAnimationFrame(() => jobDisclosureRef.current?.focus());
  }, [activeJob, jobEditor.expanded]);

  const runAction = (action: ChatAction) => {
    if (action.type === 'export_cv') {
      onOpenChange(false);
      onOpenCv();
      return;
    }
    onOpenChange(false);
    requestAnimationFrame(() => document.querySelector(action.value)?.scrollIntoView());
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1600);
    });
  };

  const send = async (text: string, sendMode: ChatMode, opts?: { job?: string }) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const history = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', text: trimmed }]);

    const inputMode: ChatMode = opts?.job ? 'chat' : sendMode;
    const check = validateUserChatInput(trimmed, inputMode);
    if (!check.valid) {
      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: `**${check.error}**\n\nRespondo só sobre a carreira, os projetos, a stack e os bastidores do **${profile.name}**.`
        }
      ]);
      return;
    }

    if (sendMode === 'jobfit' && !opts?.job) {
      setActiveJob(check.sanitized);
      dispatchJobEditor({ type: 'job_submitted' });
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: sendMode,
          message: check.sanitized,
          history,
          ...(opts?.job ? { job: opts.job } : {})
        })
      });
      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        actions?: ChatAction[];
        followUps?: string[];
      };
      if (!response.ok && !data.reply) throw new Error(data.error);
      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.reply ?? '',
          actions: data.actions,
          followUps: data.followUps
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: 'Não consegui responder agora. As seções de **Experiência** e **Projeto** têm o resumo completo, e o CV está a um clique.',
          actions: WELCOME.actions
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    send(question, 'chat');
    setQuestion('');
  };

  const submitJob = (event: FormEvent) => {
    event.preventDefault();
    send(jobDescription, 'jobfit');
  };

  const expandJobDescription = () => {
    dispatchJobEditor({ type: 'expand' });
  };

  const collapseJobDescription = () => {
    if (activeJob) setJobDescription(activeJob);
    dispatchJobEditor({ type: 'collapse' });
    requestAnimationFrame(() => jobDisclosureRef.current?.focus());
  };

  const submitJobFollowUp = (event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    if (!activeJob) return;
    send(jobQuestion, 'jobfit', { job: activeJob });
    setJobQuestion('');
  };

  const sendFollowUp = (text: string) => {
    if (mode === 'jobfit' && activeJob) {
      send(text, 'jobfit', { job: activeJob });
      return;
    }
    send(text, 'chat');
  };

  const lastModelId = [...messages]
    .reverse()
    .find((msg) => msg.role === 'model' && msg.id !== 'welcome')?.id;

  const tabClass = (active: boolean) =>
    `inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors ${
      active ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
    }`;

  return (
    <>
      {!open && (
        <CTA
          variant="secondary"
          onClick={() => onOpenChange(true)}
          aria-haspopup="dialog"
          aria-expanded={false}
          aria-controls="assistente"
          className="no-print fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-30 shadow-lg shadow-neutral-950/20"
          icon={<Sparkles className="size-4" aria-hidden="true" />}
        >
          <span className="sm:hidden">Perguntar</span>
          <span className="hidden sm:inline">Pergunte sobre o Pedro</span>
        </CTA>
      )}

      <dialog
        ref={dialogRef}
        id="assistente"
        aria-labelledby="assistente-titulo"
        onClose={() => onOpenChange(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) onOpenChange(false);
        }}
        className="no-print fixed inset-x-0 bottom-0 top-auto m-0 h-[86dvh] max-h-none w-full max-w-none flex-col overflow-hidden rounded-t-[1.75rem] border border-line bg-surface p-0 text-ink shadow-2xl shadow-neutral-950/30 open:flex sm:inset-y-0 sm:left-auto sm:right-0 sm:h-dvh sm:max-w-md sm:rounded-none sm:rounded-l-[1.75rem]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-3 py-3 sm:px-5 sm:py-4">
          <div>
            <h2 id="assistente-titulo" className="display text-lg">
              Assistente do portfólio
            </h2>
            <p className="hidden text-sm text-muted sm:block">Responde só sobre o Pedro, com base neste site.</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar assistente"
            className="icon-btn size-10 shrink-0"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2 sm:px-5 sm:py-2.5">
          <div className="flex gap-1" role="group" aria-label="Modo do assistente">
            <button type="button" aria-pressed={mode === 'chat'} onClick={() => onModeChange('chat')} className={tabClass(mode === 'chat')}>
              <MessageSquare className="size-4" aria-hidden="true" />
              Perguntas
            </button>
            <button type="button" aria-pressed={mode === 'jobfit'} onClick={() => onModeChange('jobfit')} className={tabClass(mode === 'jobfit')}>
              <Briefcase className="size-4" aria-hidden="true" />
              Fit com vaga
            </button>
          </div>
          {messages.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setMessages([WELCOME]);
                setActiveJob(null);
                setJobQuestion('');
                setJobDescription('');
                dispatchJobEditor({ type: 'clear' });
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm text-ink-soft hover:text-ink"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Limpar
            </button>
          )}
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
                  msg.role === 'user' ? 'bg-ink text-paper' : 'border border-line bg-paper text-ink-soft'
                }`}
              >
                {msg.role === 'model' ? renderFormattedText(msg.text) : <p className="whitespace-pre-wrap">{msg.text}</p>}
                {msg.role === 'model' && msg.id !== 'welcome' && (
                  <button
                    type="button"
                    onClick={() => copyMessage(msg.id, msg.text)}
                    aria-label="Copiar resposta"
                    className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-lg border border-control bg-surface text-muted hover:text-ink"
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
                      className="inline-flex min-h-8 items-center gap-1 rounded-full border border-line px-3 text-sm hover:border-ink"
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
                      className="inline-flex min-h-8 items-center rounded-full border border-dashed border-control px-3 text-sm text-ink-soft hover:border-ink hover:text-ink disabled:opacity-50"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && <p className="eyebrow">Consultando o portfólio…</p>}
          <div ref={endRef} />
        </div>

        {mode === 'jobfit' ? (
          <form
            onSubmit={submitJob}
            className={`min-h-0 shrink-0 border-t border-line sm:max-h-none sm:overflow-visible sm:p-4 ${
              jobCollapsed ? 'p-2 max-sm:max-h-none max-sm:overflow-visible' : 'max-h-[45%] overflow-y-auto overscroll-contain p-3'
            }`}
          >
            <p className="hidden text-[0.9375rem] text-ink-soft sm:block">
              {activeJob
                ? 'Pergunte sobre a vaga em análise ou cole outra descrição para substituir.'
                : 'Cole o anúncio da vaga. A análise usa esse texto, não um modelo pronto.'}
            </p>
            {activeJob && (
              <div className="flex items-center gap-1.5 sm:mt-3 sm:gap-2">
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
                  className="min-h-9 w-full rounded-full border border-control bg-paper px-3 text-[0.9375rem] placeholder:text-muted sm:min-h-11 sm:px-4"
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
                aria-controls="assistente-vaga-editor"
                aria-label={`Vaga em análise. Editar descrição da vaga: ${jobPreview}`}
                onClick={expandJobDescription}
                className="mt-1.5 w-full rounded-2xl border border-control bg-paper px-3 py-2 text-left outline-none transition-colors hover:border-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:mt-3 sm:px-4 sm:py-3"
              >
                <span className="block font-semibold text-ink">Vaga em análise · Editar</span>
                <span className="mt-1 block truncate text-sm text-muted">{jobPreview}</span>
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
                    e.stopPropagation();
                    collapseJobDescription();
                  }}
                  placeholder="Cole aqui os requisitos da vaga…"
                  className="mt-2 block max-h-[calc(8lh+2rem)] min-h-[calc(4lh+2rem)] w-full resize-y overflow-y-auto rounded-2xl border border-control bg-paper p-4 text-[0.9375rem] leading-relaxed placeholder:text-muted"
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  {activeJob && (
                    <button
                      type="button"
                      onClick={collapseJobDescription}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-line px-4 text-sm font-semibold text-ink-soft hover:border-ink hover:text-ink sm:w-auto"
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
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q, 'chat')}
                  disabled={isLoading}
                  className="shrink-0 whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-sm text-ink-soft hover:border-ink hover:text-ink disabled:opacity-50"
                >
                  {q}
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
                className="min-h-11 w-full rounded-full border border-control bg-paper px-4 text-[0.9375rem] placeholder:text-muted"
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
    </>
  );
}
