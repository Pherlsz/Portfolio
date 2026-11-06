import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import {
  DEFAULT_PORTFOLIO_DATA,
  experienceSpan,
  formatDuration,
  formatPeriod,
  type Experience
} from '../data/portfolioData';
import { stackMatchesSkill, textMatchesSkill } from '../utils/skillUsage';
import { Reveal, SectionHeading } from './ui';

function ExperienceItem({
  experience,
  index,
  selectedSkill,
  onSelectSkill
}: {
  experience: Experience;
  index: number;
  selectedSkill: string | null;
  onSelectSkill: (skill: string | null) => void;
}) {
  const span = experienceSpan(experience);
  const metrics = experience.highlights.filter((h) => h.metric);
  const notes = experience.highlights.filter((h) => !h.metric);
  const [open, setOpen] = useState(true);

  const hasSkillMatch = selectedSkill
    ? stackMatchesSkill(experience.stack, selectedSkill) ||
      experience.highlights.some((h) => textMatchesSkill(`${h.metric ?? ''} ${h.text}`, selectedSkill))
    : false;

  return (
    <li>
      <Reveal
        delay={index * 0.06}
        className={`grid gap-5 border-t pt-8 transition-opacity duration-200 lg:grid-cols-[13rem_1fr] lg:gap-10 ${
          selectedSkill && !hasSkillMatch ? 'border-line opacity-45' : 'border-line opacity-100'
        }`}
      >
        <div className="eyebrow space-y-1">
          <p className="font-semibold text-ink">{formatPeriod(span.start, span.end)}</p>
          <p>{formatDuration(span.start, span.end)}</p>
          <p>{experience.location}</p>
          {selectedSkill && hasSkillMatch && (
            <p className="pt-1">
              <span className="inline-block bg-marker px-2 py-0.5 font-mono text-[0.7rem] font-bold uppercase text-on-marker">
                Usa {selectedSkill}
              </span>
            </p>
          )}
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
                {metrics.map((h, mIdx) => {
                  const matched = selectedSkill
                    ? textMatchesSkill(`${h.metric ?? ''} ${h.text}`, selectedSkill)
                    : false;
                  return (
                    <li key={h.metric}>
                      <Reveal
                        delay={mIdx * 0.04}
                        y={10}
                        className={`flex h-full flex-col justify-start rounded-xl border bg-surface p-3.5 sm:p-4 transition-colors ${
                          matched ? 'border-ink ring-2 ring-marker' : 'border-line'
                        }`}
                      >
                        <p className="display text-base sm:text-lg font-bold tracking-tight">
                          <mark className="bg-transparent text-ink">{h.metric}</mark>
                        </p>
                        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-ink-soft">{h.text}</p>
                      </Reveal>
                    </li>
                  );
                })}
              </ul>
            )}

            {notes.length > 0 && (
              <ul className="mt-6 max-w-3xl space-y-2 text-ink-soft">
                {notes.map((h) => {
                  const matched = selectedSkill ? textMatchesSkill(h.text, selectedSkill) : false;
                  return (
                    <li
                      key={h.text}
                      className={`flex gap-3 rounded-lg px-2 py-1 -mx-2 transition-colors ${
                        matched ? 'bg-marker/25 text-ink' : ''
                      }`}
                    >
                      <span aria-hidden="true" className="mt-[0.8em] h-px w-4 shrink-0 bg-current" />
                      {h.text}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 font-mono text-sm text-muted">
              <span className="sr-only">Stack: </span>
              {experience.stack.map((tech, idx) => {
                const isSelected = selectedSkill
                  ? stackMatchesSkill([tech], selectedSkill) || selectedSkill === tech
                  : false;
                return (
                  <span key={tech} className="inline-flex items-center">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelectSkill(selectedSkill === tech ? null : tech)}
                      className={`cursor-pointer rounded-xs px-1 -mx-1 transition-colors ${
                        isSelected
                          ? 'bg-marker text-on-marker'
                          : 'hover:text-ink underline decoration-line underline-offset-4 hover:decoration-ink'
                      }`}
                    >
                      {tech}
                    </button>
                    {idx < experience.stack.length - 1 ? (
                      <span aria-hidden="true" className="ml-1.5">
                        ·
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </div>
          </div>
        </details>
      </Reveal>
    </li>
  );
}

export function ExperienceSection({
  selectedSkill,
  onSelectSkill
}: {
  selectedSkill: string | null;
  onSelectSkill: (skill: string | null) => void;
}) {
  const { experiences } = DEFAULT_PORTFOLIO_DATA;
  const years = experiences.flatMap((e) => e.roles.flatMap((r) => [r.start, r.end])).sort();
  const firstYear = years[0].slice(0, 4);
  const lastYear = years[years.length - 1].slice(0, 4);

  return (
    <section
      id="experiencia"
      tabIndex={-1}
      aria-labelledby="experiencia-titulo"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-28"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          id="experiencia-titulo"
          eyebrow={`${firstYear} — ${lastYear}`}
          title="Experiência"
          intro="Comecei em suporte e no monitoramento de sistemas de alta disponibilidade. Depois passei a construir as interfaces, com o mesmo cuidado com estabilidade."
        />
        {selectedSkill && (
          <div className="mb-10 flex items-center gap-2 sm:mb-14">
            <span className="eyebrow">Filtro ativo:</span>
            <button
              type="button"
              onClick={() => onSelectSkill(null)}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 border border-ink bg-marker px-3 py-1 font-mono text-xs font-bold text-on-marker"
            >
              <span>{selectedSkill}</span>
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <ol className="space-y-10">
        {experiences.map((experience, index) => (
          <ExperienceItem
            key={experience.id}
            experience={experience}
            index={index}
            selectedSkill={selectedSkill}
            onSelectSkill={onSelectSkill}
          />
        ))}
      </ol>
    </section>
  );
}
