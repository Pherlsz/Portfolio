import { useEffect, useRef } from 'react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';

export function CvPreviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
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

  useEffect(() => {
    if (!open) return;
    const onBlur = () => {
      window.setTimeout(() => {
        const dialog = dialogRef.current;
        if (dialog?.open && document.activeElement === frameRef.current) dialog.focus();
      }, 0);
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
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
            Visualização do PDF. Baixar PDF salva este mesmo arquivo.
          </p>
        </div>
        <div className="flex min-h-11 items-center gap-4">
          <a
            href={profile.cvUrl}
            download="Pedro-Henrique-Lopes-CV.pdf"
            className="cta cta-primary min-h-11"
          >
            Baixar PDF
          </a>
          <button
            ref={closeRef}
            type="button"
            onClick={requestClose}
            aria-label="Fechar prévia"
            className="link min-h-11 px-1"
          >
            Fechar
          </button>
        </div>
      </header>
      <iframe
        ref={frameRef}
        title="Currículo de Pedro Henrique Lopes em PDF"
        src={`${profile.cvUrl}#navpanes=0&view=FitH`}
        className="min-h-0 w-full flex-1 border-0 bg-ink"
      />
    </dialog>
  );
}
