import { useEffect, type ReactNode } from 'react';
import {
  DEFAULT_PORTFOLIO_DATA,
  experienceSpan,
  featuredProjectPrimaryUrl,
  formatPeriod,
  plainText,
  SITE_ORIGIN,
  skillNames
} from '../data/portfolioData';

const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

function CvSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="display break-after-avoid border-b border-line pb-1 text-[12pt] uppercase tracking-wide">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Versão A4 do currículo, gerada dos mesmos dados do site e impressa em /cv. */
export function CvDocument({ embedded = false }: { embedded?: boolean } = {}) {
  const { profile, experiences, featuredProjects, project, skills, education, certifications, otherCourses, languages } =
    DEFAULT_PORTFOLIO_DATA;

  useEffect(() => {
    if (embedded) return;
    const prevTitle = document.title;
    const wasDark = document.documentElement.classList.contains('dark');
    document.title = `${profile.name} · Currículo`;
    document.documentElement.classList.remove('dark');
    return () => {
      document.title = prevTitle;
      if (wasDark) document.documentElement.classList.add('dark');
    };
  }, [embedded, profile.name]);

  const Wrapper = embedded ? 'div' : 'main';

  return (
    <Wrapper
      className={
        embedded
          ? 'mx-auto max-w-[210mm] border border-line bg-paper px-5 py-6 text-[10pt] leading-[1.45] text-ink shadow-lg sm:px-[16mm] sm:py-[14mm]'
          : 'mx-auto max-w-[210mm] bg-paper px-[16mm] py-[14mm] text-[10pt] leading-[1.45] text-ink print:p-0'
      }
    >
      {!embedded && (
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <a href="/" className="link font-mono text-xs font-semibold">
            ← Voltar ao portfólio
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="cta cta-primary min-h-9 px-3 py-1.5 text-xs"
          >
            Imprimir / Salvar PDF
          </button>
        </div>
      )}
      <header>
        <h1 className="display-wide text-[24pt] uppercase leading-none">{profile.name}</h1>
        <p className="mt-2 font-mono text-[9.5pt]">
          {profile.jobTitle} · {profile.seniority} · {profile.location}
        </p>
        <p className="mt-1 font-mono text-[9pt] text-muted">{profile.workMode}</p>
        <p className="mt-1 text-[9.5pt]">
          <a href={`mailto:${profile.email}`} className="underline underline-offset-2">
            {profile.email}
          </a>{' '}
          ·{' '}
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {shortUrl(profile.linkedin)}
          </a>{' '}
          ·{' '}
          <a href={profile.github} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {shortUrl(profile.github)}
          </a>{' '}
          ·{' '}
          <a href={SITE_ORIGIN} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {shortUrl(SITE_ORIGIN)}
          </a>
        </p>
      </header>

      <CvSection title="Resumo">
        <p>
          {profile.headline} {plainText(profile.summary)}
        </p>
      </CvSection>

      <CvSection title="Experiência">
        <div className="space-y-4">
          {experiences.map((exp) => {
            const span = experienceSpan(exp);
            return (
              <article key={exp.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <h3 className="text-[11pt] font-bold">{exp.company}</h3>
                  <p className="font-mono text-[9pt]">
                    {formatPeriod(span.start, span.end)} · {exp.location}
                  </p>
                </div>
                <p className="text-[9.5pt]">
                  {exp.roles.map((role) => `${role.title} (${formatPeriod(role.start, role.end)})`).join(' · ')}
                </p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                  {exp.highlights.map((h) => (
                    <li key={h.text}>
                      {h.metric && <strong>{h.metric}: </strong>}
                      {h.text}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 font-mono text-[8.5pt] text-muted">{exp.stack.join(' · ')}</p>
              </article>
            );
          })}
        </div>
      </CvSection>

      <CvSection title="Projetos">
        <ul className="space-y-2">
          {featuredProjects.map((item) => {
            const primary = featuredProjectPrimaryUrl(item);
            return (
            <li key={item.id} className="break-inside-avoid">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <h3 className="text-[11pt] font-bold">{item.name}</h3>
                {primary ? (
                  <p className="font-mono text-[9pt]">
                    <a href={primary} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                      {shortUrl(primary)}
                    </a>
                  </p>
                ) : null}
              </div>
              <p>{item.tagline}</p>
            </li>
            );
          })}
          <li className="break-inside-avoid">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
              <h3 className="text-[11pt] font-bold">
                {project.name} · {project.language}
              </h3>
              <p className="font-mono text-[9pt]">
                <a href={project.repoUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  {shortUrl(project.repoUrl)}
                </a>
              </p>
            </div>
            <p>{project.tagline}</p>
          </li>
        </ul>
      </CvSection>

      <CvSection title="Habilidades">
        <dl className="space-y-1">
          {skills.map((group) => (
            <div key={group.name} className="flex gap-2">
              <dt className="w-36 shrink-0 font-bold">{group.name}</dt>
              <dd>{skillNames(group).join(', ')}</dd>
            </div>
          ))}
        </dl>
      </CvSection>

      <div className="grid gap-6 sm:grid-cols-3 print:grid-cols-3">
        <CvSection title="Formação">
          {education.map((e) => (
            <p key={e.course}>
              <strong>{e.course}</strong>
              <br />
              {e.school} · {e.period}
            </p>
          ))}
        </CvSection>
        <CvSection title="Certificações">
          <ul className="space-y-1">
            {certifications.map((c) => (
              <li key={c.name}>
                <strong>{c.name}</strong> · {c.issuer}, {c.year}
              </li>
            ))}
            <li>{otherCourses.join(', ')}</li>
          </ul>
        </CvSection>
        <CvSection title="Idiomas">
          <ul className="space-y-1">
            {languages.map((l) => (
              <li key={l.code}>
                <strong>{l.name}</strong>: {l.level}
              </li>
            ))}
          </ul>
        </CvSection>
      </div>
    </Wrapper>
  );
}
