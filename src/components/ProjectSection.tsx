import { DEFAULT_PORTFOLIO_DATA, type FeaturedProject } from '../data/portfolioData';
import { featuredProjectLinks } from '../utils/featuredProjectLinks';
import { CTA } from './CTA';
import { SectionHeading } from './ui';

function FeaturedProjectLinkRow({ project }: { project: FeaturedProject }) {
  const links = featuredProjectLinks(project);

  return (
    <p className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1">
      {links.map((link) =>
        link.kind === 'repo' ? (
          <CTA
            key={link.kind}
            variant="tertiary"
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Código no GitHub: ${project.name}`}
          >
            Código no GitHub
          </CTA>
        ) : (
          <CTA
            key={link.kind}
            variant="tertiary"
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Ver app: ${project.name}`}
          >
            Ver app
          </CTA>
        )
      )}
    </p>
  );
}

export function ProjectSection() {
  const { featuredProjects, project } = DEFAULT_PORTFOLIO_DATA;
  const featured = featuredProjects[0];

  return (
    <section aria-labelledby="projeto-titulo" className="scroll-mt-5 px-5 py-14 sm:px-8 sm:py-20">
      <SectionHeading id="projeto-titulo" title="Projetos" />

      {featured ? (
        <article className="max-w-prose border-t border-line pt-6">
          <p className="eyebrow">{featured.kicker}</p>
          <h3 className="display mt-1 text-2xl">{featured.name}</h3>
          <p className="mt-2 text-ink-soft">{featured.tagline}</p>
          <img
            src={featured.image}
            alt=""
            width={960}
            height={540}
            loading="lazy"
            decoding="async"
            className="mt-4 aspect-[16/10] w-full border border-line object-cover object-left-top"
          />
          <p className="mt-3 font-mono text-sm text-muted">
            {featured.access === 'restricted' && !featured.repoUrl && !featured.href
              ? 'Acesso restrito · '
              : null}
            {featured.stack.join(' · ')}
          </p>
          <FeaturedProjectLinkRow project={featured} />
        </article>
      ) : null}

      <article className="mt-10 max-w-prose border-t border-line pt-6">
        <p className="eyebrow">
          {project.language} · {project.version} · {project.spec}
        </p>
        <h3 className="display mt-1 text-2xl">{project.name}</h3>
        <p className="mt-2 text-ink-soft">{project.tagline}</p>
        <CTA
          variant="tertiary"
          href={project.repoUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Código no GitHub: ${project.name}`}
          className="mt-3"
        >
          Código no GitHub
        </CTA>
      </article>
    </section>
  );
}
