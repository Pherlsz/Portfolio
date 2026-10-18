import { useEffect, useRef, useState } from 'react';

/** Renders ==marked== spans from portfolio copy. */
export function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split(/==(.+?)==/g).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}
    </>
  );
}

export function SectionHeading({
  id,
  title,
  intro
}: {
  id: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="mb-8 max-w-prose sm:mb-10">
      <h2 id={id} className="display text-[1.5rem] leading-tight text-balance sm:text-[1.75rem]">
        {title}
      </h2>
      {intro ? <p className="mt-3 max-w-prose text-pretty text-ink-soft">{intro}</p> : null}
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
        <span translate="no" className="display break-all text-[clamp(1.2rem,3vw,1.75rem)] underline underline-offset-4">
          {email}
        </span>
        <span className="eyebrow mt-3 block">{copied ? 'Copiado!' : 'Copiar e-mail'}</span>
        <span className="sr-only" aria-live="polite">
          {copied ? 'E-mail copiado' : ''}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'E-mail copiado' : `Copiar ${email}`}
      className={['inline-flex min-h-11 cursor-pointer items-center underline underline-offset-4', className]
        .filter(Boolean)
        .join(' ')}
    >
      {label ? <span>{copied ? 'Copiado' : label}</span> : <span translate="no">{email}</span>}
      <span className="sr-only" aria-live="polite">
        {copied ? 'E-mail copiado' : ''}
      </span>
    </button>
  );
}
