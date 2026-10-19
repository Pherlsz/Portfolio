import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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

  return (
    <li className="border-t border-line pt-6">
      <p className="eyebrow">
        {formatPeriod(span.start, span.end)} · {formatDuration(span.start, span.end)} · {experience.location}
      </p>

      <details
        className="experience-details min-w-0"
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 outline-offset-4 [&::-webkit-details-marker]:hidden">
          <div>
            <h3 className="display text-xl">{experience.company}</h3>
            <ul className="mt-2 space-y-1">
              {experience.roles.map((role) => (
                <li key={role.title} className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-semibold">{role.title}</span>
                  <span className="eyebrow">{formatPeriod(role.start, role.end)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-[70ch] text-pretty text-ink-soft">{experience.summary}</p>
          </div>
          <span className="experience-chevron mt-1 inline-flex size-11 shrink-0 items-center justify-center border border-line">
            <ChevronDown className="size-4" aria-hidden="true" />
            <span className="sr-only">Ver ou ocultar detalhes de {experience.company}</span>
          </span>
        </summary>

        <div className="mt-4">
          {metrics.length > 0 && (
            <ul className="max-w-[70ch] space-y-3 text-ink-soft">
              {metrics.map((h) => (
                <li key={h.metric}>
                  <span className="font-semibold text-ink">{h.metric}</span>
                  {' — '}
                  {h.text}
                </li>
              ))}
            </ul>
          )}

          {notes.length > 0 && (
            <ul className="mt-4 max-w-[70ch] space-y-2 text-ink-soft">
              {notes.map((h) => (
                <li key={h.text}>{h.text}</li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-sm text-muted">
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
  const years = experiences.flatMap((e) => e.roles.flatMap((r) => [r.start, r.end])).sort();
  const firstYear = years[0].slice(0, 4);
  const lastYear = years[years.length - 1].slice(0, 4);

  return (
    <section
      id="experiencia"
      aria-labelledby="experiencia-titulo"
      className="border-t border-line py-10"
    >
      <SectionHeading
        id="experiencia-titulo"
        eyebrow={`${firstYear} — ${lastYear}`}
        title="Experiência"
        intro="Comecei em suporte e no monitoramento de sistemas de alta disponibilidade. Depois passei a construir as interfaces, com o mesmo cuidado com estabilidade."
      />
      <ol className="space-y-2">
        {experiences.map((experience) => (
          <ExperienceItem key={experience.id} experience={experience} />
        ))}
      </ol>
    </section>
  );
}
