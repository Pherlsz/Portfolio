import { FileText, Github, Linkedin } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CTA } from './CTA';
import { JobFitCta } from './JobFitCta';
import { StickerLid } from './stickers';
import { Marked } from './ui';

export function Hero({ onOpenJobFit, onOpenCv }: { onOpenJobFit: () => void; onOpenCv: () => void }) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;
  const titleParts = profile.jobTitle.split(' · ');
  const role = titleParts[0];
  const track = titleParts.length > 1 ? titleParts.slice(1).join(' · ') : undefined;

  return (
    <section id="inicio" aria-labelledby="inicio-titulo">
      <div className="name-band">
        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8 lg:py-10">
          <div className="relative min-h-[22rem] sm:min-h-[24rem] lg:min-h-[26rem]">
            <div id="hero-identity" className="relative z-[2] w-fit max-w-[10.75rem] sm:max-w-none">
              <h1
                id="inicio-titulo"
                className="display-wide text-[clamp(2.15rem,9vw,4.4rem)] leading-[0.9] text-on-band"
              >
                {profile.name.split(' ').map((word) => (
                  <span key={word} className="block">
                    {word}{' '}
                  </span>
                ))}
              </h1>
              <p className="mt-4 text-[0.9375rem] font-semibold text-on-band">
                {track ? (
                  <>
                    {role}
                    <span className="hidden sm:inline"> · {track}</span>
                    <span className="block sm:hidden">{track}</span>
                  </>
                ) : (
                  profile.jobTitle
                )}
              </p>
              <p className="mt-1 text-[0.9375rem] text-on-band">{profile.location}</p>
            </div>
            <StickerLid />
          </div>
          <p id="tampa-ajuda" className="relative z-[2] mt-5 max-w-xl text-sm text-on-band">
            Arraste os stickers ou use as setas. Clique no D20 para rolar.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <p className="text-status">{profile.status}</p>
        <p className="mt-4 max-w-xl text-[clamp(1.2rem,2.1vw,1.5rem)] font-semibold leading-snug text-pretty">
          {profile.headline}
        </p>
        <p className="mt-4 max-w-xl text-pretty text-ink-soft">
          <Marked text={profile.summary} />
        </p>
        <p className="mt-4 max-w-xl text-pretty text-ink-soft">{profile.trustCopy}</p>

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
    </section>
  );
}
