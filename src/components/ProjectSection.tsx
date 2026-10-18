import { DEFAULT_PORTFOLIO_DATA, type FeaturedProject } from '../data/portfolioData';
import { featuredProjectLinks } from '../utils/featuredProjectLinks';
import { SectionHeading } from './ui';

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
    <div className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2">
      {links.map((link) =>
        link.kind === 'repo' ? (
          <a
            key={link.kind}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Código no GitHub: ${project.name}`}
            className="text-link inline-flex min-h-11 items-center py-2"
          >
            Código no GitHub
          </a>
        ) : (
          <a
            key={link.kind}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Ver app: ${project.name}`}
            className="text-link inline-flex min-h-11 items-center py-2"
          >
            Ver app
          </a>
        )
      )}
    </div>
  );
}

export function ProjectSection() {
  const { featuredProjects, project } = DEFAULT_PORTFOLIO_DATA;
  const featured = featuredProjects[0];

  return (
    <section
      aria-labelledby="projeto-titulo"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-28"
    >
      <SectionHeading id="projeto-titulo" eyebrow="Trabalho" title="Projetos" />

      {featured && (
        <>
          <h3 className="display text-xl">Em destaque</h3>
          <article className="mt-4 grid border border-line lg:grid-cols-2">
            <img
              src={featured.image}
              alt=""
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
                <div className="flex flex-wrap items-center gap-2">
                  {featured.access === 'restricted' && !featured.repoUrl && !featured.href && (
                    <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-wide text-ink-soft">
                      Acesso restrito
                    </span>
                  )}
                  {featured.stack.map((tech) => (
                    <span key={tech} className="font-mono text-[0.7rem] text-muted">
                      {tech}
                    </span>
                  ))}
                </div>
                <FeaturedProjectLinkRow project={featured} />
              </div>
            </div>
          </article>
        </>
      )}

      <h3 className="display mt-14 text-xl">Outros projetos</h3>
      <article className="mt-4 border border-line sm:grid sm:grid-cols-[minmax(0,16rem)_1fr]">
        <GymkhanaCorePoster />
        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
          <div>
            <p className="eyebrow">Biblioteca em Go</p>
            <h4 className="display mt-1 text-2xl">{project.name}</h4>
            <p className="mt-2 text-[0.9375rem] text-ink-soft">{project.tagline}</p>
          </div>
          <div className="flex min-h-11 flex-wrap items-center gap-2">
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Código no GitHub: ${project.name}`}
              className="text-link inline-flex min-h-11 items-center py-2"
            >
              Código no GitHub
            </a>
          </div>
        </div>
      </article>
    </section>
  );
}
