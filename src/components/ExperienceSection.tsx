import { useState } from 'react';
import {
  DEFAULT_PORTFOLIO_DATA,
  experienceSpan,
  formatDuration,
  formatPeriod,
  type Experience
} from '../data/portfolioData';
import { SectionHeading } from './ui';

function ExperienceItem({ experience }: { experience: Experience }) {
  const span = experienceSpan(experience);
  const metrics = experience.highlights.filter((h) => h.metric);
  const notes = experience.highlights.filter((h) => !h.metric);
  const [open, setOpen] = useState(true);
  const metricLine = metrics.map((h) => h.metric).join(', ');

  return (
    <li className="grid gap-3 border-t border-line pt-6 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-10">
      <div className="eyebrow space-y-1">
        <p className="tabular-nums text-ink">{formatPeriod(span.start, span.end)}</p>
        <p>{formatDuration(span.start, span.end)}</p>
        <p>{experience.location}</p>
      </div>

      <details
        className="experience-details min-w-0"
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 outline-offset-4 [&::-webkit-details-marker]:hidden">
          <div>
            <h3 className="display text-xl sm:text-2xl">{experience.company}</h3>
            <ul className="mt-2 space-y-1">
              {experience.roles.map((role) => (
                <li key={role.title} className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-semibold">{role.title}</span>
                  <span className="eyebrow tabular-nums">{formatPeriod(role.start, role.end)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-prose text-ink-soft">{experience.summary}</p>
          </div>
          <span className="experience-chevron mt-1 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-sm underline underline-offset-4">
            {open ? 'Ocultar' : 'Ver'}
            <span className="sr-only"> detalhes de {experience.company}</span>
          </span>
        </summary>

        <div className="mt-4">
          {metricLine ? <p className="font-mono text-sm tabular-nums text-ink">{metricLine}</p> : null}

          {metrics.length > 0 ? (
            <ul className="mt-4 max-w-prose space-y-2 text-ink-soft">
              {metrics.map((h) => (
                <li key={h.metric}>
                  <span className="font-semibold text-ink">{h.metric}.</span> {h.text}
                </li>
              ))}
            </ul>
          ) : null}

          {notes.length > 0 ? (
            <ul className="mt-4 max-w-prose space-y-2 text-ink-soft">
              {notes.map((h) => (
                <li key={h.text}>{h.text}</li>
              ))}
            </ul>
          ) : null}

          <p className="mt-4 font-mono text-sm text-muted">
            <span className="sr-only">Stack: </span>
            {experience.stack.join(' · ')}
          </p>
        </div>
      </details>
    </li>
  );
}

export function ExperienceSection() {
  const { experiences } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section
      id="experiencia"
      aria-labelledby="experiencia-titulo"
      className="scroll-mt-5 px-5 py-14 sm:px-8 sm:py-20"
    >
      <SectionHeading
        id="experiencia-titulo"
        title="Experiência"
        intro="Comecei em suporte e no monitoramento de sistemas de alta disponibilidade. Depois passei a construir as interfaces, com o mesmo cuidado com estabilidade."
      />
      <ol className="space-y-8">
        {experiences.map((experience) => (
          <ExperienceItem key={experience.id} experience={experience} />
        ))}
      </ol>
    </section>
  );
}
