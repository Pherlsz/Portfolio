import { useEffect, useRef, useState } from 'react';
import {
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  MessageSquare,
  Printer,
  X
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import {
  DEFAULT_PORTFOLIO_DATA,
  availabilityLine,
  experienceSpan,
  formatDuration,
  formatPeriod,
  plainText,
  skillNames
} from '../data/portfolioData';
import { t } from '../i18n/pt-BR';

function formatRange(period: string): string {
  return period.replace(/\s+-\s+/g, ' a ');
}

function PdfViewerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="cv-pdf-dialog-title"
      className="m-auto h-[90dvh] w-[min(60rem,calc(100%-2rem))] max-w-none overflow-hidden rounded-sheet border border-border-strong bg-surface p-0 text-ink shadow-pop backdrop:bg-code-bg/70 backdrop:backdrop-blur-xs"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3.5 sm:px-6">
          <div className="min-w-0">
            <h2
              id="cv-pdf-dialog-title"
              className="truncate font-mono text-ui font-semibold text-ink"
            >
              Pedro-Henrique-Lopes-CV.pdf
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={DEFAULT_PORTFOLIO_DATA.profile.cvUrl}
              download
              className="focus-ring pill-button"
            >
              <Download className="size-3.5" aria-hidden="true" />
              <span>Baixar PDF</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar visualizador de PDF"
              className="focus-ring inline-flex size-9 items-center justify-center rounded-pill border border-border bg-surface-soft text-ink-soft transition-colors duration-150 hover:border-border-strong hover:bg-surface-hover hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-canvas">
          {open ? (
            <iframe
              title="Currículo de Pedro Henrique Lopes em PDF"
              src={DEFAULT_PORTFOLIO_DATA.profile.cvUrl}
              className="h-full w-full border-0"
            />
          ) : null}
        </div>
      </div>
    </dialog>
  );
}

export function ExperiencePage({ onAskChat }: { onAskChat: (prompt: string) => void }) {
  const [pdfOpen, setPdfOpen] = useState(false);
  const { profile, experiences, skills, education, languages, otherCourses } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section className="mx-auto w-full max-w-[90rem] px-5 pt-16 pb-10 sm:px-8 lg:px-10 lg:py-10">
      <PageHeader
        title={profile.name}
        subtitle={
          <>
            <p className="text-lead font-medium text-ink-soft">{profile.jobTitle}</p>
            <p className="mt-1 font-mono text-micro text-muted">
              {profile.location} · {profile.status}
            </p>
          </>
        }
        actions={
          <button
            type="button"
            data-cursor="perguntar"
            onClick={() =>
              onAskChat('Faça um resumo objetivo da experiência profissional do Pedro.')
            }
            className="focus-ring inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-pill bg-accent px-4 py-2 text-ui font-semibold text-on-accent transition-opacity duration-150 hover:opacity-90"
          >
            <MessageSquare className="size-4" aria-hidden="true" />
            <span>{t('experience.askCta')}</span>
          </button>
        }
      >
        <p className="max-w-[66ch] text-body text-ink-soft">{plainText(profile.summary)}</p>
        <p className="mt-3 text-ui text-ink-soft">{availabilityLine(profile)}</p>

        <div
          role="toolbar"
          aria-label="Exportar currículo"
          className="mt-6 flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setPdfOpen(true)}
            className="focus-ring pill-button border-border-strong bg-surface"
          >
            <Eye className="size-3.5" aria-hidden="true" />
            <span>{t('experience.previewPdf')}</span>
          </button>
          <a href={profile.cvUrl} download className="focus-ring pill-button">
            <Download className="size-3.5" aria-hidden="true" />
            <span>{t('experience.downloadPdf')}</span>
          </a>
          <a
            href="/cv/Pedro-Henrique-Lopes-CV.docx"
            download
            className="focus-ring pill-button"
          >
            <FileText className="size-3.5" aria-hidden="true" />
            <span>{t('experience.downloadDocx')}</span>
          </a>
          <a
            href="/cv.md"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring pill-button font-mono"
          >
            <FileCode2 className="size-3.5" aria-hidden="true" />
            <span>{t('experience.downloadMd')}</span>
          </a>
          <a
            href="/cv.json"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring pill-button font-mono"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span>{t('experience.downloadJson')}</span>
          </a>
          <a
            href="/cv"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring pill-button"
          >
            <Printer className="size-3.5" aria-hidden="true" />
            <span>Imprimir A4</span>
          </a>
        </div>
      </PageHeader>

      <div className="mt-8 grid gap-6 lg:grid-cols-[200px_1fr] lg:items-start lg:gap-8">
        <aside
          aria-label="Empresas"
          className="lg:sticky lg:top-8 lg:self-start"
        >
          <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-2">
            {experiences.map((exp) => {
              const span = experienceSpan(exp);
              return (
                <a
                  key={exp.id}
                  href={`#exp-${exp.id}`}
                  className="focus-ring card-inset-interactive group block px-3.5 py-2.5 lg:w-full"
                >
                  <span className="block truncate font-display text-ui font-bold text-ink group-hover:underline">
                    {exp.company}
                  </span>
                  <span className="mt-0.5 block font-mono text-micro text-muted tabular-nums">
                    {formatRange(formatPeriod(span.start, span.end))}
                  </span>
                </a>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-6">
          {experiences.map((exp) => {
            const span = experienceSpan(exp);

            return (
              <article
                key={exp.id}
                id={`exp-${exp.id}`}
                className="surface-card scroll-mt-8 border-t-2 border-t-border-strong p-6 sm:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-border pb-4">
                  <div>
                    <h2 className="font-display text-title font-bold tracking-[-0.02em] text-ink">
                      {exp.company}
                    </h2>
                    <p className="mt-0.5 text-ui text-muted">{exp.location}</p>
                  </div>
                  <p className="rounded-control border border-border bg-surface px-3 py-1 font-mono text-micro text-muted tabular-nums sm:rounded-pill">
                    {formatRange(formatPeriod(span.start, span.end))} ·{' '}
                    {formatDuration(span.start, span.end)}
                  </p>
                </div>

                <ol className="mt-4 space-y-1.5 border-l border-border-strong pl-4">
                  {exp.roles.map((role) => (
                    <li
                      key={`${exp.id}-${role.title}`}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
                    >
                      <span className="text-ui font-semibold text-ink">{role.title}</span>
                      <span className="font-mono text-micro text-muted tabular-nums">
                        {formatRange(formatPeriod(role.start, role.end))}
                      </span>
                    </li>
                  ))}
                </ol>

                <p className="mt-4 max-w-[66ch] text-body text-ink-soft">{exp.summary}</p>

                <ul className="mt-5 space-y-3 text-ui leading-relaxed text-ink-soft">
                  {exp.highlights.map((item, idx) => (
                    <li key={idx} className="border-l-2 border-border pl-3.5">
                      {item.metric ? (
                        <strong className="font-semibold text-ink">{item.metric}: </strong>
                      ) : null}
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap gap-1.5 border-t border-border pt-4">
                  {exp.stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-pill border border-border bg-canvas px-2.5 py-0.5 font-mono text-micro text-muted"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="font-display text-lead font-bold tracking-[-0.015em] text-ink">
            {t('experience.skills')}
          </h2>
          <div className="mt-4 space-y-4">
            {skills.map((group) => (
              <div key={group.name}>
                <p className="font-mono text-micro font-medium text-muted">{group.name}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {skillNames(group).map((item) => (
                    <span
                      key={item}
                      className={`rounded-pill px-2.5 py-0.5 text-micro ${
                        group.featured.includes(item)
                          ? 'bg-accent font-medium text-on-accent'
                          : 'border border-border bg-canvas text-ink-soft'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface-card p-6">
            <h2 className="font-display text-lead font-bold tracking-[-0.015em] text-ink">
              {t('experience.education')}
            </h2>
            <div className="mt-4 space-y-3">
              {education.map((edu) => (
                <div key={edu.course}>
                  <p className="text-ui font-semibold text-ink">{edu.course}</p>
                  <p className="mt-0.5 font-mono text-micro text-muted tabular-nums">
                    {edu.school} · {formatRange(edu.period)}
                  </p>
                </div>
              ))}
            </div>
            {otherCourses.length > 0 ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="font-mono text-micro text-muted">Cursos complementares</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {otherCourses.map((course) => (
                    <span
                      key={course}
                      className="rounded-pill border border-border bg-canvas px-2.5 py-0.5 text-micro text-ink-soft"
                    >
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="surface-card p-6">
            <h2 className="font-display text-lead font-bold tracking-[-0.015em] text-ink">
              {t('experience.languages')}
            </h2>
            <ul className="mt-3 divide-y divide-border text-ui">
              {languages.map((lang) => (
                <li
                  key={lang.code}
                  className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="font-semibold text-ink">{lang.name}</span>
                  <span className="text-right text-ui text-muted">{lang.level}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <PdfViewerDialog open={pdfOpen} onClose={() => setPdfOpen(false)} />
    </section>
  );
}
