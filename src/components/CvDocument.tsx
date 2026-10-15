import { useEffect, type ReactNode } from 'react';
import { DEFAULT_PORTFOLIO_DATA, experienceSpan, formatPeriod, plainText, skillNames } from '../data/portfolioData';

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
export function CvDocument() {
  const { profile, experiences, featuredProjects, project, skills, education, certifications, otherCourses, languages } =
    DEFAULT_PORTFOLIO_DATA;

  useEffect(() => {
    document.title = `${profile.name} · Currículo`;
    document.documentElement.classList.remove('dark');
  }, [profile.name]);

  return (
    <main className="mx-auto max-w-[210mm] bg-paper px-[16mm] py-[14mm] text-[10pt] leading-[1.45] text-ink print:p-0">
      <header>
        <h1 className="display-wide text-[24pt] uppercase leading-none">{profile.name}</h1>
        <p className="mt-2 font-mono text-[9.5pt]">
          {profile.jobTitle} · {profile.seniority} · {profile.location}
        </p>
        <p className="mt-1 font-mono text-[9pt] text-muted">{profile.workMode}</p>
        <p className="mt-1 text-[9.5pt]">
          {profile.email} · {shortUrl(profile.linkedin)} · {shortUrl(profile.github)}
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
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[11pt] font-bold">{exp.company}</h3>
                  <p className="shrink-0 font-mono text-[9pt]">
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
          {featuredProjects.map((item) => (
            <li key={item.id} className="break-inside-avoid">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[11pt] font-bold">{item.name}</h3>
                <p className="shrink-0 font-mono text-[9pt]">{shortUrl(item.repoUrl ?? item.href)}</p>
              </div>
              <p>{item.tagline}</p>
            </li>
          ))}
          <li className="break-inside-avoid">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-[11pt] font-bold">
                {project.name} · {project.language} · {project.version}
              </h3>
              <p className="shrink-0 font-mono text-[9pt]">{shortUrl(project.repoUrl)}</p>
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

      <div className="grid grid-cols-3 gap-6">
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
    </main>
  );
}
