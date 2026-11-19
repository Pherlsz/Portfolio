import { lazy, Suspense, useEffect } from 'react';
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
import { PageHeader } from '../components/PageHeader';
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

const BLUEPRINT_TAGS: Record<RichBlockKind, string> = {
  canvas: '[CANVAS]',
  'code-preview': '[CÓDIGO]',
  'spec-tabs': '[SPEC]'
};

function primaryKindLabel(study: ContentDocument): string {
  const firstBlock = study.richBlocks[0];
  return firstBlock ? BLOCK_LABELS[firstBlock] : study.category;
}

function blueprintCornerTag(study: ContentDocument): string {
  const firstBlock = study.richBlocks[0];
  return firstBlock ? BLUEPRINT_TAGS[firstBlock] : '[NOTA]';
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
  useEffect(() => {
    document.title = `${study.title} · Estudos · Pedro Henrique Lopes`;
  }, [study.title]);

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
    if (!study) {
      return (
        <section className="mx-auto max-w-4xl px-5 pt-16 pb-12 sm:px-8 lg:py-12">
          <Link href="/estudos" className="focus-ring pill-button">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t('studies.backToList')}</span>
          </Link>
          <p className="mt-6 text-body text-ink-soft">Estudo não encontrado.</p>
        </section>
      );
    }
    return <StudyDetail study={study} onAskChat={onAskChat} />;
  }

  const certificates = DEFAULT_PORTFOLIO_DATA.certificates;

  return (
    <section className="mx-auto w-full max-w-[90rem] px-5 pt-16 pb-10 sm:px-8 lg:px-10 lg:py-10">
      <PageHeader
        title="Estudos e certificados"
        actions={
          <nav
            aria-label="Abas de estudos e certificados"
            className="inline-flex flex-wrap items-center gap-1 rounded-pill border border-border bg-surface p-1 shadow-card"
          >
            <Link
              href="/estudos"
              aria-current={!isCertTab ? 'page' : undefined}
              className={`focus-ring inline-flex min-h-9 items-center gap-2 rounded-pill px-3.5 py-1.5 text-ui font-medium transition-colors duration-150 ${
                !isCertTab
                  ? 'bg-accent text-on-accent'
                  : 'text-muted hover:bg-surface-soft hover:text-ink'
              }`}
            >
              <BookOpen className="size-3.5" aria-hidden="true" />
              <span>{t('studies.tabStudies')}</span>
              <span
                className={`font-mono text-micro tabular-nums ${
                  !isCertTab ? 'text-on-accent/80' : 'text-muted'
                }`}
              >
                {STUDIES.length}
              </span>
            </Link>
            <Link
              href="/estudos/certificados"
              aria-current={isCertTab ? 'page' : undefined}
              className={`focus-ring inline-flex min-h-9 items-center gap-2 rounded-pill px-3.5 py-1.5 text-ui font-medium transition-colors duration-150 ${
                isCertTab
                  ? 'bg-accent text-on-accent'
                  : 'text-muted hover:bg-surface-soft hover:text-ink'
              }`}
            >
              <Award className="size-3.5" aria-hidden="true" />
              <span>{t('studies.tabCertificates')}</span>
              <span
                className={`font-mono text-micro tabular-nums ${
                  isCertTab ? 'text-on-accent/80' : 'text-muted'
                }`}
              >
                {certificates.length}
              </span>
            </Link>
          </nav>
        }
      />

      {!isCertTab ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {STUDIES.map((study) => (
            <article
              key={study.slug}
              className="card-editorial flex flex-col justify-between p-5 sm:p-6"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
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

                <p className="mt-2.5 font-mono text-micro text-muted tabular-nums">
                  {study.publishedAt} · {study.readingTime}
                </p>

                <Link
                  href={`/estudos/${study.slug}`}
                  data-cursor="ler"
                  className="focus-ring mt-2.5 block rounded-control font-display text-lead font-bold leading-snug tracking-tight text-ink hover:underline"
                >
                  {study.title}
                </Link>
                <p className="mt-2 text-ui leading-relaxed text-ink-soft">{study.summary}</p>
              </div>

              <div className="mt-5">
                <div className="mb-4 flex flex-wrap items-center gap-1.5">
                  {study.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-pill border border-border bg-surface-soft px-2.5 py-0.5 font-mono text-micro text-muted"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    data-cursor="perguntar"
                    onClick={() => onAskChat(`Resuma o estudo "${study.title}".`)}
                    className="focus-ring inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-pill px-2.5 py-1 text-micro font-medium text-muted transition-colors duration-150 hover:bg-surface-soft hover:text-ink"
                  >
                    <MessageSquare className="size-3.5" aria-hidden="true" />
                    <span>Perguntar</span>
                  </button>
                  <Link
                    href={`/estudos/${study.slug}`}
                    data-cursor="ler"
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
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((cert) => {
            const issuerLine =
              cert.platform && cert.platform !== cert.issuer
                ? `${cert.issuer} · ${cert.platform}`
                : cert.issuer;
            const mediaKind =
              cert.mediaKind ?? (cert.image ? 'diploma' : cert.badge ? 'badge' : 'monogram');

            return (
              <article
                key={cert.slug}
                className="card-editorial flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {mediaKind === 'diploma' && cert.image ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border bg-surface-soft">
                      <img
                        src={cert.image}
                        alt={cert.title}
                        width={960}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover object-top"
                      />
                      <span className="absolute top-3.5 right-3.5 rounded-pill border border-border bg-surface/90 px-2.5 py-1 font-mono text-micro font-semibold text-ink tabular-nums backdrop-blur-xs">
                        {cert.code}
                      </span>
                    </div>
                  ) : (
                    <div className="dot-canvas relative flex h-40 w-full items-center justify-center border-b border-border bg-surface-soft px-5">
                      <span className="absolute top-3.5 right-3.5 rounded-pill border border-border bg-surface px-2.5 py-1 font-mono text-micro font-semibold text-ink tabular-nums">
                        {cert.code}
                      </span>

                      {mediaKind === 'badge' && cert.badge ? (
                        <img
                          src={cert.badge}
                          alt={cert.title}
                          width={96}
                          height={96}
                          loading="lazy"
                          decoding="async"
                          className="size-24 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.16)]"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="flex flex-col items-center justify-center rounded-inner border border-border-strong bg-surface px-5 py-3 shadow-card"
                        >
                          <span className="font-display text-title font-extrabold tracking-tight text-ink">
                            {cert.badgeMeta?.code ?? cert.code}
                          </span>
                          {cert.badgeMeta?.caption ? (
                            <span className="mt-0.5 font-mono text-micro text-muted">
                              {cert.badgeMeta.caption}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5 sm:p-6">
                    <p className="font-mono text-micro font-medium text-muted">{issuerLine}</p>
                    <h2 className="mt-2 font-display text-lead font-bold leading-snug tracking-tight text-ink">
                      {cert.title}
                    </h2>
                    <p className="mt-2 text-ui leading-relaxed text-ink-soft">{cert.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
                  <p className="font-mono text-micro text-muted tabular-nums">
                    {cert.issuedAt} · {cert.expiresAt ?? t('studies.noExpiry')}
                  </p>

                  {cert.verifyUrl ? (
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="abrir"
                      className="focus-ring pill-button"
                    >
                      <ShieldCheck className="size-3.5 text-ok" aria-hidden="true" />
                      <span>{t('studies.verifyCredential')}</span>
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  ) : cert.pdf ? (
                    <a
                      href={cert.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="abrir"
                      className="focus-ring pill-button"
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                      <span>Ver certificado</span>
                    </a>
                  ) : (
                    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-pill border border-border bg-surface-soft px-3 py-1 font-mono text-micro text-ink-soft">
                      <Award className="size-3.5 text-muted" aria-hidden="true" />
                      <span>Concluído</span>
                    </span>
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
