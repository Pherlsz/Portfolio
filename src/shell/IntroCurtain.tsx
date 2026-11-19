import { useCallback, useEffect, useRef, useState } from 'react';

type CurtainPhase = 'idle' | 'entering' | 'exiting';

const SESSION_KEY = 'pherls:intro-seen';
const COUNT_DURATION_MS = 560;
const EXIT_DURATION_MS = 360;

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

function shouldSkipIntro(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }
  if (!window.matchMedia('(pointer: fine)').matches) {
    return true;
  }
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (connection?.saveData) {
    return true;
  }
  if (
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g' ||
    connection?.effectiveType === '3g'
  ) {
    return true;
  }
  return false;
}

export function IntroCurtain() {
  const [phase, setPhase] = useState<CurtainPhase>('idle');
  const [progress, setProgress] = useState(0);

  const rafRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const phaseRef = useRef<CurtainPhase>('idle');

  const clearTimers = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const beginExit = useCallback(() => {
    if (phaseRef.current !== 'entering') return;
    clearTimers();
    phaseRef.current = 'exiting';
    setPhase('exiting');
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      phaseRef.current = 'idle';
      setPhase('idle');
    }, EXIT_DURATION_MS);
  }, [clearTimers]);

  const startIntro = useCallback(() => {
    if (shouldSkipIntro()) {
      clearTimers();
      phaseRef.current = 'idle';
      setPhase('idle');
      return;
    }

    clearTimers();
    phaseRef.current = 'entering';
    setProgress(0);
    setPhase('entering');

    const startTime = performance.now();

    const tick = (now: number) => {
      if (phaseRef.current !== 'entering') return;
      const elapsed = now - startTime;
      const linear = Math.min(1, elapsed / COUNT_DURATION_MS);
      const eased = 1 - Math.pow(1 - linear, 2.2);
      const nextValue = Math.min(100, Math.round(eased * 100));
      setProgress(nextValue);

      if (linear < 1) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        beginExit();
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
  }, [beginExit, clearTimers]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let alreadySeen = false;
    try {
      alreadySeen = window.sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      alreadySeen = false;
    }

    if (!alreadySeen && !shouldSkipIntro()) {
      try {
        window.sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // Ignore storage write failures in restricted environments.
      }
      startIntro();
    }

    return clearTimers;
  }, [clearTimers, startIntro]);

  useEffect(() => {
    if (phase === 'idle') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        beginExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [beginExit, phase]);

  if (phase === 'idle') {
    return null;
  }

  const formattedProgress = String(progress).padStart(2, '0');

  return (
    <div
      role="presentation"
      data-phase={phase}
      onClick={beginExit}
      className="intro-curtain no-print fixed inset-0 z-[90] flex cursor-pointer flex-col justify-between bg-[#141513] px-6 py-7 text-[#f4f4f0] select-none sm:px-10 sm:py-9"
    >
      <div aria-hidden="true" className="intro-curtain-grain" />

      <div className="relative z-10 flex justify-end">
        <button
          type="button"
          aria-label="Pular abertura"
          onClick={(event) => {
            event.stopPropagation();
            beginExit();
          }}
          className="inline-flex min-h-10 cursor-pointer items-center rounded-pill border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-micro text-[#f4f4f0] transition-[background-color,border-color,color] duration-150 hover:border-[#e7f25a]/60 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7f25a]"
        >
          Pular
        </button>
      </div>

      <div aria-hidden="true" className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <div className="intro-wordmark-rise flex items-baseline">
          <span className="font-display text-[clamp(3.25rem,11vw,7.5rem)] leading-[0.9] font-extrabold tracking-[-0.045em] text-[#f4f4f0]">
            PEDRO
          </span>
          <span className="inline-flex items-baseline font-mono text-[clamp(1.65rem,4.6vw,3.25rem)] leading-none font-medium tracking-[-0.03em] text-[#a8aca3]">
            <span className="relative inline-block">
              <span className="opacity-25">.</span>
              <span className="intro-orb absolute bottom-[0.14em] left-1/2 block size-[0.34em] rounded-full bg-[#e7f25a] shadow-[0_0_24px_rgba(231,242,90,0.45)]" />
            </span>
            <span>md</span>
          </span>
        </div>
      </div>

      <div aria-hidden="true" className="relative z-10 flex flex-col gap-3">
        <div className="flex justify-end">
          <p className="font-display text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[0.88] font-extrabold tracking-[-0.04em] text-[#f4f4f0] tabular-nums">
            {formattedProgress}
          </p>
        </div>

        <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/12">
          <div
            className="h-full w-full origin-left bg-[#e7f25a]"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
      </div>
    </div>
  );
}
