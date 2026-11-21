import { useEffect, type ReactNode } from 'react';
import { CV_DATA } from '../data/cvData';

const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

function CvSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="break-after-avoid border-b border-line pb-1 font-display text-[11pt] font-bold uppercase tracking-wide text-ink">
        {title}
      </h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

export function CvDocument({ embedded = false }: { embedded?: boolean } = {}) {
  useEffect(() => {
    if (embedded) return;
    const prevTitle = document.title;
    const wasDark = document.documentElement.classList.contains('dark');
    document.title = `${CV_DATA.name} · Currículo`;
    document.documentElement.classList.remove('dark');
    return () => {
      document.title = prevTitle;
      if (wasDark) document.documentElement.classList.add('dark');
    };
  }, [embedded]);

  const Wrapper = embedded ? 'div' : 'main';

  return (
    <Wrapper
      className={
        embedded
          ? 'mx-auto max-w-[210mm] border border-line bg-paper px-5 py-6 text-[10pt] leading-[1.45] text-ink shadow-lg sm:px-[16mm] sm:py-[14mm]'
          : 'mx-auto max-w-[210mm] bg-paper px-5 py-6 text-[10pt] leading-[1.45] text-ink sm:px-[16mm] sm:py-[14mm] print:p-0'
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
        <h1 className="font-display text-[22pt] font-bold leading-tight text-ink">{CV_DATA.name}</h1>
        <p className="mt-1 text-[10.5pt] font-medium text-[#1d5fa7]">{CV_DATA.title}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9pt] text-ink-soft">
          <a href={`mailto:${CV_DATA.email}`} className="underline underline-offset-2">
            {CV_DATA.email}
          </a>
          <span aria-hidden="true">|</span>
          <span>{CV_DATA.phone}</span>
          <span aria-hidden="true">|</span>
          <a
            href={CV_DATA.linkedin}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {shortUrl(CV_DATA.linkedin)}
          </a>
          <span aria-hidden="true">|</span>
          <a
            href={CV_DATA.github}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {shortUrl(CV_DATA.github)}
          </a>
          <span aria-hidden="true">|</span>
          <a
            href={CV_DATA.website}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {shortUrl(CV_DATA.website)}
          </a>
          <span aria-hidden="true">|</span>
          <span>{CV_DATA.location}</span>
        </p>
      </header>

      <CvSection title="Resumo Profissional">
        <p>{CV_DATA.summary}</p>
      </CvSection>

      <CvSection title="Experiência Profissional">
        <div className="space-y-4">
          {CV_DATA.experience.map((exp) => (
            <article key={`${exp.company}-${exp.role}`} className="break-inside-avoid">
              <h3 className="text-[10.5pt] font-bold text-ink">
                {exp.company} · {exp.role}
              </h3>
              <p className="text-[9.5pt] italic text-muted">{exp.period}</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                {exp.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </CvSection>

      <CvSection title="Formação Acadêmica">
        <div className="space-y-1">
          {CV_DATA.education.map((edu) => (
            <p key={edu.course}>
              {edu.course} | {edu.institution} ({edu.period})
            </p>
          ))}
        </div>
      </CvSection>

      <CvSection title="Habilidades">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Técnicas:</strong> {CV_DATA.skills.technical.join(', ')}.
          </li>
          <li>
            <strong>Comportamentais:</strong> {CV_DATA.skills.behavioral.join(', ')}.
          </li>
          <li>
            <strong>Idiomas:</strong>{' '}
            {CV_DATA.languages.map((l) => `${l.name} (${l.level})`).join(', ')}.
          </li>
        </ul>
      </CvSection>

      <CvSection title="Certificações">
        <ul className="list-disc space-y-1 pl-5">
          {CV_DATA.certifications.map((cert) => (
            <li key={cert.name}>
              {cert.name} · {cert.issuer} ({cert.year})
            </li>
          ))}
        </ul>
      </CvSection>
    </Wrapper>
  );
}
