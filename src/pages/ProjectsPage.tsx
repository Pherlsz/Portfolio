import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Link, useRoute } from 'wouter';
import { PageHeader } from '../components/PageHeader';
import { DEFAULT_PORTFOLIO_DATA, type ProjectItem } from '../data/portfolioData';
import { t } from '../i18n/pt-BR';

type FilterKind = 'all' | ProjectItem['kind'];

const FILTERS: { id: FilterKind; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'app', label: 'Aplicações' },
  { id: 'library', label: 'Bibliotecas' },
  { id: 'portfolio', label: 'Portfólio' }
];

function ProjectPreview({
  project,
  variant = 'tile',
  priority = false
}: {
  project: ProjectItem;
  variant?: 'tile' | 'detail';
  priority?: boolean;
}) {
  const isDetail = variant === 'detail';

  if (project.image) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-inner border border-border bg-surface-soft">
        <img
          src={project.image}
          alt={project.name}
          width={1200}
          height={750}
          loading={isDetail || priority ? 'eager' : 'lazy'}
          fetchPriority={isDetail || priority ? 'high' : undefined}
          decoding="async"
          className="h-full w-full object-cover object-top"
        />
      </div>
    );
  }

  if (project.id === 'gymkhana-core') {
    const modules = project.modules ?? [];
    return (
      <div className="relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden rounded-inner border border-border bg-surface-soft p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 font-mono text-micro text-muted tabular-nums">
          <span className="truncate">go.mod · gymkhana-core</span>
          <span className="shrink-0">{modules.length} pacotes</span>
        </div>

        {isDetail ? (
          <div className="my-auto grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {modules.map((mod) => {
              const highlighted = mod.name === 'assistant';
              return (
                <div
                  key={mod.name}
                  className={`rounded-control border p-3 shadow-card ${
                    highlighted
                      ? 'border-transparent bg-accent text-on-accent'
                      : 'border-border bg-surface text-ink'
                  }`}
                >
                  <p className="font-mono text-micro font-semibold">{mod.name}</p>
                  <p
                    className={`mt-1 line-clamp-2 text-micro ${
                      highlighted ? 'text-on-accent/80' : 'text-ink-soft'
                    }`}
                  >
                    {mod.description}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="my-auto flex flex-wrap items-center justify-center gap-1.5 px-1">
            {modules.map((mod) => {
              const highlighted = mod.name === 'assistant';
              return (
                <span
                  key={mod.name}
                  className={`rounded-pill border px-2.5 py-1 font-mono text-micro font-medium ${
                    highlighted
                      ? 'border-transparent bg-accent text-on-accent'
                      : 'border-border bg-surface text-ink'
                  }`}
                >
                  {mod.name}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 font-mono text-micro text-muted">
          <span className="truncate">github.com/Pherlsz/Gymkhana-Core</span>
          <span className="shrink-0">{project.language ?? 'Go'}</span>
        </div>
      </div>
    );
  }

  if (project.id === 'portfolio-v1') {
    return (
      <div className="relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden rounded-inner border border-border bg-surface-soft p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 font-mono text-micro text-muted">
          <span>Arquivo · 2025</span>
          <span>/v1</span>
        </div>

        <div className="my-auto flex items-center justify-center gap-3 sm:gap-4">
          <div className="-rotate-6 rounded-inner border border-border bg-surface p-2.5 shadow-card">
            <img
              src="/stickers/tomada.webp"
              alt=""
              width={56}
              height={56}
              loading={isDetail ? 'eager' : 'lazy'}
              decoding="async"
              className="size-12 object-contain sm:size-14"
            />
          </div>
          <div className="rotate-3 rounded-inner border border-border bg-surface p-2.5 shadow-card">
            <img
              src="/stickers/morcega.webp"
              alt=""
              width={56}
              height={56}
              loading={isDetail ? 'eager' : 'lazy'}
              decoding="async"
              className="size-12 object-contain sm:size-14"
            />
          </div>
          <div className="-rotate-3 rounded-inner border border-border bg-surface p-2.5 shadow-card">
            <img
              src="/stickers/banguela.webp"
              alt=""
              width={56}
              height={56}
              loading={isDetail ? 'eager' : 'lazy'}
              decoding="async"
              className="size-12 object-contain sm:size-14"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="rounded-pill bg-accent px-3 py-0.5 font-mono text-micro font-semibold text-on-accent">
            Arquivo · 2025
          </span>
          <span className="font-mono text-micro text-muted">
            Tampa com adesivos holográficos
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden rounded-inner border border-border bg-surface-soft p-5 sm:p-6">
      <div className="font-mono text-micro text-muted">{project.kicker}</div>
      <div className="my-auto flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <span
            key={tech}
            className="rounded-pill border border-border bg-surface px-3 py-1 font-mono text-micro text-ink shadow-card"
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProjectsPage({ onAskChat }: { onAskChat: (prompt: string) => void }) {
  const [matchDetail, params] = useRoute('/projetos/:slug');
  const [filter, setFilter] = useState<FilterKind>('all');

  const projects = DEFAULT_PORTFOLIO_DATA.projects;

  if (matchDetail && params?.slug) {
    const project = projects.find((item) => item.id === params.slug);
    if (!project) {
      return (
        <section className="mx-auto max-w-4xl px-5 pt-16 pb-12 sm:px-8 lg:py-12">
          <Link href="/projetos" className="focus-ring pill-button">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Voltar para projetos</span>
          </Link>
          <p className="mt-6 text-body text-ink-soft">Projeto não encontrado.</p>
        </section>
      );
    }

    return (
      <section className="mx-auto w-full min-w-0 max-w-6xl px-5 pt-16 pb-10 sm:px-8 lg:px-10 lg:py-10">
        <Link href="/projetos" className="focus-ring pill-button">
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Todos os projetos</span>
        </Link>

        <header className="mt-6 max-w-2xl">
          <p className="font-mono text-micro text-muted">{project.kicker}</p>
          <h1 className="mt-1.5 font-display text-title font-bold tracking-tight text-ink sm:text-[28px]">
            {project.name}
          </h1>
          <p className="mt-3 text-body leading-relaxed text-ink-soft sm:text-lead">
            {project.tagline}
          </p>
        </header>

        <div className="surface-card mt-7 rounded-card p-3 sm:p-4">
          <ProjectPreview project={project} variant="detail" />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              onAskChat(
                project.chatPrompt ?? `Me conta mais detalhes sobre o projeto ${project.name}.`
              )
            }
            className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-pill bg-accent px-4 py-2 text-ui font-semibold text-on-accent transition-opacity duration-150 hover:opacity-90"
          >
            <MessageSquare className="size-4" aria-hidden="true" />
            <span>{t('projects.askCta')}</span>
          </button>

          {project.repoUrl ? (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring pill-button"
            >
              <span>{t('projects.openRepo')}</span>
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}

          {project.href ? (
            <Link href={project.href} className="focus-ring pill-button">
              <span>
                {project.href === '/v1'
                  ? t('projects.archivedVersion')
                  : t('projects.openLive')}
              </span>
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-pill border border-border bg-surface px-3 py-1 font-mono text-micro text-ink-soft"
            >
              {tech}
            </span>
          ))}
        </div>

        {project.modules && project.modules.length > 0 ? (
          <div className="mt-9">
            <h2 className="font-display text-lead font-bold tracking-tight text-ink">Módulos</h2>
            <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
              {project.modules.map((mod) => (
                <div key={mod.name} className="surface-card rounded-card p-5">
                  <p className="font-mono text-ui font-semibold text-ink">{mod.name}</p>
                  <p className="mt-1.5 text-ui leading-relaxed text-ink-soft">{mod.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  const filtered = filter === 'all' ? projects : projects.filter((item) => item.kind === filter);
  const countByFilter = (kind: FilterKind) =>
    kind === 'all' ? projects.length : projects.filter((item) => item.kind === kind).length;

  return (
    <section className="mx-auto w-full max-w-[90rem] px-5 pt-16 pb-10 sm:px-8 lg:px-10 lg:py-10">
      <PageHeader
        title={t('projects.title')}
        actions={
          <div
            role="group"
            aria-label="Filtrar projetos"
            className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-card border border-border bg-surface p-1 shadow-card sm:rounded-pill"
          >
            {FILTERS.map((item) => {
              const active = filter === item.id;
              const count = countByFilter(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(item.id)}
                  className={`focus-ring inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-pill px-3.5 py-1.5 text-ui font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-accent text-on-accent'
                      : 'text-muted hover:bg-surface-soft hover:text-ink'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`font-mono text-micro tabular-nums ${
                      active ? 'text-on-accent/80' : 'text-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {filtered.map((project, index) => (
          <article
            key={project.id}
            className="card-editorial group flex min-w-0 flex-col justify-between gap-5 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4">
              <Link
                href={`/projetos/${project.id}`}
                aria-label={`Abrir detalhes de ${project.name}`}
                data-cursor="abrir"
                className="focus-ring relative block rounded-inner"
              >
                <ProjectPreview project={project} variant="tile" priority={index === 0} />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 bottom-3 z-10 inline-flex items-center gap-1 rounded-pill border border-border-strong bg-surface/95 px-2.5 py-1 font-mono text-micro font-medium text-ink opacity-0 shadow-card backdrop-blur-xs transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
                >
                  <span>Ver ficha</span>
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </span>
              </Link>

              <div className="px-1">
                <p className="font-mono text-micro uppercase tracking-[0.06em] text-muted">
                  {project.kicker}
                </p>

                <h2 className="mt-1.5 font-display text-lead font-bold tracking-[-0.02em] text-ink sm:text-title">
                  <Link
                    href={`/projetos/${project.id}`}
                    data-cursor="abrir"
                    className="focus-ring rounded-control hover:underline"
                  >
                    {project.name}
                  </Link>
                </h2>

                <p className="mt-2 line-clamp-3 text-ui leading-relaxed text-ink-soft sm:text-body">
                  {project.tagline}
                </p>

                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {project.stack.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-pill border border-border bg-surface-soft px-2.5 py-0.5 font-mono text-micro text-ink-soft"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border px-1 pt-4">
              <Link
                href={`/projetos/${project.id}`}
                data-cursor="abrir"
                className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-pill bg-accent px-4 py-1.5 text-ui font-semibold text-on-accent transition-opacity duration-150 hover:opacity-90"
              >
                <span>Abrir detalhes</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>

              <button
                type="button"
                data-cursor="perguntar"
                onClick={() =>
                  onAskChat(
                    project.chatPrompt ?? `Me explica os detalhes técnicos de ${project.name}.`
                  )
                }
                className="focus-ring pill-button min-h-9 px-3.5"
              >
                <MessageSquare className="size-3.5 text-muted" aria-hidden="true" />
                <span>Perguntar</span>
              </button>

              {project.href === '/v1' ? (
                <Link
                  href={project.href}
                  aria-label="Abrir Portfólio Editorial"
                  data-cursor="abrir"
                  className="focus-ring pill-button min-h-9 px-3.5"
                >
                  <span>Visitar</span>
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
