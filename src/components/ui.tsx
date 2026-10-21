import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import { animate, motion, useReducedMotion } from 'motion/react';

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const DEFAULT_SCROLL_OFFSET_PX = 16;

let activeScrollAnimation: { stop: () => void } | null = null;

export function getStickyHeaderOffset(customOffset = DEFAULT_SCROLL_OFFSET_PX): number {
  const header = document.querySelector('header');
  const headerHeight = header ? header.getBoundingClientRect().height : 56;
  return headerHeight + customOffset;
}

export function smoothScrollToSection(targetIdOrHash: string, customOffset = DEFAULT_SCROLL_OFFSET_PX) {
  const id = targetIdOrHash.startsWith('#') ? targetIdOrHash.slice(1) : targetIdOrHash;
  const node = document.getElementById(id);
  if (!node) return;

  activeScrollAnimation?.stop();
  activeScrollAnimation = null;

  const computeTargetTop = () => {
    if (id === 'inicio') return 0;
    const offset = getStickyHeaderOffset(customOffset);
    const rawTop = node.getBoundingClientRect().top + window.scrollY - offset;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(Math.max(0, rawTop), maxScroll);
  };

  const targetTop = computeTargetTop();
  const startTop = window.scrollY;
  const distance = Math.abs(targetTop - startTop);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  history.pushState(null, '', `#${id}`);

  if (reducedMotion || distance < 2) {
    window.scrollTo({ top: targetTop, behavior: 'instant' });
    node.focus({ preventScroll: true });
    return;
  }

  const duration = Math.min(0.85, Math.max(0.42, distance / 2200));

  const cleanupListeners = () => {
    window.removeEventListener('wheel', cancelOnUserInput);
    window.removeEventListener('touchstart', cancelOnUserInput);
    window.removeEventListener('keydown', cancelOnUserInput);
  };

  const cancelOnUserInput = () => {
    activeScrollAnimation?.stop();
    activeScrollAnimation = null;
    cleanupListeners();
  };

  window.addEventListener('wheel', cancelOnUserInput, { passive: true });
  window.addEventListener('touchstart', cancelOnUserInput, { passive: true });
  window.addEventListener('keydown', cancelOnUserInput, { passive: true });

  activeScrollAnimation = animate(0, 1, {
    duration,
    ease: EASE_OUT,
    onUpdate: (progress) => {
      const currentTarget = computeTargetTop();
      const nextTop = startTop + (currentTarget - startTop) * progress;
      window.scrollTo({ top: nextTop, behavior: 'instant' });
    },
    onComplete: () => {
      cleanupListeners();
      activeScrollAnimation = null;
      window.scrollTo({ top: computeTargetTop(), behavior: 'instant' });
      node.focus({ preventScroll: true });
    }
  });
}

export function handleSmoothScrollClick(
  event: MouseEvent<HTMLAnchorElement>,
  targetIdOrHash: string,
  customOffset = DEFAULT_SCROLL_OFFSET_PX
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  event.preventDefault();
  smoothScrollToSection(targetIdOrHash, customOffset);
}

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className = ''
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
    <Reveal className="mb-10 max-w-3xl sm:mb-14">
      <header>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="display mt-2 text-[clamp(2rem,4.2vw,3rem)] leading-[1.02]">
          {title}
        </h2>
        {intro && <p className="mt-4 text-lg text-ink-soft">{intro}</p>}
      </header>
    </Reveal>
  );
}

async function copyEmailToClipboard(email: string) {
  try {
    await navigator.clipboard.writeText(email);
    return true;
  } catch {
    return false;
  }
}

export function CopyEmailButton({
  email,
  label,
  className = ''
}: {
  email: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    const ok = await copyEmailToClipboard(email);
    if (!ok) {
      window.location.href = `mailto:${email}`;
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'E-mail copiado' : `Copiar ${email}`}
      className={['inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap', className].filter(Boolean).join(' ')}
    >
      {copied ? (
        <Check className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <Copy className="size-4 shrink-0" aria-hidden="true" />
      )}
      {label ? <span>{copied ? 'Copiado' : label}</span> : <span translate="no">{email}</span>}
      <span className="sr-only" aria-live="polite">
        {copied ? 'E-mail copiado' : ''}
      </span>
    </button>
  );
}
