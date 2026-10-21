import { ArrowUpRight, X } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { getSkillUsage } from '../utils/skillUsage';
import { CertBadge, SkillBadge } from './badges';
import { handleSmoothScrollClick, Reveal, SectionHeading } from './ui';

export function CredentialsSection({
  selectedSkill,
  onSelectSkill
}: {
  selectedSkill: string | null;
  onSelectSkill: (skill: string | null) => void;
}) {
  const { skills, education, certifications, otherCourses, languages } = DEFAULT_PORTFOLIO_DATA;
  const activeEvidence = selectedSkill ? getSkillUsage(selectedSkill) : [];

  const toggleSkill = (name: string) => {
    onSelectSkill(selectedSkill === name ? null : name);
  };

  return (
    <section
      aria-labelledby="formacao-titulo"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-28"
    >
      <SectionHeading id="formacao-titulo" eyebrow="Ferramentas, estudo e idiomas" title="Formação e stack" />

      <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Reveal className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 className="display text-xl">Stack</h3>
              <p className="mt-1 text-sm text-ink-soft">
                Clique em qualquer tecnologia para ver onde ela foi aplicada na prática.
              </p>
            </div>
            {selectedSkill && (
              <button
                type="button"
                onClick={() => onSelectSkill(null)}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 border border-line bg-surface px-2.5 py-1 font-mono text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                <span>Limpar: {selectedSkill}</span>
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </Reveal>

          {selectedSkill && (
            <div
              role="region"
              aria-live="polite"
              aria-label={`Aplicações práticas de ${selectedSkill}`}
              className="mt-5 rounded-2xl border border-ink bg-surface p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Onde utilizei na prática</p>
                  <h4 className="display mt-0.5 text-lg">
                    <mark className="bg-marker px-1.5 py-0.5 text-on-marker">{selectedSkill}</mark>
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectSkill(null)}
                  aria-label="Fechar filtro de tecnologia"
                  className="icon-btn size-9 shrink-0"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              {activeEvidence.length > 0 ? (
                <ul className="mt-4 divide-y divide-line">
                  {activeEvidence.map((item) => (
                    <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <span className="font-bold text-ink">{item.title}</span>
                          <span className="eyebrow ml-2">{item.subtitle}</span>
                        </div>
                        {item.sectionId !== 'formacao' && (
                          <a
                            href={`#${item.sectionId}`}
                            onClick={(event) => handleSmoothScrollClick(event, item.sectionId)}
                            className="link inline-flex items-center gap-1 font-mono text-xs font-semibold text-ink"
                          >
                            {item.sectionId === 'experiencia' ? 'Ver na Experiência' : 'Ver nos Projetos'}
                            <ArrowUpRight className="size-3.5" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                      <ul className="mt-1.5 space-y-1 text-sm text-ink-soft">
                        {item.details.map((detail) => (
                          <li key={detail} className="flex gap-2">
                            <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-current" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          <div className="mt-5 grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {skills.map((group, index) => (
              <Reveal key={group.name} delay={index * 0.06} className="border-t border-line pt-4">
                <h4 className="font-bold">{group.name}</h4>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {group.featured.map((item) => {
                    const hasUsage = getSkillUsage(item).length > 0;
                    return (
                      <SkillBadge
                        key={item}
                        name={item}
                        active={selectedSkill === item}
                        onSelect={hasUsage ? toggleSkill : undefined}
                      />
                    );
                  })}
                </ul>
                <ul className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.9375rem] text-ink-soft">
                  {group.items.map((item, idx) => {
                    const isActive = selectedSkill === item;
                    const hasUsage = getSkillUsage(item).length > 0;
                    return (
                      <li key={item} className="inline-flex items-center">
                        {hasUsage ? (
                          <button
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => toggleSkill(item)}
                            className={`cursor-pointer rounded-xs px-1 -mx-1 transition-colors ${
                              isActive
                                ? 'bg-marker text-on-marker'
                                : 'underline decoration-line underline-offset-4 hover:decoration-ink hover:text-ink'
                            }`}
                          >
                            {item}
                          </button>
                        ) : (
                          <span>{item}</span>
                        )}
                        {idx < group.items.length - 1 ? (
                          <span aria-hidden="true" className="ml-1.5 text-muted">
                            ·
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
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
