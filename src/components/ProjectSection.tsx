import { DEFAULT_PORTFOLIO_DATA, type FeaturedProject } from '../data/portfolioData';
import { featuredProjectLinks } from '../utils/featuredProjectLinks';
import { SectionHeading } from './ui';

function ProjectLinks({ project }: { project: FeaturedProject | { name: string; repoUrl: string } }) {
  const links = featuredProjectLinks(
    'access' in project ? project : { repoUrl: project.repoUrl }
  );

  return (
    <p className="mt-2 flex min-h-11 flex-wrap items-center gap-x-4">
      {links.map((link) => (
        <a
          key={link.kind}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center underline underline-offset-4"
        >
          {link.kind === 'repo' ? 'Código no GitHub' : 'Ver app'}
        </a>
      ))}
    </p>
  );
}

export function ProjectSection() {
  const { featuredProjects, project } = DEFAULT_PORTFOLIO_DATA;
  const featured = featuredProjects[0];

  return (
    <section aria-labelledby="projeto-titulo" className="border-t border-line py-10">
      <SectionHeading id="projeto-titulo" eyebrow="Trabalho" title="Projetos" />

      <ol className="space-y-8">
        {featured && (
          <li className="border-t border-line pt-6">
            <h3 className="display text-lg">
              <span className="text-muted">01</span>
              {'  '}
              {featured.name}
            </h3>
            <p className="mt-2 text-pretty text-ink-soft">{featured.tagline}</p>
            <ProjectLinks project={featured} />
          </li>
        )}
        <li className="border-t border-line pt-6">
          <h3 className="display text-lg">
            <span className="text-muted">02</span>
            {'  '}
            {project.name}
          </h3>
          <p className="mt-2 text-pretty text-ink-soft">{project.tagline}</p>
          <ProjectLinks project={project} />
        </li>
      </ol>
    </section>
  );
}
