import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Link, useRoute } from 'wouter';
import { DEFAULT_PORTFOLIO_DATA, type ProjectItem } from '../data/portfolioData';
import { t } from '../i18n/pt-BR';

type FilterKind = 'all' | ProjectItem['kind'];

const FILTERS: { id: FilterKind; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'app', label: 'Aplicações' },
  { id: 'library', label: 'Bibliotecas' },
  { id: 'case-study', label: 'Estudo de caso' },
  { id: 'portfolio-version', label: 'Versões' }
];

const PROJECT_MONOGRAMS: Record<string, string> = {
  'gymkhana-database': 'GD',
  'gymkhana-core': 'GC',
  'portfolio-v2': 'V2',
  'portfolio-v1': 'V1'
};

function getProjectMonogram(project: ProjectItem): string {
  if (PROJECT_MONOGRAMS[project.id]) {
    return PROJECT_MONOGRAMS[project.id];
  }
  return project.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

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
          className={`h-full w-full object-cover object-top ${
            isDetail
              ? ''
              : 'transition-transform duration-200 ease-out group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100'
          }`}
        />
      </div>
    );
  }

  if (project.id === 'gymkhana-core') {
    const modules = project.modules ?? [];
    return (
      <div className="dot-canvas relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden rounded-inner border border-border bg-surface-soft p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 font-mono text-micro text-muted tabular-nums">
          <span>go.mod · gymkhana-core</span>
          <span>{modules.length} pacotes</span>
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
          <div className="my-auto flex flex-wrap items-center justify-center gap-2 px-2">
            {modules.map((mod) => {
              const highlighted = mod.name === 'assistant';
              return (
                <span
                  key={mod.name}
                  className={`rounded-pill border px-3.5 py-1.5 font-mono text-micro font-medium shadow-card ${
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

  if (project.id === 'portfolio-v2') {
    return (
      <div className="ambient-glow relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden rounded-inner border border-border bg-surface-soft p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 font-mono text-micro text-muted">
          <span>pherls.dev v2</span>
          <span>SSE · Cards tipados</span>
        </div>

        <div className="my-auto space-y-2.5">
          <div className="ml-auto max-w-[78%] rounded-inner rounded-br-control border border-border bg-surface px-3.5 py-2 text-micro font-medium text-ink shadow-card">
            O que ele fez na Atlas?
          </div>

          <div className="max-w-[88%] space-y-2">
            <div className="rounded-inner border border-border bg-surface px-3.5 py-2.5 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-micro font-semibold text-ink">
                  Atlas Governance · 30+ componentes
                </span>
                <span className="shrink-0 rounded-pill bg-accent-soft px-2 py-0.5 font-mono text-micro text-ink">
                  card
                </span>
              </div>
              {isDetail ? (
                <p className="mt-1 text-micro text-ink-soft">
                  Cards resolvidos no servidor contra content/ sem tokens extras.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-pill border border-border-strong bg-surface px-3.5 py-1.5 shadow-card">
          <span className="font-mono text-micro text-muted">/vaga Frontend Pleno</span>
          <span className="rounded-pill bg-accent px-2.5 py-0.5 font-mono text-micro font-semibold text-on-accent">
            Enviar
          </span>
        </div>
      </div>
    );
  }

  if (project.id === 'portfolio-v1') {
    return (
      <div className="dot-canvas relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden rounded-inner border border-border bg-surface-soft p-5 sm:p-6">
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
            v1 · 2025
          </span>
          <span className="font-mono text-micro text-muted">
            Tampa com adesivos holográficos
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="dot-canvas relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden rounded-inner border border-border bg-surface-soft p-5 sm:p-6">
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
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-10 sm:px-8 lg:px-10 lg:py-10">
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
                {project.kind === 'portfolio-version'
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

  return (
    <section className="mx-auto max-w-[90rem] px-5 pt-16 pb-10 sm:px-8 lg:px-10 lg:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-title font-bold tracking-tight text-ink sm:text-[28px]">
          {t('projects.title')}
        </h1>

        <div role="group" aria-label="Filtrar projetos" className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item.id)}
                className={`focus-ring min-h-9 rounded-pill border px-3.5 py-1.5 text-ui font-medium transition-colors duration-150 ${
                  active
                    ? 'border-transparent bg-accent text-on-accent'
                    : 'border-border bg-surface text-muted hover:border-border-strong hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project, index) => (
          <article key={project.id} className="group space-y-3">
            <Link
              href={`/projetos/${project.id}`}
              aria-label={`Abrir detalhes de ${project.name}`}
              className="focus-ring surface-card surface-card-interactive block rounded-card p-3"
            >
              <ProjectPreview project={project} variant="tile" priority={index === 0} />
            </Link>

            <div className="flex items-center justify-between gap-3 px-1">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-control border border-border bg-surface font-mono text-micro font-bold text-ink shadow-card"
                >
                  {getProjectMonogram(project)}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/projetos/${project.id}`}
                    className="focus-ring block truncate rounded-control font-display text-body font-bold tracking-tight text-ink hover:underline"
                  >
                    {project.name}
                  </Link>
                  <p className="truncate text-ui text-muted">{project.tagline}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {project.kind === 'portfolio-version' && project.href ? (
                  <Link
                    href={project.href}
                    className="focus-ring inline-flex min-h-8 items-center gap-1 rounded-pill border border-border bg-surface px-3 py-1 text-micro font-medium text-ink-soft transition-colors duration-150 hover:border-border-strong hover:text-ink"
                  >
                    <span>/v1</span>
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    onAskChat(
                      project.chatPrompt ?? `Me explica os detalhes técnicos de ${project.name}.`
                    )
                  }
                  className="focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1 text-micro font-medium text-ink transition-colors duration-150 hover:border-border-strong hover:bg-surface-hover"
                >
                  <MessageSquare className="size-3.5 text-muted" aria-hidden="true" />
                  <span>Perguntar</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
