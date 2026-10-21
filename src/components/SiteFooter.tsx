export function SiteFooter({ onOpenInspector }: { onOpenInspector: () => void }) {
  return (
    <footer className="no-print border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 pb-20 pt-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
        <p>© {new Date().getFullYear()} Pherls</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Para agentes de IA:</span>
          <a href="/llms.txt" className="link font-mono text-xs">
            /llms.txt
          </a>
          <span aria-hidden="true">·</span>
          <a href="/ai.json" className="link font-mono text-xs">
            /ai.json
          </a>
          <span aria-hidden="true">·</span>
          <a href="/pedro.md" className="link font-mono text-xs">
            /pedro.md
          </a>
          <span aria-hidden="true">·</span>
          <a href="/resume.json" className="link font-mono text-xs">
            /resume.json
          </a>
          <span aria-hidden="true">·</span>
          <a href="/AGENTS.md" className="link font-mono text-xs">
            /AGENTS.md
          </a>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={onOpenInspector} className="link cursor-pointer">
            Como este site foi feito
          </button>
        </p>
      </div>
    </footer>
  );
}
