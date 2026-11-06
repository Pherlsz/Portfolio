import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';

/** Mesmo easing de `cubic-bezier(0.23, 1, 0.32, 1)` (easeOutQuint). */
const EASE_OUT_CSS = 'cubic-bezier(0.23, 1, 0.32, 1)';
const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;
const DEFAULT_SCROLL_OFFSET_PX = 16;

let activeScrollAnimation: { stop: () => void } | null = null;

/** Interpola de 0 a 1 em `duration` segundos via rAF, sem depender de biblioteca de animação. */
function tween(duration: number, onUpdate: (progress: number) => void, onComplete: () => void) {
  let frame = 0;
  let stopped = false;
  const start = performance.now();
  const step = (now: number) => {
    if (stopped) return;
    const t = Math.min(1, (now - start) / (duration * 1000));
    onUpdate(easeOutQuint(t));
    if (t < 1) frame = requestAnimationFrame(step);
    else onComplete();
  };
  frame = requestAnimationFrame(step);
  return {
    stop: () => {
      stopped = true;
      cancelAnimationFrame(frame);
    }
  };
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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
  const reducedMotion = prefersReducedMotion();

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

  activeScrollAnimation = tween(duration, (progress) => {
    const currentTarget = computeTargetTop();
    const nextTop = startTop + (currentTarget - startTop) * progress;
    window.scrollTo({ top: nextTop, behavior: 'instant' });
  }, () => {
    cleanupListeners();
    activeScrollAnimation = null;
    window.scrollTo({ top: computeTargetTop(), behavior: 'instant' });
    node.focus({ preventScroll: true });
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
  const ref = useRef<HTMLDivElement>(null);
  const [reduceMotion] = useState(prefersReducedMotion);
  const [shown, setShown] = useState(() => reduceMotion || typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (shown) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shown]);

  const style: CSSProperties | undefined = reduceMotion
    ? undefined
    : {
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : `translateY(${y}px)`,
        transition: `opacity 0.55s ${EASE_OUT_CSS} ${delay}s, transform 0.55s ${EASE_OUT_CSS} ${delay}s`
      };

  return (
    <div ref={ref} data-reveal="" style={style} className={className}>
      {children}
    </div>
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
  title
}: {
  id: string;
  title: string;
}) {
  return (
    <Reveal className="mb-10 max-w-3xl sm:mb-14">
      <header>
        <h2 id={id} className="display text-[clamp(2rem,4.2vw,3rem)] leading-[1.02]">
          {title}
        </h2>
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
