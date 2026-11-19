import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, actions, children }: PageHeaderProps) {
  return (
    <header className="border-b border-border pb-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 font-mono text-micro uppercase tracking-[0.08em] text-muted">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-[length:var(--text-poster)] font-extrabold leading-[0.98] tracking-[-0.035em] text-ink">
            {title}
          </h1>
          {subtitle ? <div className="mt-2.5">{subtitle}</div> : null}
        </div>

        {actions ? <div className="min-w-0 max-w-full shrink-0">{actions}</div> : null}
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  );
}
