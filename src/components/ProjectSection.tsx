import { useState } from 'react';
import { ArrowUpRight, ChevronDown, Github, X } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA, featuredProjectLinks, type FeaturedProject } from '../data/portfolioData';
import { stackMatchesSkill, textMatchesSkill } from '../utils/skillUsage';
import { CTA } from './CTA';
import { Reveal, SectionHeading } from './ui';

function GymkhanaCorePoster() {
  const { project } = DEFAULT_PORTFOLIO_DATA;

  return (
    <div className="relative isolate flex aspect-[16/10] flex-col justify-between overflow-hidden bg-poster p-5 text-poster-ink">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-marker">Biblioteca</p>
      <p className="display-wide text-[1.55rem] uppercase leading-[0.86]">
        Gymkhana
        <span className="block">Core</span>
      </p>
      <p className="font-mono text-[0.7rem] text-poster-ink/80">{project.language}</p>
    </div>
  );
}

function FeaturedProjectLinkRow({ project }: { project: FeaturedProject }) {
  const links = featuredProjectLinks(project);

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-2">
      {links.map((link) =>
        link.kind === 'repo' ? (
          <CTA
            key={link.kind}
            variant="secondary"
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`GitHub: ${project.name}`}
            className="min-h-11 px-4"
            icon={<Github className="size-4" aria-hidden="true" />}
          >
            GitHub
          </CTA>
        ) : (
          <CTA
            key={link.kind}
            variant="secondary"
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Ver app: ${project.name}`}
            className="min-h-11 px-4"
            icon={<ArrowUpRight className="size-4" aria-hidden="true" />}
          >
            Ver app
          </CTA>
        )
      )}
    </div>
  );
}

export function ProjectSection({
  selectedSkill,
  onSelectSkill
}: {
  selectedSkill: string | null;
  onSelectSkill: (skill: string | null) => void;
}) {
  const { featuredProjects, project } = DEFAULT_PORTFOLIO_DATA;
  const featured = featuredProjects[0];
  const [coreOpen, setCoreOpen] = useState(false);

  const featuredMatched =
    selectedSkill && featured
      ? stackMatchesSkill(featured.stack, selectedSkill) ||
        textMatchesSkill(`${featured.name} ${featured.tagline}`, selectedSkill)
      : false;

  const coreDetailsMatched = selectedSkill
    ? textMatchesSkill(
        project.modules.map((m) => `${m.name} ${m.description}`).join(' '),
        selectedSkill
      )
    : false;

  const coreMatched = selectedSkill
    ? coreDetailsMatched || textMatchesSkill(`${project.language} ${project.name} ${project.tagline}`, selectedSkill)
    : false;

  const isCoreOpen = coreOpen || coreDetailsMatched;

  return (
    <section
      aria-labelledby="projeto-titulo"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-28"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading id="projeto-titulo" title="Projetos" />
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

      {featured && (
        <Reveal>
          <article
            className={`grid overflow-hidden rounded-[1.75rem] border bg-surface transition-all lg:grid-cols-2 ${
              featuredMatched ? 'border-ink ring-2 ring-marker' : 'border-line'
            }`}
          >
            <img
              src={featured.image}
              alt={`Captura de tela da interface do projeto ${featured.name}`}
              width={960}
              height={576}
              loading="lazy"
              decoding="async"
              className="aspect-[16/10] h-full w-full object-cover object-left-top"
            />
            <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
              <div>
                <h3 className="display text-2xl">{featured.name}</h3>
                <p className="mt-2 text-[0.9375rem] text-ink-soft">{featured.tagline}</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  {featured.access === 'restricted' && !featured.repoUrl && !featured.href && (
                    <span className="border border-line bg-paper px-2 py-0.5 font-mono text-[0.7rem] uppercase tracking-wide text-ink-soft">
                      Acesso restrito
                    </span>
                  )}
                  {featured.stack.map((tech, index) => {
                    const isSelected = selectedSkill
                      ? stackMatchesSkill([tech], selectedSkill) || selectedSkill === tech
                      : false;
                    return (
                      <span key={tech} className="inline-flex items-center font-mono text-[0.75rem] text-muted">
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
                        {index < featured.stack.length - 1 ? (
                          <span aria-hidden="true" className="ml-1.5">
                            ·
                          </span>
                        ) : null}
                      </span>
                    );
                  })}
                </div>
                <FeaturedProjectLinkRow project={featured} />
              </div>
            </div>
          </article>
        </Reveal>
      )}

      <Reveal delay={0.08} className="mt-8">
        <article
          className={`overflow-hidden rounded-[1.75rem] border bg-surface transition-all ${
            coreMatched ? 'border-ink ring-2 ring-marker' : 'border-line'
          }`}
        >
          <div className="sm:grid sm:grid-cols-[minmax(0,16rem)_1fr]">
            <GymkhanaCorePoster />
            <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
              <div>
                <h3 className="display text-2xl">{project.name}</h3>
                <p className="mt-2 text-[0.9375rem] text-ink-soft">{project.tagline}</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <button
                    type="button"
                    aria-pressed={selectedSkill === project.language}
                    onClick={() =>
                      onSelectSkill(selectedSkill === project.language ? null : project.language)
                    }
                    className={`cursor-pointer rounded-xs font-mono text-[0.75rem] px-1 -mx-1 transition-colors ${
                      selectedSkill === project.language
                        ? 'bg-marker text-on-marker'
                        : 'text-muted underline decoration-line underline-offset-4 hover:decoration-ink hover:text-ink'
                    }`}
                  >
                    {project.language}
                  </button>
                </div>
                <div className="flex min-h-11 flex-wrap items-center gap-2">
                  <CTA
                    variant="secondary"
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`GitHub: ${project.name}`}
                    className="min-h-11 px-4"
                    icon={<Github className="size-4" aria-hidden="true" />}
                  >
                    GitHub
                  </CTA>
                </div>
              </div>
            </div>
          </div>

          <details
            className="experience-details border-t border-line"
            open={isCoreOpen}
            onToggle={(event) => setCoreOpen(event.currentTarget.open)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 outline-offset-[-4px] transition-colors hover:bg-paper/60 sm:px-6 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-semibold text-ink-soft">Ver módulos</span>
              <span className="experience-chevron inline-flex size-9 shrink-0 items-center justify-center border border-line bg-paper">
                <ChevronDown className="size-4" aria-hidden="true" />
                <span className="sr-only">Ver ou ocultar módulos de {project.name}</span>
              </span>
            </summary>

            <div className="border-t border-line px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {project.modules.map((mod) => {
                  const matched = selectedSkill
                    ? textMatchesSkill(`${mod.name} ${mod.description}`, selectedSkill)
                    : false;
                  return (
                    <div
                      key={mod.name}
                      className={`rounded-xl border px-3.5 py-2.5 transition-colors ${
                        matched ? 'border-ink bg-marker/20' : 'border-line bg-paper/60'
                      }`}
                    >
                      <dt className="font-mono text-xs font-bold text-ink">{mod.name}</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-ink-soft">{mod.description}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </details>
        </article>
      </Reveal>
    </section>
  );
}
