import { lazy, Suspense } from 'react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { Marked } from './ui';

const StickerLid = lazy(() => import('./stickers').then((module) => ({ default: module.StickerLid })));

type IndiceEntry =
  | { num: string; label: string; summary: string; href: string }
  | { num: string; label: string; summary: string; action: 'cv' };

function buildIndiceEntries(): IndiceEntry[] {
  const { profile, featuredProjects, experiences, education } = DEFAULT_PORTFOLIO_DATA;
  const featured = featuredProjects[0];
  const primaryJob = experiences[0];
  const degree = education[0];

  return [
    {
      num: '01',
      label: 'Projetos',
      summary: featured?.tagline ?? DEFAULT_PORTFOLIO_DATA.project.tagline,
      href: '#projeto'
    },
    {
      num: '02',
      label: 'Experiência',
      summary: primaryJob?.summary ?? '',
      href: '#experiencia'
    },
    {
      num: '03',
      label: 'Formação',
      summary: degree ? `${degree.course} — ${degree.school}` : '',
      href: '#formacao'
    },
    {
      num: '04',
      label: 'CV',
      summary: profile.trustCopy,
      action: 'cv'
    },
    {
      num: '05',
      label: 'Contato',
      summary: `${profile.workMode}. Pretensão salarial ${profile.salary.toLowerCase()}.`,
      href: '#contato'
    }
  ];
}

const INDICE_ENTRIES = buildIndiceEntries();

function scrollToHash(href: string) {
  const id = href.replace(/^#/, '');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
      history.pushState(null, '', href);
    });
  });
}

export function Hero({
  onOpenCv,
  onOpenAssistant
}: {
  onOpenJobFit?: () => void;
  onOpenCv: () => void;
  onOpenAssistant?: () => void;
}) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section
      id="inicio"
      aria-labelledby="inicio-titulo"
      className="mx-auto max-w-6xl px-5 pb-12 pt-6 sm:px-8 sm:pb-16 sm:pt-10 lg:grid lg:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)] lg:items-start lg:gap-14 lg:pb-20"
    >
      <div className="lg:sticky lg:top-[4.5rem] lg:self-start">
        <h1 id="inicio-titulo" className="indice-serif text-[clamp(1.75rem,5vw,2.35rem)] leading-tight">
          {profile.name}
        </h1>
        <p className="mt-3 font-mono text-[0.9375rem] text-ink-soft">
          <span className="block">{profile.jobTitle}</span>
          <span className="mt-1 block text-muted">{profile.location}</span>
        </p>

        <p className="mt-6 max-w-prose text-ink-soft">
          <Marked text={profile.summary} />
        </p>

        <nav aria-label="Índice" className="mt-8">
          <ol className="space-y-0">
            {INDICE_ENTRIES.map((entry) => (
              <li key={entry.num} className="border-t border-line first:border-t-0">
                {'action' in entry && entry.action === 'cv' ? (
                  <button
                    type="button"
                    onClick={onOpenCv}
                    aria-haspopup="dialog"
                    aria-controls="cv-preview"
                    className="indice-entry group w-full text-left"
                  >
                    <IndiceEntryInner entry={entry} />
                  </button>
                ) : (
                  <a
                    href={'href' in entry ? entry.href : '#'}
                    onClick={(event) => {
                      event.preventDefault();
                      if ('href' in entry) scrollToHash(entry.href);
                    }}
                    className="indice-entry group block"
                  >
                    <IndiceEntryInner entry={entry} />
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {onOpenAssistant ? (
          <p className="mt-6">
            <button type="button" onClick={onOpenAssistant} className="text-link min-h-11 py-2">
              Perguntar
            </button>
          </p>
        ) : null}

        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 font-mono text-sm">
          <li>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-link min-h-11 inline-flex items-center py-2">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={profile.github} target="_blank" rel="noreferrer" className="text-link min-h-11 inline-flex items-center py-2">
              GitHub
            </a>
          </li>
          <li>
            <a href={`mailto:${profile.email}`} translate="no" className="text-link min-h-11 inline-flex items-center py-2">
              E-mail
            </a>
          </li>
        </ul>
      </div>

      <div className="mt-10 lg:mt-0">
        <Suspense fallback={<div className="no-print h-24" aria-hidden="true" />}>
          <StickerLid variant="row" />
        </Suspense>
      </div>
    </section>
  );
}

function IndiceEntryInner({ entry }: { entry: IndiceEntry }) {
  return (
    <span className="flex min-h-11 flex-col gap-1 py-3 sm:min-h-[2.75rem] sm:flex-row sm:items-baseline sm:gap-4 sm:py-4">
      <span className="flex shrink-0 items-baseline gap-3 sm:w-[7.5rem]">
        <span className="font-mono text-sm text-stamp tabular-nums">{entry.num}</span>
        <span className="indice-serif text-lg font-semibold text-ink group-hover:text-stamp group-focus-visible:text-stamp">
          {entry.label}
        </span>
      </span>
      <span className="text-[0.9375rem] leading-snug text-muted sm:flex-1">{entry.summary}</span>
    </span>
  );
}
