import { lazy, Suspense } from 'react';
import { FileText, Github, Linkedin } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CTA } from './CTA';
import { JobFitCta } from './JobFitCta';
import { Marked } from './ui';

const StickerLid = lazy(() => import('./stickers').then((module) => ({ default: module.StickerLid })));

export function Hero({ onOpenJobFit, onOpenCv }: { onOpenJobFit: () => void; onOpenCv: () => void }) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section id="inicio" aria-labelledby="inicio-titulo">
      <div className="name-band">
        <div className="grid gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-12 lg:items-end lg:gap-4 lg:py-10">
          <div className="lg:col-span-5">
            <h1 id="inicio-titulo" className="display-wide text-[clamp(2.1rem,8vw,4.2rem)] leading-[0.92] text-balance">
              {profile.name.split(' ').map((word) => (
                <span key={word} className="block">
                  {word}{' '}
                </span>
              ))}
            </h1>
          </div>
          <div className="lg:col-span-7">
            <Suspense fallback={<div className="sticker-field aspect-[16/10] w-full" />}>
              <StickerLid />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="px-5 py-8 sm:px-8 sm:py-12">
        <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-3">
          <div className="border-r border-line px-3 py-3 sm:px-4">
            <dt className="eyebrow">Cargo</dt>
            <dd className="mt-1 font-semibold leading-snug">{profile.jobTitle}</dd>
          </div>
          <div className="px-3 py-3 sm:border-r sm:border-line sm:px-4">
            <dt className="eyebrow">Lugar</dt>
            <dd className="mt-1 font-semibold leading-snug">{profile.location}</dd>
          </div>
          <div className="col-span-2 border-t border-line px-3 py-3 sm:col-span-1 sm:border-t-0 sm:px-4">
            <dt className="eyebrow">Estado</dt>
            <dd className="mt-1 font-semibold leading-snug">{profile.status}</dd>
          </div>
        </dl>

        <p className="mt-8 max-w-xl text-[clamp(1.2rem,2.1vw,1.5rem)] font-semibold leading-snug text-pretty">
          {profile.headline}
        </p>
        <p className="mt-4 max-w-xl text-ink-soft text-pretty">
          <Marked text={profile.summary} />
        </p>
        <p className="mt-4 max-w-xl text-ink-soft text-pretty">{profile.trustCopy}</p>

        <div className="mt-8 flex w-full max-w-xl flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center">
          <CTA
            variant="primary"
            onClick={onOpenCv}
            aria-haspopup="dialog"
            aria-controls="cv-preview"
            className="w-full sm:w-auto"
            icon={<FileText className="size-4" aria-hidden="true" />}
          >
            Ver CV
          </CTA>
          <JobFitCta onOpenJobFit={onOpenJobFit} className="w-full sm:w-auto" />
          <CTA variant="tertiary" href={`mailto:${profile.email}`} className="min-h-11 self-start sm:self-auto">
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
    </section>
  );
}
