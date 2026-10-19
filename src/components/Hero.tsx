import { FileText, Github, Linkedin } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CTA } from './CTA';
import { JobFitCta } from './JobFitCta';
import { Marked } from './ui';

function goSection(id: string) {
  const node = document.getElementById(id);
  node?.scrollIntoView({ block: 'start', behavior: 'instant' });
  node?.focus();
  history.pushState(null, '', `#${id}`);
}

export function IdentityColumn({ onOpenCv }: { onOpenCv: () => void }) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section id="inicio" aria-labelledby="inicio-titulo" className="min-w-0">
      <h1 id="inicio-titulo" className="display-wide text-[1.75rem] uppercase leading-none">
        {profile.shortName}
      </h1>
      <p className="mt-3 text-[0.9375rem] text-ink-soft">
        Frontend Engineer
        <span className="hidden sm:inline"> · </span>
        <span className="block sm:inline">Porto Alegre</span>
      </p>
      <p className="mt-2 text-[0.9375rem] text-status">{profile.status}</p>
      <nav aria-label="Atalhos da ficha" className="mt-4">
        <ul className="flex flex-wrap gap-x-1">
          <li>
            <a
              href="#projeto"
              onClick={(event) => {
                event.preventDefault();
                goSection('projeto');
              }}
              className="inline-flex min-h-11 items-center px-2 underline underline-offset-4"
            >
              Projetos
            </a>
          </li>
          <li>
            <button
              type="button"
              onClick={onOpenCv}
              aria-haspopup="dialog"
              aria-controls="cv-preview"
              className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 underline underline-offset-4"
            >
              CV
            </button>
          </li>
          <li>
            <a
              href="#contato"
              onClick={(event) => {
                event.preventDefault();
                goSection('contato');
              }}
              className="inline-flex min-h-11 items-center px-2 underline underline-offset-4"
            >
              Contato
            </a>
          </li>
        </ul>
      </nav>
    </section>
  );
}

export function Hero({ onOpenJobFit, onOpenCv }: { onOpenJobFit: () => void; onOpenCv: () => void }) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <div className="min-w-0 max-w-[70ch]">
      <p className="text-pretty text-[1.125rem] font-semibold leading-snug">{profile.headline}</p>
      <p className="mt-4 text-pretty text-ink-soft">
        <Marked text={profile.summary} />
      </p>
      <p className="mt-4 text-pretty text-ink-soft">{profile.trustCopy}</p>

      <div className="mt-6 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
          {profile.email}
        </CTA>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
  );
}
