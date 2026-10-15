import type { MouseEvent } from 'react';
import { CTA } from './CTA';

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
    <CTA variant="secondary" href="#experiencia" className={className} onClick={onClick}>
      Ver fit com a vaga
    </CTA>
  );
}
