export function EditorialLoader({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[65dvh] w-full flex-col items-center justify-center px-6 py-12"
    >
      <div className="flex flex-col items-center gap-3.5">
        <div className="mascot relative flex size-14 flex-col items-center justify-end pb-0.5" aria-hidden="true">
          <span className="mascot-idle">
            <img
              src="/stickers/banguela.webp"
              width={48}
              height={44}
              alt=""
              decoding="async"
              draggable={false}
              className="block select-none"
              style={{ width: 48, height: 44 }}
            />
          </span>
          <span className="mascot-shadow" />
        </div>

        <div className="h-[2px] w-28 overflow-hidden rounded-full bg-border" aria-hidden="true">
          <div className="editorial-loader-bar h-full w-2/5 rounded-full bg-accent" />
        </div>

        <p className="font-mono text-micro text-muted">{label}</p>
      </div>
    </div>
  );
}
