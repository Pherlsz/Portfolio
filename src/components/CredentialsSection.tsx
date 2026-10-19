import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CertBadge } from './badges';
import { SectionHeading } from './ui';

export function CredentialsSection() {
  const { skills, education, certifications, otherCourses, languages } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section aria-labelledby="formacao-titulo" className="border-t border-line py-10">
      <SectionHeading id="formacao-titulo" eyebrow="Ferramentas, estudo e idiomas" title="Formação e stack" />

      <div className="grid gap-10">
        <div>
          <h3 className="display text-lg">Stack</h3>
          <div className="mt-4 space-y-5">
            {skills.map((group) => (
              <div key={group.name} className="border-t border-line pt-3">
                <h4 className="font-bold">{group.name}</h4>
                <p className="mt-2 text-pretty text-ink-soft">
                  {[...group.featured, ...group.items].join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="display text-lg">Formação</h3>
            <ul className="mt-3 space-y-3">
              {education.map((e) => (
                <li key={e.course} className="border-t border-line pt-3">
                  <p className="font-bold">{e.course}</p>
                  <p className="eyebrow mt-1">
                    {e.school} · {e.period}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="display text-lg">Certificações</h3>
            <ul className="mt-3 grid gap-3">
              {certifications.map((c) => (
                <CertBadge key={c.name} cert={c} />
              ))}
            </ul>
            <p className="mt-4 text-pretty text-[0.9375rem] text-ink-soft">Outros cursos: {otherCourses.join(', ')}.</p>
          </div>

          <div>
            <h3 className="display text-lg">Idiomas</h3>
            <dl className="mt-3 space-y-3">
              {languages.map((l) => (
                <div key={l.code} className="flex flex-wrap justify-between gap-x-4 border-t border-line pt-3">
                  <dt className="font-bold">{l.name}</dt>
                  <dd className="text-ink-soft">{l.level}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
