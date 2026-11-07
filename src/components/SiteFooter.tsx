export function SiteFooter() {
  return (
    <footer className="no-print border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 pb-20 pt-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
        <p>© {new Date().getFullYear()} Pherls</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Para agentes de IA:</span>
          <a href="/llms.txt" className="link font-mono text-xs">
            /llms.txt
          </a>
        </p>
      </div>
    </footer>
  );
}
