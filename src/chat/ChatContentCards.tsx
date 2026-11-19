import { useId, useState, type FormEvent } from 'react';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Briefcase,
  Check,
  FileText,
  FolderGit2,
  History,
  Send
} from 'lucide-react';
import { useLocation } from 'wouter';
import { findArticleBySlug, findStudyBySlug } from '../content/collections';
import {
  CONTACT_LIMITS,
  DEFAULT_PORTFOLIO_DATA,
  experienceSpan,
  formatDuration,
  formatMonth,
  plainText
} from '../data/portfolioData';
import { t } from '../i18n/pt-BR';
import type { ChatCardRef } from '../utils/chat';

interface ChatContentCardsProps {
  cards?: ChatCardRef[];
}

function InlineContactCard({ prefill }: { prefill?: string }) {
  const idPrefix = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(prefill ?? '');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending' || status === 'sent') return;

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (cleanName.length < CONTACT_LIMITS.name.min) {
      setStatus('error');
      setFeedback('Informe seu nome para enviar o recado.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setStatus('error');
      setFeedback('Informe um e-mail válido.');
      return;
    }
    if (cleanMessage.length < CONTACT_LIMITS.message.min) {
      setStatus('error');
      setFeedback(`Escreva pelo menos ${CONTACT_LIMITS.message.min} caracteres na mensagem.`);
      return;
    }

    setStatus('sending');
    setFeedback('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          message: cleanMessage,
          source: 'form',
          website: website || undefined
        })
      });

      if (!response.ok) {
        let errorMsg = t('contact.error');
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) errorMsg = data.error;
        } catch {
          // Keep default error message.
        }
        setStatus('error');
        setFeedback(errorMsg);
        return;
      }

      setStatus('sent');
      setFeedback(t('contact.sent'));
    } catch {
      setStatus('error');
      setFeedback(t('contact.error'));
    }
  };

  if (status === 'sent') {
    return (
      <div className="surface-card rounded-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-ok">
            <Check className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-body font-semibold text-ink">{t('contact.sent')}</p>
            <p className="mt-1 text-ui text-ink-soft">
              O Pedro responde no e-mail informado assim que possível.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card rounded-card p-5" noValidate>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-pill bg-accent-soft text-ink">
            <Send className="size-3.5" aria-hidden="true" />
          </span>
          <p className="font-display text-lead font-bold tracking-tight text-ink">
            {t('contact.title')}
          </p>
        </div>
        <a
          href={`mailto:${DEFAULT_PORTFOLIO_DATA.profile.email}`}
          className="focus-ring rounded-control font-mono text-micro text-muted transition-colors duration-150 hover:text-ink"
        >
          {DEFAULT_PORTFOLIO_DATA.profile.email}
        </a>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-name`} className="block text-ui font-medium text-ink-soft">
            {t('contact.name')}
          </label>
          <input
            id={`${idPrefix}-name`}
            type="text"
            required
            maxLength={CONTACT_LIMITS.name.max}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Seu nome"
            className="focus-ring mt-1.5 w-full rounded-control border border-border bg-canvas px-3 py-2 text-ui text-ink placeholder:text-muted transition-colors duration-150 focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-email`} className="block text-ui font-medium text-ink-soft">
            {t('contact.email')}
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            required
            maxLength={CONTACT_LIMITS.email.max}
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            placeholder="voce@empresa.com"
            className="focus-ring mt-1.5 w-full rounded-control border border-border bg-canvas px-3 py-2 text-ui text-ink placeholder:text-muted transition-colors duration-150 focus:border-accent"
          />
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor={`${idPrefix}-message`} className="block text-ui font-medium text-ink-soft">
          {t('contact.message')}
        </label>
        <textarea
          id={`${idPrefix}-message`}
          required
          rows={3}
          maxLength={CONTACT_LIMITS.message.max}
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          placeholder="Escreva sua mensagem ou detalhes da oportunidade..."
          className="focus-ring mt-1.5 w-full resize-y rounded-control border border-border bg-canvas px-3 py-2 text-ui text-ink placeholder:text-muted transition-colors duration-150 focus:border-accent"
        />
      </div>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${idPrefix}-website`}>Site</label>
        <input
          id={`${idPrefix}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.currentTarget.value)}
        />
      </div>

      {status === 'error' && feedback && (
        <p role="alert" className="mt-3 text-ui text-danger">
          {feedback}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="focus-ring inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-pill bg-accent px-4 py-2 text-ui font-semibold text-on-accent transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-3.5" aria-hidden="true" />
          <span>{status === 'sending' ? t('contact.sending') : t('contact.submit')}</span>
        </button>
      </div>
    </form>
  );
}

export default function ChatContentCards({ cards }: ChatContentCardsProps) {
  const [, setLocation] = useLocation();

  if (!cards || cards.length === 0) return null;

  const rendered = cards
    .map((ref, idx) => {
      const key = `${ref.kind}-${ref.id ?? idx}`;

      if (ref.kind === 'contact') {
        return <InlineContactCard key={key} prefill={ref.prefill} />;
      }

      if (ref.kind === 'v1') {
        const v1 = DEFAULT_PORTFOLIO_DATA.projects.find((item) => item.id === 'portfolio-v1');
        return (
          <button
            key={key}
            type="button"
            onClick={() => setLocation('/v1')}
            className="group surface-card surface-card-interactive focus-ring w-full overflow-hidden rounded-card text-left"
          >
            <div className="dot-canvas flex items-center justify-between gap-3 border-b border-border bg-surface-soft px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="-rotate-2 inline-flex items-center gap-1.5 rounded-pill bg-lime px-2.5 py-0.5 font-mono text-micro font-semibold text-on-lime">
                  <History className="size-3" aria-hidden="true" />
                  <span>v1 · 2025</span>
                </span>
                <span className="rotate-1 rounded-pill border border-border bg-surface px-2.5 py-0.5 font-mono text-micro text-ink-soft">
                  /v1
                </span>
              </div>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink motion-reduce:transition-none motion-reduce:transform-none"
                aria-hidden="true"
              />
            </div>
            <div className="p-4">
              <p className="font-display text-lead font-bold tracking-tight text-ink">
                {v1?.name ?? 'pherls.dev v1 (2025)'}
              </p>
              <p className="mt-1.5 text-ui leading-relaxed text-ink-soft">
                {v1?.tagline ??
                  'Primeira versão do portfólio em formato editorial de página única, preservada com a tampa interativa de adesivos.'}
              </p>
            </div>
          </button>
        );
      }

      if (ref.kind === 'project' && ref.id) {
        const project = DEFAULT_PORTFOLIO_DATA.projects.find((item) => item.id === ref.id);
        if (!project) return null;
        const targetRoute = project.href?.startsWith('/') ? project.href : `/projetos/${project.id}`;
        return (
          <div key={key} className="surface-card overflow-hidden rounded-card">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-soft px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <FolderGit2 className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                <p className="truncate font-mono text-micro text-muted">{project.kicker}</p>
              </div>
              <button
                type="button"
                onClick={() => setLocation(targetRoute)}
                className="pill-button focus-ring shrink-0 bg-surface"
              >
                <span>Ver projeto</span>
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4">
              <p className="font-display text-lead font-bold tracking-tight text-ink">
                {project.name}
              </p>
              <p className="mt-1.5 text-ui leading-relaxed text-ink-soft">{project.tagline}</p>
              {project.stack.length > 0 && (
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {project.stack.slice(0, 5).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-pill border border-border bg-canvas px-2.5 py-0.5 font-mono text-micro text-ink-soft"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      if (ref.kind === 'experience' && ref.id) {
        const exp = DEFAULT_PORTFOLIO_DATA.experiences.find((item) => item.id === ref.id);
        if (!exp) return null;
        const span = experienceSpan(exp);
        const periodLabel = `${formatMonth(span.start)} a ${formatMonth(span.end)} · ${formatDuration(span.start, span.end)}`;
        return (
          <div
            key={key}
            className="surface-card overflow-hidden rounded-card border-l-[3px] border-l-lime p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-mono text-micro tabular-nums text-muted">
                  <Briefcase className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{periodLabel}</span>
                </div>
                <p className="mt-1 font-display text-lead font-bold tracking-tight text-ink">
                  {exp.company}
                </p>
                {exp.roles[0]?.title && (
                  <p className="text-ui font-medium text-ink-soft">{exp.roles[0].title}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLocation('/experiencia')}
                className="pill-button focus-ring shrink-0"
              >
                <span>Currículo</span>
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-ui leading-relaxed text-ink-soft">{plainText(exp.summary)}</p>
            {exp.highlights.length > 0 && (
              <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
                {exp.highlights.slice(0, 2).map((item) => (
                  <div
                    key={item.text}
                    className="rounded-control border border-border bg-surface-soft px-3 py-2.5"
                  >
                    {item.metric ? (
                      <p className="font-mono text-body font-bold tabular-nums text-ink">
                        {item.metric}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-micro leading-snug text-ink-soft">
                      {plainText(item.text)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      if (ref.kind === 'certificate' && ref.id) {
        const needle = ref.id.toLowerCase();
        const cert = DEFAULT_PORTFOLIO_DATA.certificates.find(
          (item) => item.slug.toLowerCase() === needle || item.code.toLowerCase() === needle
        );
        if (!cert) return null;
        return (
          <div key={key} className="surface-card overflow-hidden rounded-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-border-strong bg-surface-soft px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface px-2.5 py-1 font-mono text-micro font-bold text-ink">
                  <Award className="size-3.5 text-ink-soft" aria-hidden="true" />
                  <span>{cert.code}</span>
                </span>
                <span className="font-mono text-micro tabular-nums text-muted">
                  {cert.issuer} · {cert.issuedAt}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLocation('/estudos/certificados')}
                className="pill-button focus-ring shrink-0 bg-surface"
              >
                <span>Certificados</span>
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4">
              <p className="font-display text-lead font-bold tracking-tight text-ink">
                {cert.title}
              </p>
              <p className="mt-1.5 text-ui leading-relaxed text-ink-soft">{cert.description}</p>
              {cert.verifyUrl && (
                <div className="mt-3">
                  <a
                    href={cert.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring inline-flex items-center gap-1.5 rounded-control text-ui font-medium text-ink underline decoration-border-strong underline-offset-4 transition-colors duration-150 hover:decoration-ink"
                  >
                    <span>{t('studies.verifyCredential')}</span>
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (ref.kind === 'study' && ref.id) {
        const study = findStudyBySlug(ref.id);
        if (!study) return null;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setLocation(`/estudos/${study.slug}`)}
            className="group surface-card surface-card-interactive focus-ring w-full rounded-card p-4 text-left"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-soft px-2.5 py-0.5 font-mono text-micro text-ink-soft">
                <BookOpen className="size-3 text-muted" aria-hidden="true" />
                <span>
                  {study.category} · {study.readingTime}
                </span>
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink motion-reduce:transition-none motion-reduce:transform-none"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2.5 font-display text-lead font-bold tracking-tight text-ink">
              {study.title}
            </p>
            <p className="mt-1 text-ui leading-relaxed text-ink-soft">{study.summary}</p>
          </button>
        );
      }

      if (ref.kind === 'article' && ref.id) {
        const article = findArticleBySlug(ref.id);
        if (!article) return null;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setLocation(`/artigos/${article.slug}`)}
            className="group surface-card surface-card-interactive focus-ring w-full rounded-card p-4 text-left"
          >
            <div className="flex items-center justify-between gap-3 font-mono text-micro text-muted">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="size-3.5" aria-hidden="true" />
                <span>
                  {article.category} · {article.readingTime}
                </span>
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink motion-reduce:transition-none motion-reduce:transform-none"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 font-display text-lead font-bold tracking-tight text-ink">
              {article.title}
            </p>
            <p className="mt-1 text-ui leading-relaxed text-ink-soft">{article.summary}</p>
          </button>
        );
      }

      return null;
    })
    .filter(Boolean);

  if (rendered.length === 0) return null;

  return <div className="mt-3 grid gap-2.5">{rendered}</div>;
}
