import { lazy, Suspense } from 'react';
import { DEFAULT_PORTFOLIO_DATA, plainText } from '../data/portfolioData';

const StickerLid = lazy(() => import('./stickers').then((module) => ({ default: module.StickerLid })));

export function Hero({ onOpenCv }: { onOpenCv: () => void }) {
  const { profile, featuredProjects, experiences, education } = DEFAULT_PORTFOLIO_DATA;
  const featured = featuredProjects[0];
  const firstJob = experiences[0];
  const degree = education[0];

  return (
    <div id="inicio" tabIndex={-1} className="flex min-h-0 flex-1 flex-col outline-none">
      <h1 id="inicio-titulo" className="display mt-5 text-[1.75rem] leading-tight text-balance lg:text-[2rem]">
        {profile.name}
      </h1>
      <p className="mt-3 max-w-prose text-pretty text-[0.9375rem] leading-snug">{profile.headline}</p>
      {/* shortcut: clamp summary so 01–05 stay on the first 360 screen, drop the clamp if the rail grows */}
      <p className="mt-2 line-clamp-2 max-w-prose text-pretty text-[0.9375rem] leading-snug text-ink-soft">
        {plainText(profile.summary)}
      </p>

      {/* shortcut: native hash links with no scroll spy, restore a spy if a covering sticky bar returns */}
      <nav aria-label="Índice" className="mt-6">
        <ol>
          <li className="border-t border-line">
            <a href="#projeto" className="grid min-h-11 grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-2 py-2">
              <span className="font-mono text-sm tabular-nums text-stamp">01</span>
              <span className="min-w-0">
                <span className="link font-medium">Projetos</span>
                <span className="mt-0.5 block truncate text-sm text-ink-soft">{featured ? featured.tagline : ''}</span>
              </span>
            </a>
          </li>
          <li className="border-t border-line">
            <a href="#experiencia" className="grid min-h-11 grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-2 py-2">
              <span className="font-mono text-sm tabular-nums text-ink-soft">02</span>
              <span className="min-w-0">
                <span className="link font-medium">Experiência</span>
                <span className="mt-0.5 block truncate text-sm text-ink-soft">{firstJob ? firstJob.summary : ''}</span>
              </span>
            </a>
          </li>
          <li className="border-t border-line">
            <a href="#formacao" className="grid min-h-11 grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-2 py-2">
              <span className="font-mono text-sm tabular-nums text-ink-soft">03</span>
              <span className="min-w-0">
                <span className="link font-medium">Formação</span>
                <span className="mt-0.5 block truncate text-sm text-ink-soft">
                  {degree ? `${degree.course}, ${degree.school}` : ''}
                </span>
              </span>
            </a>
          </li>
          <li className="border-t border-line">
            <button
              type="button"
              onClick={onOpenCv}
              aria-haspopup="dialog"
              aria-controls="cv-preview"
              className="grid min-h-11 w-full grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-2 py-2 text-left"
            >
              <span className="font-mono text-sm tabular-nums text-ink-soft">04</span>
              <span className="min-w-0">
                <span className="link font-medium">CV</span>
                <span className="mt-0.5 block truncate text-sm text-ink-soft">{profile.trustCopy}</span>
              </span>
            </button>
          </li>
          <li className="border-t border-line border-b">
            <a href="#contato" className="grid min-h-11 grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-2 py-2">
              <span className="font-mono text-sm tabular-nums text-ink-soft">05</span>
              <span className="min-w-0">
                <span className="link font-medium">Contato</span>
                <span className="mt-0.5 block truncate text-sm text-ink-soft">
                  {profile.email}. {profile.status}.
                </span>
              </span>
            </a>
          </li>
        </ol>
      </nav>

      <div className="mt-6 min-w-0">
        <Suspense fallback={<div className="sticker-row aspect-[5.2/1] w-full max-w-[22rem]" />}>
          <StickerLid />
        </Suspense>
      </div>
    </div>
  );
}
