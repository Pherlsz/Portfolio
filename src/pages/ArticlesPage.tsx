import { lazy, Suspense, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Clock, MessageSquare } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useRoute } from 'wouter';
import { PageHeader } from '../components/PageHeader';
import { proseTableComponents, safeMarkdownUrl } from '../components/proseMarkdown';
import { ARTICLES, findArticleBySlug, type ContentDocument } from '../content/collections';
import { t } from '../i18n/pt-BR';

const StudyRichSegment = lazy(() => import('./StudyModules'));

function ArticleDetail({
  article,
  onAskChat
}: {
  article: ContentDocument;
  onAskChat: (prompt: string) => void;
}) {
  useEffect(() => {
    document.title = `${article.title} · Artigos · Pedro Henrique Lopes`;
    document
      .querySelector('[data-scroll-container="main"]')
      ?.scrollTo({ top: 0, behavior: 'instant' });
    window.scrollTo(0, 0);
  }, [article.slug, article.title]);

  return (
    <article className="mx-auto max-w-5xl px-5 pt-16 pb-10 sm:px-8 lg:px-10 lg:py-10">
      <Link href="/artigos" className="focus-ring pill-button">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        <span>{t('articles.backToList')}</span>
      </Link>

      <header className="mt-7 max-w-[68ch] border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2 font-mono text-micro text-muted tabular-nums">
          <span className="rounded-pill bg-accent-soft px-2.5 py-0.5 font-sans text-micro font-medium text-ink">
            {article.category}
          </span>
          <span>{article.publishedAt}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {article.readingTime}
          </span>
        </div>
        <h1 className="mt-3 font-display text-title font-bold tracking-[-0.02em] text-ink">
          {article.title}
        </h1>
        <p className="mt-3 text-lead text-ink-soft">{article.summary}</p>
      </header>

      <div className="mt-8 space-y-6 text-body text-ink-soft">
        {article.segments.map((segment, index) => {
          if (segment.type === 'markdown') {
            return (
              <div
                key={index}
                className="max-w-[68ch] space-y-4 leading-[1.75] [&_a]:text-ink [&_a]:underline [&_a]:decoration-border-strong [&_a]:underline-offset-4 hover:[&_a]:decoration-ink [&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-4 [&_blockquote]:text-ink-soft [&_code]:rounded-md [&_code]:bg-surface-soft [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-micro [&_code]:text-ink [&_h2]:mt-9 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-lead [&_h2]:font-bold [&_h2]:tracking-[-0.015em] [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-body [&_h3]:font-semibold [&_h3]:text-ink [&_li::marker]:text-muted [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-inner [&_pre]:border [&_pre]:border-border-strong [&_pre]:bg-code-bg [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-micro [&_pre]:text-code-ink [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-code-ink [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
              >
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  skipHtml
                  urlTransform={safeMarkdownUrl}
                  components={proseTableComponents}
                >
                  {segment.content}
                </Markdown>
              </div>
            );
          }

          return (
            <Suspense
              key={index}
              fallback={
                <div className="surface-card p-6 font-mono text-micro text-muted">
                  Carregando bloco interativo...
                </div>
              }
            >
              <StudyRichSegment segment={segment} />
            </Suspense>
          );
        })}
      </div>

      <footer className="mt-12 flex max-w-[68ch] flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <div className="flex flex-wrap gap-1.5">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-pill bg-surface-soft px-2.5 py-0.5 font-mono text-micro text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onAskChat(`Quero discutir o artigo "${article.title}".`)}
          className="focus-ring inline-flex min-h-10 cursor-pointer appearance-none items-center gap-2 rounded-pill bg-accent px-4 py-2 text-ui font-semibold text-on-accent transition-opacity duration-150 hover:opacity-90"
        >
          <MessageSquare className="size-3.5" aria-hidden="true" />
          <span>{t('articles.askCta')}</span>
        </button>
      </footer>
    </article>
  );
}

export function ArticlesPage({ onAskChat }: { onAskChat: (prompt: string) => void }) {
  const [isDetail, params] = useRoute('/artigos/:slug');

  if (isDetail && params?.slug) {
    const article = findArticleBySlug(params.slug);
    if (!article) {
      return (
        <section className="mx-auto max-w-4xl px-5 pt-16 pb-12 sm:px-8 lg:py-12">
          <Link href="/artigos" className="focus-ring pill-button">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t('articles.backToList')}</span>
          </Link>
          <p className="mt-6 text-body text-ink-soft">Artigo não encontrado.</p>
        </section>
      );
    }
    return <ArticleDetail article={article} onAskChat={onAskChat} />;
  }

  return (
    <section className="mx-auto w-full max-w-[90rem] px-5 pt-16 pb-10 sm:px-8 lg:px-10 lg:py-10">
      <PageHeader title={t('articles.title')} />

      {ARTICLES.length === 0 ? (
        <div className="surface-card mt-8 max-w-xl rounded-card p-6 sm:p-7">
          <p className="font-display text-lead font-bold tracking-tight text-ink">
            Nenhum artigo publicado.
          </p>
          <p className="mt-2 text-ui leading-relaxed text-ink-soft">
            Explore os estudos técnicos ou converse pelo chat.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/estudos" className="focus-ring pill-button">
              <span>Ver estudos</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
            <Link href="/" className="focus-ring pill-button">
              <span>Ir para o chat</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {ARTICLES.map((article) => (
            <article key={article.slug}>
              <Link
                href={`/artigos/${article.slug}`}
                data-cursor="ler"
                className="focus-ring card-editorial group grid gap-5 p-6 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-baseline"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 font-mono text-micro text-muted tabular-nums">
                    <span className="rounded-pill bg-surface-soft px-2.5 py-0.5 font-sans text-micro font-medium text-ink-soft">
                      {article.category}
                    </span>
                    <span>{article.publishedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {article.readingTime}
                    </span>
                  </div>

                  <h2 className="mt-2.5 font-display text-title font-bold tracking-[-0.02em] text-ink group-hover:underline">
                    {article.title}
                  </h2>
                  <p className="mt-2 max-w-[65ch] text-body text-ink-soft">{article.summary}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {article.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-pill bg-surface-soft px-2.5 py-0.5 font-mono text-micro text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-ui font-semibold text-ink lg:self-center">
                  <span>Ler</span>
                  <ArrowRight
                    className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
