import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Renderiza trechos entre ==sinais== com marca-texto. */
export function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split(/==(.+?)==/g).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}
    </>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="mb-10 max-w-3xl sm:mb-14">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="display mt-2 text-[clamp(2rem,4.2vw,3rem)] leading-[1.02]">
        {title}
      </h2>
      {intro && <p className="mt-4 text-lg text-ink-soft">{intro}</p>}
    </header>
  );
}

export function CopyEmailButton({
  email,
  label,
  hint = false,
  className = ''
}: {
  email: string;
  label?: string;
  hint?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  if (hint) {
    return (
      <button type="button" onClick={copy} className={`group text-left ${className}`}>
        <span
          translate="no"
          className="display break-all text-[clamp(1.35rem,3.4vw,2.15rem)] underline decoration-marker decoration-4 underline-offset-8"
        >
          {email}
        </span>
        <span className="eyebrow mt-3 flex items-center gap-2">
          {copied ? 'Copiado!' : 'clique para copiar'}
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        </span>
        <span className="sr-only" aria-live="polite">
          {copied ? 'E-mail copiado' : ''}
        </span>
      </button>
    );
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {label ? <span>{copied ? 'Copiado' : label}</span> : <span translate="no">{email}</span>}
      {copied ? (
        <Check className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <Copy className="size-4 shrink-0" aria-hidden="true" />
      )}
      {!label && <span className="sr-only"> (copiar)</span>}
      <span className="sr-only" aria-live="polite">
        {copied ? 'E-mail copiado' : ''}
      </span>
    </button>
  );
}
