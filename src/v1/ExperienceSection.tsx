import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DEFAULT_PORTFOLIO_DATA,
  experienceSpan,
  formatDuration,
  formatPeriod,
  type Experience
} from '../data/portfolioData';
import { Reveal, SectionHeading } from './ui';

function ExperienceItem({ experience, index }: { experience: Experience; index: number }) {
  const span = experienceSpan(experience);
  const metrics = experience.highlights.filter((h) => h.metric);
  const notes = experience.highlights.filter((h) => !h.metric);
  const [open, setOpen] = useState(index === 0);

  return (
    <li>
      <Reveal
        delay={index * 0.06}
        className="grid gap-5 border-t border-line pt-8 lg:grid-cols-[13rem_1fr] lg:gap-10"
      >
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
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-xl outline-offset-4 [&::-webkit-details-marker]:hidden">
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
            <span className="experience-chevron mt-1 inline-flex size-11 shrink-0 items-center justify-center border border-line">
              <ChevronDown className="size-4" aria-hidden="true" />
              <span className="sr-only">Ver ou ocultar detalhes de {experience.company}</span>
            </span>
          </summary>

          <div className="mt-2">
            {metrics.length > 0 && (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {metrics.map((h, mIdx) => (
                  <li key={h.metric}>
                    <Reveal
                      delay={mIdx * 0.04}
                      y={10}
                      className="flex h-full flex-col justify-start rounded-xl border border-line bg-surface p-3.5 sm:p-4"
                    >
                      <p className="display text-base font-bold tracking-tight sm:text-lg">
                        <mark className="bg-transparent text-ink">{h.metric}</mark>
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft sm:text-sm">{h.text}</p>
                    </Reveal>
                  </li>
                ))}
              </ul>
            )}

            {notes.length > 0 && (
              <ul className="mt-6 max-w-3xl space-y-2 text-ink-soft">
                {notes.map((h) => (
                  <li key={h.text} className="flex gap-3 px-2 py-1 -mx-2">
                    <span aria-hidden="true" className="mt-[0.8em] h-px w-4 shrink-0 bg-current" />
                    {h.text}
                  </li>
                ))}
              </ul>
            )}

            <ul className="mt-6 flex flex-wrap items-center gap-1.5 font-mono text-xs text-muted">
              <li className="sr-only">Stack:</li>
              {experience.stack.map((tech) => (
                <li
                  key={tech}
                  className="border border-line bg-surface px-2 py-0.5 text-ink-soft"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        </details>
      </Reveal>
    </li>
  );
}

export function ExperienceSection() {
  const { experiences } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section
      id="experiencia"
      tabIndex={-1}
      aria-labelledby="experiencia-titulo"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-28"
    >
      <SectionHeading id="experiencia-titulo" title="Experiência" />
      <ol className="space-y-10">
        {experiences.map((experience, index) => (
          <ExperienceItem key={experience.id} experience={experience} index={index} />
        ))}
      </ol>
    </section>
  );
}
