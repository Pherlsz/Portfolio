import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { AboutSection } from './AboutSection';
import { CredentialsSection } from './CredentialsSection';
import { ExperienceSection } from './ExperienceSection';
import { Hero } from './Hero';
import { ProjectSection } from './ProjectSection';
import { smoothScrollToSection } from './ui';

const V1_TITLE = 'Portfólio Editorial (2025) · pherls.dev';

export function V1Page() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = V1_TITLE;

    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousContent = existingRobots?.getAttribute('content') ?? null;

    let createdMeta: HTMLMetaElement | null = null;
    if (existingRobots) {
      existingRobots.setAttribute('content', 'noindex');
    } else {
      createdMeta = document.createElement('meta');
      createdMeta.name = 'robots';
      createdMeta.content = 'noindex';
      document.head.appendChild(createdMeta);
    }

    return () => {
      document.title = previousTitle;
      if (createdMeta) {
        createdMeta.remove();
      } else if (existingRobots) {
        if (previousContent === null) {
          existingRobots.removeAttribute('content');
        } else {
          existingRobots.setAttribute('content', previousContent);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!window.location.hash) return;
    const frame = window.requestAnimationFrame(() => {
      smoothScrollToSection(window.location.hash);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p className="font-mono text-xs text-ink-soft sm:text-sm">
            Você está vendo o Portfólio Editorial (2025, arquivado).
          </p>
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-1.5 border border-line bg-surface px-3 py-1.5 font-mono text-xs font-semibold text-ink transition-colors hover:border-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Voltar para o portfólio atual</span>
          </Link>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="divide-y divide-line">
        <Hero />
        <ExperienceSection />
        <div id="projeto" tabIndex={-1}>
          <ProjectSection />
        </div>
        <div id="formacao" tabIndex={-1}>
          <CredentialsSection />
        </div>
        <div id="sobre" tabIndex={-1}>
          <AboutSection />
        </div>
      </main>

      <footer className="no-print border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-sm text-muted sm:px-8">
          <p>Portfólio Editorial · pherls.dev (2025)</p>
          <Link href="/" className="link font-mono text-xs">
            Voltar para o portfólio atual
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default V1Page;
