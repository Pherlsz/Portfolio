import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';

export function SiteFooter({ onOpenInspector }: { onOpenInspector: () => void }) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <footer className="no-print border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-[0.9375rem] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} {profile.name} · {profile.location}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Para agentes de IA:</span>
          <a href="/llms.txt" className="link font-mono text-sm">
            /llms.txt
          </a>
          <span aria-hidden="true">·</span>
          <a href="/ai.json" className="link font-mono text-sm">
            /ai.json
          </a>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={onOpenInspector} className="link">
            Como este site foi feito
          </button>
        </p>
      </div>
    </footer>
  );
}
