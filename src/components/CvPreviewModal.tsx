import { useEffect, useRef } from 'react';
import { Download, Printer, X } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CvDocument } from './CvDocument';

export function CvPreviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      closeRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const requestClose = () => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    else onClose();
  };

  return (
    <dialog
      id="cv-preview"
      ref={dialogRef}
      aria-labelledby="cv-preview-titulo"
      aria-describedby="cv-preview-desc"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) requestClose();
      }}
      className="cv-preview no-print"
      tabIndex={-1}
    >
      <header className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
        <div className="min-w-0">
          <h2 id="cv-preview-titulo" className="display text-xl leading-none">
            Currículo
          </h2>
          <p id="cv-preview-desc" className="mt-1 text-sm text-ink-soft">
            Gerado dos mesmos dados do portfólio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/cv"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost min-h-11 px-3 text-sm"
          >
            <Printer className="size-4" aria-hidden="true" />
            Imprimir / A4
          </a>
          <a
            href={profile.cvUrl}
            download="Pedro-Henrique-Lopes-CV.pdf"
            className="cta cta-primary min-h-11 flex-1 justify-center px-4 sm:flex-none"
          >
            <Download className="size-4" aria-hidden="true" />
            Baixar PDF
          </a>
          <button
            ref={closeRef}
            type="button"
            onClick={requestClose}
            aria-label="Fechar prévia"
            className="icon-btn shrink-0"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-surface p-3 sm:p-6">
        <CvDocument embedded />
      </div>
    </dialog>
  );
}
