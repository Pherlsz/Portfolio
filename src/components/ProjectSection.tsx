import { ArrowUpRight, Github, X } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA, featuredProjectLinks, type FeaturedProject } from '../data/portfolioData';
import { stackMatchesSkill, textMatchesSkill } from '../utils/skillUsage';
import { CTA } from './CTA';
import { Reveal, SectionHeading } from './ui';

function GymkhanaCorePoster() {
  const { project } = DEFAULT_PORTFOLIO_DATA;

  return (
    <div className="relative isolate flex aspect-[16/10] flex-col justify-between overflow-hidden bg-poster p-5 text-poster-ink">
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-marker">Biblioteca</p>
        <p className="font-mono text-[0.7rem] text-poster-ink/80">{project.version}</p>
      </div>
      <p className="display-wide text-[1.55rem] uppercase leading-[0.86]">
        Gymkhana
        <span className="block">Core</span>
      </p>
      <p className="font-mono text-[0.7rem] text-poster-ink/80">
        {project.language} · {project.spec}
      </p>
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
            aria-label={`Código no GitHub: ${project.name}`}
            className="min-h-11 px-4"
            icon={<Github className="size-4" aria-hidden="true" />}
          >
            Código no GitHub
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

  const featuredMatched =
    selectedSkill && featured
      ? stackMatchesSkill(featured.stack, selectedSkill) ||
        textMatchesSkill(`${featured.name} ${featured.tagline}`, selectedSkill)
      : false;

  const coreMatched = selectedSkill
    ? textMatchesSkill(
        `${project.language} ${project.name} ${project.tagline} ${project.modules
          .map((m) => `${m.name} ${m.description}`)
          .join(' ')}`,
        selectedSkill
      )
    : false;

  return (
    <section
      aria-labelledby="projeto-titulo"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-28"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading id="projeto-titulo" eyebrow="Trabalho" title="Projetos" />
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
          <h3 className="display text-xl">Em destaque</h3>
          <article
            className={`mt-4 grid overflow-hidden rounded-[1.75rem] border bg-surface transition-all lg:grid-cols-2 ${
              featuredMatched ? 'border-ink ring-2 ring-marker' : 'border-line'
            }`}
          >
            <img
              src={featured.image}
              alt={`Captura de tela da interface do projeto ${featured.name}`}
              width={960}
              height={540}
              loading="lazy"
              decoding="async"
              className="aspect-[16/10] h-full w-full object-cover object-left-top"
            />
            <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
              <div>
                <p className="eyebrow">{featured.kicker}</p>
                <h4 className="display mt-1 text-2xl">{featured.name}</h4>
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

      <Reveal delay={0.08} className="mt-14">
        <h3 className="display text-xl">Outros projetos</h3>
        <article
          className={`mt-4 overflow-hidden rounded-[1.75rem] border bg-surface transition-all sm:grid sm:grid-cols-[minmax(0,16rem)_1fr] ${
            coreMatched ? 'border-ink ring-2 ring-marker' : 'border-line'
          }`}
        >
          <GymkhanaCorePoster />
          <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">Biblioteca em Go</p>
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
              <h4 className="display mt-1 text-2xl">{project.name}</h4>
              <p className="mt-2 text-[0.9375rem] text-ink-soft">{project.tagline}</p>
            </div>
            <div className="flex min-h-11 flex-wrap items-center gap-2">
              <CTA
                variant="secondary"
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Código no GitHub: ${project.name}`}
                className="min-h-11 px-4"
                icon={<Github className="size-4" aria-hidden="true" />}
              >
                Código no GitHub
              </CTA>
            </div>
          </div>
        </article>
      </Reveal>
    </section>
  );
}
