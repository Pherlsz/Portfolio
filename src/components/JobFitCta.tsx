import type { MouseEvent } from 'react';
import { CTA } from './CTA';

type JobFitCtaProps = {
  onOpenJobFit: () => void;
  className?: string;
};

/** Opens the assistant in job-fit mode; `#experiencia` if the handler fails or JS is off. */
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
    <CTA variant="tertiary" href="#experiencia" className={className} onClick={onClick}>
      Ver fit com a vaga
    </CTA>
  );
}
