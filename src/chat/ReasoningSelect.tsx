import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import type { Reasoning } from '../utils/chat';

interface ReasoningSelectProps {
  value: Reasoning;
  onChange: (next: Reasoning) => void;
  disabled?: boolean;
}

interface LevelSpec {
  id: Reasoning;
  label: string;
  description: string;
  budget: string;
}

const LEVELS: readonly LevelSpec[] = [
  {
    id: 'fast',
    label: 'Rápido',
    description: 'Direto ao ponto.',
    budget: '450 tokens · 20/min',
  },
  {
    id: 'default',
    label: 'Padrão',
    description: 'Rápido e equilibrado.',
    budget: '600 tokens · 20/min',
  },
  {
    id: 'high',
    label: 'Profundo',
    description: 'Análise detalhada para vagas e código.',
    budget: '900 tokens · 5/min',
  },
];

const indexOf = (value: Reasoning) => Math.max(0, LEVELS.findIndex((l) => l.id === value));

function SignalBars({ level }: { level: number }) {
  return (
    <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
      {[5, 8, 12].map((h, i) => (
        <span
          key={h}
          className={`w-[3px] rounded-full transition-colors duration-150 ${i <= level ? 'bg-ink' : 'bg-border-strong'}`}
          style={{ height: h }}
        />
      ))}
    </span>
  );
}

export default function ReasoningSelect({ value, onChange, disabled = false }: ReasoningSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const popoverId = useId();
  const titleId = useId();
  const descId = useId();

  const index = indexOf(value);
  const level = LEVELS[index];
  const fill = `${(index / (LEVELS.length - 1)) * 100}%`;

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    rangeRef.current?.focus();

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      // Return focus only when the click did not land on something focusable.
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if (!active || active === document.body) triggerRef.current?.focus();
      });
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close(true);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const select = (i: number) => {
    const next = LEVELS[Math.min(LEVELS.length - 1, Math.max(0, i))];
    if (next && next.id !== value) onChange(next.id);
  };

  return (
    <div
      ref={rootRef}
      className="relative inline-flex"
      onBlur={(e) => {
        // Tabbing out of the whole control closes it without stealing focus.
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null) && e.relatedTarget) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="pill-button focus-ring"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={`Raciocínio: ${level.label}`}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <SignalBars level={index} />
        <span>{level.label}</span>
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="surface-popover popover-in absolute bottom-full left-0 z-40 mb-2 w-[min(19rem,calc(100vw-2rem))] p-4"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p id={titleId} className="text-ui font-semibold text-ink">
              Raciocínio
            </p>
            <p className="font-mono text-micro tabular-nums text-muted">{index + 1}/3</p>
          </div>

          <div className="mt-3">
            <input
              ref={rangeRef}
              type="range"
              min={0}
              max={2}
              step={1}
              value={index}
              onChange={(e) => select(Number(e.currentTarget.value))}
              aria-label="Nível de raciocínio"
              aria-valuetext={level.label}
              aria-describedby={descId}
              className="r-slider"
              style={{ '--fill': fill } as CSSProperties}
            />
            <div className="mt-1 grid grid-cols-3 text-ui">
              {LEVELS.map((l, i) => (
                <button
                  key={l.id}
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    select(i);
                    rangeRef.current?.focus();
                  }}
                  className={`rounded-control px-1 py-1.5 font-medium transition-colors duration-150 ${
                    i === 0 ? 'justify-self-start text-left' : i === 2 ? 'justify-self-end text-right' : 'justify-self-center'
                  } ${i === index ? 'text-ink' : 'text-muted hover:text-ink-soft'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div id={descId} className="mt-2 border-t border-border pt-3">
            <p key={level.id} className="status-in text-ui leading-relaxed text-ink-soft">
              {level.description}
            </p>
            <p className="mt-1.5 font-mono text-micro text-muted">{level.budget}</p>
          </div>
        </div>
      )}
    </div>
  );
}
