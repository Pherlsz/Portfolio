import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';

export function SiteFooter({ onOpenInspector }: { onOpenInspector: () => void }) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <footer className="no-print border-t border-line">
      <div className="mx-auto flex max-w-[calc(36ch+70ch+4rem)] flex-col gap-3 px-4 py-8 text-[0.9375rem] text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="min-h-11 content-center">
          © {new Date().getFullYear()} {profile.name} · {profile.location}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Para agentes de IA:</span>
          <a href="/llms.txt" className="link inline-flex min-h-11 items-center font-mono text-sm">
            /llms.txt
          </a>
          <span aria-hidden="true">·</span>
          <a href="/ai.json" className="link inline-flex min-h-11 items-center font-mono text-sm">
            /ai.json
          </a>
          <span aria-hidden="true">·</span>
          <a href="/pedro.md" className="link inline-flex min-h-11 items-center font-mono text-sm">
            /pedro.md
          </a>
          <span aria-hidden="true">·</span>
          <a href="/resume.json" className="link inline-flex min-h-11 items-center font-mono text-sm">
            /resume.json
          </a>
          <span aria-hidden="true">·</span>
          <a href="/AGENTS.md" className="link inline-flex min-h-11 items-center font-mono text-sm">
            /AGENTS.md
          </a>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={onOpenInspector} className="link inline-flex min-h-11 items-center">
            Como este site foi feito
          </button>
        </p>
      </div>
    </footer>
  );
}
