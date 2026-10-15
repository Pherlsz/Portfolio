import { lazy, Suspense } from 'react';
import { Download, Github, Linkedin } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CTA } from './CTA';
import { JobFitCta } from './JobFitCta';
import { Marked } from './ui';

const StickerLid = lazy(() => import('./stickers').then((module) => ({ default: module.StickerLid })));

export function Hero({ onOpenJobFit }: { onOpenJobFit: () => void }) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section
      id="inicio"
      aria-labelledby="inicio-titulo"
      className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 sm:gap-12 sm:px-8 sm:pb-20 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-28"
    >
      <div className="notebook-margin">
        <p className="eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1">
          <span className="size-2 rounded-full bg-status" aria-hidden="true" />
          {profile.status} · {profile.location}
        </p>

        <h1
          id="inicio-titulo"
          className="display-wide mt-6 text-[clamp(2.6rem,7.4vw,4.6rem)] uppercase leading-[0.9]"
        >
          {profile.name.split(' ').map((word) => (
            <span key={word} className="block">
              {word}{' '}
            </span>
          ))}
        </h1>

        <p className="mt-5 font-mono text-[0.9375rem] text-ink-soft">
          {profile.role} · React · Next.js · TypeScript
        </p>

        <p className="mt-7 max-w-xl text-[clamp(1.25rem,2.1vw,1.55rem)] font-semibold leading-snug">
          {profile.headline}
        </p>
        <p className="mt-4 max-w-xl text-ink-soft">
          <Marked text={profile.summary} />
        </p>
        <p className="mt-4 max-w-xl text-ink-soft">{profile.trustCopy}</p>

        <div className="mt-8 flex w-full max-w-xl flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center">
          <CTA
            variant="primary"
            href={profile.cvUrl}
            download
            className="w-full sm:w-auto"
            icon={<Download className="size-4" aria-hidden="true" />}
          >
            Baixar CV (PDF)
          </CTA>
          <JobFitCta onOpenJobFit={onOpenJobFit} className="w-full sm:w-auto" />
          <CTA variant="tertiary" href={`mailto:${profile.email}`} className="self-start sm:self-auto">
            Falar por e-mail
          </CTA>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="Perfil no LinkedIn de Pedro Henrique Lopes"
            className="icon-btn"
          >
            <Linkedin className="size-4" aria-hidden="true" />
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            aria-label="Perfil no GitHub de Pedro Henrique Lopes"
            className="icon-btn"
          >
            <Github className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="no-print">
            <div className="notebook relative z-10 aspect-[16/10] w-full" />
          </div>
        }
      >
        <StickerLid />
      </Suspense>
    </section>
  );
}
