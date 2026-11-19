import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CertBadge, SkillBadge } from './badges';
import { Reveal, SectionHeading } from './ui';

export function CredentialsSection() {
  const { skills, education, certifications, otherCourses, languages } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section
      aria-labelledby="formacao-titulo"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-28"
    >
      <SectionHeading id="formacao-titulo" title="Formação e stack" />

      <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Reveal>
            <h3 className="display text-xl">Stack</h3>
          </Reveal>

          <div className="mt-5 grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {skills.map((group, index) => (
              <Reveal key={group.name} delay={index * 0.06} className="border-t border-line pt-4">
                <h4 className="font-bold">{group.name}</h4>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {group.featured.map((item) => (
                    <SkillBadge key={item} name={item} />
                  ))}
                </ul>
                <ul className="mt-3 flex flex-wrap items-center gap-1.5 text-[0.875rem] text-ink-soft">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="border border-line bg-surface/60 px-2 py-0.5 font-mono text-xs"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          <Reveal delay={0.05}>
            <h3 className="display text-xl">Formação</h3>
            <ul className="mt-4 space-y-3">
              {education.map((e) => (
                <li key={e.course} className="border-t border-line pt-4">
                  <p className="font-bold">{e.course}</p>
                  <p className="eyebrow mt-1">
                    {e.school} · {e.period}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <h3 className="display text-xl">Certificações</h3>
            <ul className="mt-4 grid gap-3">
              {certifications.map((c) => (
                <CertBadge key={c.name} cert={c} />
              ))}
            </ul>
            <p className="mt-4 text-[0.9375rem] text-ink-soft">Outros cursos: {otherCourses.join(', ')}.</p>
          </Reveal>

          <Reveal delay={0.15}>
            <h3 className="display text-xl">Idiomas</h3>
            <dl className="mt-4 space-y-3">
              {languages.map((l) => (
                <div key={l.code} className="flex flex-wrap justify-between gap-x-4 border-t border-line pt-3">
                  <dt className="font-bold">{l.name}</dt>
                  <dd className="text-ink-soft">{l.level}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
