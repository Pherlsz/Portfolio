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
    <li className="grid gap-5 border-t border-line pt-8 lg:grid-cols-[13rem_1fr] lg:gap-10">
      <div className="eyebrow space-y-1">
        <p className="font-semibold text-ink">{formatPeriod(span.start, span.end)}</p>
        <p>{formatDuration(span.start, span.end)}</p>
        <p>{experience.location}</p>
      </div>

      <details
        className="experience-details min-w-0"
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-xl [&::-webkit-details-marker]:hidden">
          <div>
            <h3 className="display text-2xl sm:text-3xl">{experience.company}</h3>
            <ul className="mt-3 space-y-1">
              {experience.roles.map((role) => (
                <li key={role.title} className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-semibold">{role.title}</span>
                  <span className="eyebrow">{formatPeriod(role.start, role.end)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-2xl text-ink-soft">{experience.summary}</p>
          </div>
          <span className="experience-chevron mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line">
            <ChevronDown className="size-4" aria-hidden="true" />
            <span className="sr-only">Ver ou ocultar detalhes de {experience.company}</span>
          </span>
        </summary>

        <div className="mt-2">
          {metrics.length > 0 && (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {metrics.map((h) => (
                <li key={h.metric} className="rounded-2xl border border-line bg-surface p-5">
                  <p className="display text-xl">
                    <mark>{h.metric}</mark>
                  </p>
                  <p className="mt-2 text-[0.9375rem] text-ink-soft">{h.text}</p>
                </li>
              ))}
            </ul>
          )}

          {notes.length > 0 && (
            <ul className="mt-6 max-w-3xl space-y-2 text-ink-soft">
              {notes.map((h) => (
                <li key={h.text} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.8em] h-px w-4 shrink-0 bg-current" />
                  {h.text}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-6 font-mono text-sm text-muted">
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
      className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28"
    >
      <SectionHeading
        id="experiencia-titulo"
        eyebrow={`${firstYear} — ${lastYear}`}
        title="Experiência"
        intro="Comecei em suporte e no monitoramento de sistemas de alta disponibilidade. Depois passei a construir as interfaces, com o mesmo cuidado com estabilidade."
      />
      <ol className="space-y-10">
        {experiences.map((experience) => (
          <ExperienceItem key={experience.id} experience={experience} />
        ))}
      </ol>
    </section>
  );
}
