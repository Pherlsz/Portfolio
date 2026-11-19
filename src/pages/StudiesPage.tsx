import { lazy, Suspense } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Clock,
  ExternalLink,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useRoute } from 'wouter';
import {
  STUDIES,
  findStudyBySlug,
  type ContentDocument,
  type RichBlockKind
} from '../content/collections';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { t } from '../i18n/pt-BR';

const StudyRichSegment = lazy(() => import('./StudyModules'));

const BLOCK_LABELS: Record<RichBlockKind, string> = {
  canvas: 'Canvas',
  'code-preview': 'Código + Preview',
  'spec-tabs': 'Spec'
};

function primaryKindLabel(study: ContentDocument): string {
  const firstBlock = study.richBlocks[0];
  return firstBlock ? BLOCK_LABELS[firstBlock] : study.category;
}

function safeUrl(url: string): string {
  try {
    const parsed = new URL(url, 'https://pherls.dev');
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'mailto:') {
      return url;
    }
  } catch {
    // Reject invalid URLs
  }
  return '';
}

function StudyDetail({
  study,
  onAskChat
}: {
  study: ContentDocument;
  onAskChat: (prompt: string) => void;
}) {
  return (
    <article className="mx-auto max-w-6xl px-5 pt-16 pb-10 sm:px-8 lg:px-10 lg:py-10">
      <Link href="/estudos" className="focus-ring pill-button">
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>{t('studies.backToList')}</span>
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2 font-mono text-micro text-muted tabular-nums">
          <span className="rounded-pill bg-accent-soft px-2.5 py-0.5 font-medium text-ink">
            {primaryKindLabel(study)}
          </span>
          <span>{study.category}</span>
          <span aria-hidden="true">·</span>
          <span>{study.publishedAt}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            <span>{study.readingTime}</span>
          </span>
        </div>

        <h1 className="mt-3 max-w-3xl font-display text-title font-bold tracking-tight text-ink sm:text-[28px]">
          {study.title}
        </h1>
        <p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-soft sm:text-lead">
          {study.summary}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-6">
          <div className="flex flex-wrap gap-1.5">
            {study.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-pill border border-border bg-surface px-2.5 py-0.5 font-mono text-micro text-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onAskChat(`Me explica os pontos principais do estudo "${study.title}".`)}
            className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-pill bg-accent px-4 py-1.5 text-ui font-semibold text-on-accent transition-opacity duration-150 hover:opacity-90"
          >
            <MessageSquare className="size-3.5" aria-hidden="true" />
            <span>{t('studies.askCta')}</span>
          </button>
        </div>
      </header>

      <div className="mt-8 space-y-6 text-body text-ink-soft">
        {study.segments.map((segment, index) => {
          if (segment.type === 'markdown') {
            return (
              <div
                key={index}
                className="max-w-[68ch] space-y-4 leading-relaxed [&_code]:rounded [&_code]:bg-surface-soft [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-micro [&_code]:text-ink [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lead [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-ink [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
              >
                <Markdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={safeUrl}>
                  {segment.content}
                </Markdown>
              </div>
            );
          }

          return (
            <Suspense
              key={index}
              fallback={
                <div className="surface-card rounded-card p-6 font-mono text-micro text-muted">
                  Carregando módulo interativo...
                </div>
              }
            >
              <StudyRichSegment segment={segment} />
            </Suspense>
          );
        })}
      </div>
    </article>
  );
}

export function StudiesPage({ onAskChat }: { onAskChat: (prompt: string) => void }) {
  const [isCertTab] = useRoute('/estudos/certificados');
  const [isDetail, detailParams] = useRoute('/estudos/:slug');

  if (isDetail && detailParams?.slug && detailParams.slug !== 'certificados') {
    const study = findStudyBySlug(detailParams.slug);
    if (study) {
      return <StudyDetail study={study} onAskChat={onAskChat} />;
    }
  }

  const certificates = DEFAULT_PORTFOLIO_DATA.certificates;

  return (
    <section className="mx-auto max-w-[90rem] px-5 pt-16 pb-10 sm:px-8 lg:px-10 lg:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-title font-bold tracking-tight text-ink sm:text-[28px]">
          {t('studies.title')}
        </h1>

        <nav
          aria-label="Abas de estudos e certificados"
          className="inline-flex items-center rounded-pill border border-border bg-surface p-1 shadow-card"
        >
          <Link
            href="/estudos"
            aria-current={!isCertTab ? 'page' : undefined}
            className={`focus-ring inline-flex min-h-9 items-center gap-2 rounded-pill px-4 py-1.5 text-ui font-medium transition-colors duration-150 ${
              !isCertTab ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'
            }`}
          >
            <BookOpen className="size-3.5" aria-hidden="true" />
            <span>{t('studies.tabStudies')}</span>
            <span
              className={`font-mono text-micro tabular-nums ${
                !isCertTab ? 'text-on-accent/75' : 'text-muted'
              }`}
            >
              {STUDIES.length}
            </span>
          </Link>
          <Link
            href="/estudos/certificados"
            aria-current={isCertTab ? 'page' : undefined}
            className={`focus-ring inline-flex min-h-9 items-center gap-2 rounded-pill px-4 py-1.5 text-ui font-medium transition-colors duration-150 ${
              isCertTab ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'
            }`}
          >
            <Award className="size-3.5" aria-hidden="true" />
            <span>{t('studies.tabCertificates')}</span>
            <span
              className={`font-mono text-micro tabular-nums ${
                isCertTab ? 'text-on-accent/75' : 'text-muted'
              }`}
            >
              {certificates.length}
            </span>
          </Link>
        </nav>
      </header>

      {!isCertTab ? (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {STUDIES.map((study) => (
            <article
              key={study.slug}
              className="surface-card surface-card-interactive flex flex-col justify-between rounded-card p-5 sm:p-6"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {study.richBlocks.length > 0 ? (
                      study.richBlocks.map((block, index) => (
                        <span
                          key={block}
                          className={`rounded-pill px-2.5 py-0.5 font-mono text-micro font-medium ${
                            index === 0
                              ? 'bg-accent-soft text-ink'
                              : 'border border-border bg-surface-soft text-muted'
                          }`}
                        >
                          {BLOCK_LABELS[block]}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-pill bg-accent-soft px-2.5 py-0.5 font-mono text-micro font-medium text-ink">
                        {study.category}
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-micro text-muted tabular-nums">
                    {study.publishedAt} · {study.readingTime}
                  </span>
                </div>

                <Link
                  href={`/estudos/${study.slug}`}
                  className="focus-ring mt-3.5 block rounded-control font-display text-lead font-bold leading-snug tracking-tight text-ink hover:underline"
                >
                  {study.title}
                </Link>
                <p className="mt-2 text-ui leading-relaxed text-ink-soft">{study.summary}</p>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-micro text-muted">
                  {study.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAskChat(`Resuma o estudo "${study.title}".`)}
                    className="focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-pill px-2.5 py-1 text-micro font-medium text-muted transition-colors duration-150 hover:bg-surface-soft hover:text-ink"
                  >
                    <MessageSquare className="size-3.5" aria-hidden="true" />
                    <span>Perguntar</span>
                  </button>
                  <Link
                    href={`/estudos/${study.slug}`}
                    className="focus-ring inline-flex min-h-8 items-center gap-1 rounded-pill border border-border bg-surface px-3 py-1 text-micro font-semibold text-ink transition-colors duration-150 hover:border-border-strong hover:bg-surface-hover"
                  >
                    <span>Abrir</span>
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((cert) => {
            const issuerLine =
              cert.platform && cert.platform !== cert.issuer
                ? `${cert.issuer} · ${cert.platform}`
                : cert.issuer;

            return (
              <article
                key={cert.slug}
                className="surface-card flex flex-col justify-between overflow-hidden rounded-card"
              >
                <div>
                  <div
                    className={`dot-canvas flex items-center justify-between gap-3 border-b border-border px-5 py-4 ${
                      cert.verifyUrl ? 'bg-accent-soft' : 'bg-surface-soft'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {cert.badge ? (
                        <img
                          src={cert.badge}
                          alt={cert.title}
                          width={48}
                          height={48}
                          loading="lazy"
                          decoding="async"
                          className="size-12 shrink-0 rounded-control border border-border bg-surface object-contain p-1.5 shadow-card"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="flex size-12 shrink-0 items-center justify-center rounded-control border border-border-strong bg-surface font-mono text-ui font-bold text-ink shadow-card"
                        >
                          {cert.code}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-mono text-micro font-medium text-ink-soft">
                          {issuerLine}
                        </p>
                        <p className="mt-0.5 font-mono text-micro text-muted tabular-nums">
                          {t('studies.issuedAt')} {cert.issuedAt}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-pill border border-border-strong bg-surface px-3 py-1 font-mono text-micro font-bold tracking-wide text-ink tabular-nums shadow-card">
                      {cert.code}
                    </span>
                  </div>

                  <div className="p-5">
                    <h2 className="font-display text-lead font-bold leading-snug tracking-tight text-ink">
                      {cert.title}
                    </h2>
                    <p className="mt-2 text-ui leading-relaxed text-ink-soft">{cert.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border-strong bg-surface-soft px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-micro text-muted tabular-nums">
                    <span>
                      {t('studies.issuedAt')}: <strong className="font-semibold text-ink">{cert.issuedAt}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t('studies.expiresAt')}:{' '}
                      <strong className="font-semibold text-ink">
                        {cert.expiresAt ?? t('studies.noExpiry')}
                      </strong>
                    </span>
                  </div>

                  {cert.verifyUrl ? (
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring pill-button"
                    >
                      <ShieldCheck className="size-3.5 text-ok" aria-hidden="true" />
                      <span>{t('studies.verifyCredential')}</span>
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="font-mono text-micro text-muted">Credencial emitida</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
