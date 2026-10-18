import type { MouseEvent } from 'react';

type JobFitCtaProps = {
  onOpenJobFit: () => void;
  className?: string;
};

/** Abre o assistente em modo jobfit; `#experiencia` se o handler falhar ou sem JS. */
export function JobFitCta({ onOpenJobFit, className }: JobFitCtaProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    try {
      onOpenJobFit();
    } catch {
      window.location.assign('#experiencia');
    }
  };

  return (
    <a href="#experiencia" className={className ?? 'text-link min-h-11 py-2'} onClick={onClick}>
      Ver fit com a vaga
    </a>
  );
}
