import { DEFAULT_PORTFOLIO_DATA, skillNames, type Certification } from '../data/portfolioData';
import { SectionHeading } from './ui';

// shortcut: text rows instead of badge images, restore images if a recruiter needs the Credly mark on-page
function CertRow({ cert }: { cert: Certification }) {
  const inner = (
    <>
      <p className="font-semibold">{cert.name}</p>
      <p className="eyebrow mt-1">
        {cert.issuer} · {cert.year}
        {cert.badge.code !== cert.issuer ? ` · ${cert.badge.code}` : ''}
      </p>
    </>
  );

  return (
    <li className="border-t border-line pt-3">
      {cert.href ? (
        <a href={cert.href} target="_blank" rel="noreferrer" className="link block min-h-11 py-1">
          {inner}
        </a>
      ) : (
        inner
      )}
    </li>
  );
}

export function CredentialsSection() {
  const { skills, education, certifications, otherCourses, languages } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section aria-labelledby="formacao-titulo" className="scroll-mt-5 px-5 py-14 sm:px-8 sm:py-20">
      <SectionHeading id="formacao-titulo" title="Formação e stack" />

      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <h3 className="display text-xl">Stack</h3>
          <div className="mt-4 space-y-6">
            {skills.map((group) => (
              <div key={group.name} className="border-t border-line pt-3">
                <h4 className="font-semibold">{group.name}</h4>
                <p className="mt-2 text-ink-soft">{skillNames(group).join(' · ')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          <div>
            <h3 className="display text-xl">Formação</h3>
            <ul className="mt-4 space-y-3">
              {education.map((item) => (
                <li key={item.course} className="border-t border-line pt-3">
                  <p className="font-semibold">{item.course}</p>
                  <p className="eyebrow mt-1">
                    {item.school} · {item.period}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="display text-xl">Certificações</h3>
            <ul className="mt-4 grid gap-3">
              {certifications.map((cert) => (
                <CertRow key={cert.name} cert={cert} />
              ))}
            </ul>
            <p className="mt-4 text-ink-soft">Outros cursos: {otherCourses.join(', ')}.</p>
          </div>

          <div>
            <h3 className="display text-xl">Idiomas</h3>
            <dl className="mt-4 space-y-3">
              {languages.map((item) => (
                <div key={item.code} className="flex flex-wrap justify-between gap-x-4 border-t border-line pt-3">
                  <dt className="font-semibold">{item.name}</dt>
                  <dd className="text-ink-soft">{item.level}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
