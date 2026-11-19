import { useState } from 'react';
import { ArrowUpRight, ChevronDown, Github } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA, featuredProjectLinks, type FeaturedProject } from '../data/portfolioData';
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

export function ProjectSection() {
  const { featuredProjects, project } = DEFAULT_PORTFOLIO_DATA;
  const featured = featuredProjects[0];
  const [coreOpen, setCoreOpen] = useState(false);

  return (
    <section
      aria-labelledby="projeto-titulo"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-28"
    >
      <SectionHeading id="projeto-titulo" title="Projetos" />

      {featured && (
        <Reveal>
          <article className="grid overflow-hidden rounded-[1.75rem] border border-line bg-surface lg:grid-cols-2">
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
                <ul className="flex flex-wrap items-center gap-1.5 font-mono text-[0.75rem]">
                  {featured.access === 'restricted' && !featured.repoUrl && !featured.href && (
                    <li className="border border-line bg-paper px-2 py-0.5 text-[0.7rem] uppercase tracking-wide text-ink-soft">
                      Acesso restrito
                    </li>
                  )}
                  {featured.stack.map((tech) => (
                    <li
                      key={tech}
                      className="border border-line bg-paper/60 px-2 py-0.5 text-ink-soft"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
                <FeaturedProjectLinkRow project={featured} />
              </div>
            </div>
          </article>
        </Reveal>
      )}

      <Reveal delay={0.08} className="mt-8">
        <article className="overflow-hidden rounded-[1.75rem] border border-line bg-surface">
          <div className="sm:grid sm:grid-cols-[minmax(0,16rem)_1fr]">
            <GymkhanaCorePoster />
            <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
              <div>
                <h3 className="display text-2xl">{project.name}</h3>
                <p className="mt-2 text-[0.9375rem] text-ink-soft">{project.tagline}</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="border border-line bg-paper/60 px-2 py-0.5 font-mono text-[0.75rem] text-ink-soft">
                    {project.language}
                  </span>
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
            open={coreOpen}
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
                {project.modules.map((mod) => (
                  <div
                    key={mod.name}
                    className="rounded-xl border border-line bg-paper/60 px-3.5 py-2.5"
                  >
                    <dt className="font-mono text-xs font-bold text-ink">{mod.name}</dt>
                    <dd className="mt-0.5 text-xs leading-relaxed text-ink-soft">{mod.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
        </article>
      </Reveal>
    </section>
  );
}
