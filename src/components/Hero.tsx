import { FileText, ArrowDownRight } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CTA } from './CTA';
import { JobFitCta } from './JobFitCta';
import { StickerLid } from './stickers';
import { handleSmoothScrollClick, Marked, Reveal } from './ui';

export function Hero({ onOpenJobFit, onOpenCv }: { onOpenJobFit: () => void; onOpenCv: () => void }) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;
  const titleParts = profile.jobTitle.split(' · ');
  const role = titleParts[0];
  const track = titleParts.length > 1 ? titleParts.slice(1).join(' · ') : undefined;

  return (
    <section id="inicio" tabIndex={-1} aria-labelledby="inicio-titulo">
      <div className="name-band relative">
        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8 lg:py-10">
          <div className="relative min-h-[19.5rem] sm:min-h-[24rem] lg:min-h-[26rem]">
            <div id="hero-identity" className="relative w-fit">
              <h1
                id="inicio-titulo"
                className="display-wide text-[clamp(2.15rem,9vw,4.4rem)] leading-[0.96] text-on-band"
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
          </div>
        </div>
        <StickerLid />
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-12">
        <Reveal y={18}>
          <p className="text-status font-medium">{profile.status}</p>
          <p className="mt-3 max-w-2xl text-[clamp(1.25rem,2.2vw,1.6rem)] font-semibold leading-snug text-pretty">
            {profile.headline}
          </p>
          <p className="mt-4 max-w-2xl text-pretty text-ink-soft">
            <Marked text={profile.summary} />
          </p>
        </Reveal>

        <Reveal
          delay={0.1}
          y={18}
          className="flex flex-col justify-between gap-5 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
        >
          <p className="text-[0.9375rem] text-pretty text-ink-soft">{profile.trustCopy}</p>

          <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
            <CTA
              variant="tertiary"
              href="#contato"
              onClick={(event) => handleSmoothScrollClick(event, 'contato')}
              icon={<ArrowDownRight className="size-4" aria-hidden="true" />}
            >
              Canais de contato
            </CTA>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
