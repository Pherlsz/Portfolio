import { useEffect, useRef, useState } from 'react';

type CursorVariant = 'default' | 'pointer' | 'text' | 'action' | 'grab';

interface CursorState {
  variant: CursorVariant;
  label: string;
}

const INTERACTIVE_SELECTOR =
  'a, button, summary, label[for], [role="button"], [role="link"], [role="tab"], [role="radio"], [role="menuitem"], input[type="range"], input[type="checkbox"], input[type="radio"], select';

const TEXT_SELECTOR =
  'input[type="text"], input[type="email"], input[type="search"], input[type="url"], input[type="password"], input:not([type]), textarea, [contenteditable="true"]';

const GRAB_SELECTOR = '[data-draggable], .cursor-grab, .cursor-grabbing';

function detectCursorState(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) {
    return { variant: 'default', label: '' };
  }

  const actionHost = target.closest<HTMLElement>('[data-cursor]');
  const actionLabel = actionHost?.dataset.cursor?.trim() ?? '';
  if (actionLabel) {
    return { variant: 'action', label: actionLabel };
  }

  if (target.closest(GRAB_SELECTOR)) {
    return { variant: 'grab', label: '' };
  }

  if (target.closest(TEXT_SELECTOR)) {
    return { variant: 'text', label: '' };
  }

  if (target.closest(INTERACTIVE_SELECTOR)) {
    return { variant: 'pointer', label: '' };
  }

  return { variant: 'default', label: '' };
}

export function NarratorOrb() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [flipLeft, setFlipLeft] = useState(false);
  const [cursorState, setCursorState] = useState<CursorState>({
    variant: 'default',
    label: ''
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(false);
  const flipLeftRef = useRef(false);
  const stateRef = useRef<CursorState>({ variant: 'default', label: '' });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const pointerQuery = window.matchMedia('(pointer: fine)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');

    const syncEnabled = () => {
      const next = pointerQuery.matches && !motionQuery.matches && !forcedColorsQuery.matches;
      setEnabled(next);
      if (!next) {
        document.documentElement.removeAttribute('data-custom-cursor');
        visibleRef.current = false;
        setVisible(false);
      }
    };

    syncEnabled();
    pointerQuery.addEventListener('change', syncEnabled);
    motionQuery.addEventListener('change', syncEnabled);
    forcedColorsQuery.addEventListener('change', syncEnabled);

    return () => {
      pointerQuery.removeEventListener('change', syncEnabled);
      motionQuery.removeEventListener('change', syncEnabled);
      forcedColorsQuery.removeEventListener('change', syncEnabled);
      document.documentElement.removeAttribute('data-custom-cursor');
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.documentElement.setAttribute('data-custom-cursor', 'on');

    const move = (x: number, y: number) => {
      const el = rootRef.current;
      if (el) {
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    const setCursorVisible = (next: boolean) => {
      if (visibleRef.current !== next) {
        visibleRef.current = next;
        setVisible(next);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
        document.documentElement.removeAttribute('data-custom-cursor');
        setCursorVisible(false);
        return;
      }

      // Restore native cursor over iframes or open modal <dialog> top-layer elements
      if (
        event.target instanceof HTMLIFrameElement ||
        (event.target instanceof Element && event.target.closest('dialog[open]'))
      ) {
        document.documentElement.removeAttribute('data-custom-cursor');
        setCursorVisible(false);
        return;
      }

      if (!document.documentElement.hasAttribute('data-custom-cursor')) {
        document.documentElement.setAttribute('data-custom-cursor', 'on');
      }

      move(event.clientX, event.clientY);
      setCursorVisible(true);

      const nearRightEdge = event.clientX > window.innerWidth - 150;
      if (nearRightEdge !== flipLeftRef.current) {
        flipLeftRef.current = nearRightEdge;
        setFlipLeft(nearRightEdge);
      }

      const next = detectCursorState(event.target);
      if (next.variant !== stateRef.current.variant || next.label !== stateRef.current.label) {
        stateRef.current = next;
        setCursorState(next);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
        return;
      }
      setPressed(true);
    };

    const handlePointerUp = () => {
      setPressed(false);
    };

    const handleMouseOut = (event: MouseEvent) => {
      if (event.relatedTarget === null) {
        setCursorVisible(false);
        setPressed(false);
      }
    };

    const handleBlur = () => {
      setCursorVisible(false);
      setPressed(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('blur', handleBlur);
      document.documentElement.removeAttribute('data-custom-cursor');
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  const { variant, label } = cursorState;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-variant={variant}
      data-pressed={pressed ? 'true' : 'false'}
      className={`custom-cursor pointer-events-none fixed top-0 left-0 z-[9999] will-change-transform transition-opacity duration-120 ease-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ transform: 'translate3d(-100px, -100px, 0)' }}
    >
        <div
          className={`origin-top-left transition-transform duration-120 ease-out ${
            pressed ? 'scale-[0.88]' : 'scale-100'
          }`}
        >
          {(variant === 'default' || variant === 'action') && (
            /* High-contrast geometric arrow: exact (0,0) tip, white outer halo + charcoal stroke + lime/dark core */
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              className="-translate-x-[2px] -translate-y-[2px] drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.3)]"
            >
              {/* Outer light halo for guaranteed contrast on dark surfaces */}
              <path
                d="M2.5 2L17.8 9.8L11 11.8L8.6 18.8L2.5 2Z"
                stroke="#ffffff"
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
              {/* Main shape */}
              <path
                d="M2.5 2L17.8 9.8L11 11.8L8.6 18.8L2.5 2Z"
                fill={variant === 'action' ? 'var(--lime)' : '#141513'}
                stroke="#141513"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {variant === 'pointer' && (
            /* Accessible geometric pointing hand: fingertip sits at (0,0) so underlying icons stay 100% visible */
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="-translate-x-[6.5px] -translate-y-[2px] drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.28)]"
            >
              {/* Outer white halo */}
              <path
                d="M7.5 3.2C7.5 2.4 8.2 1.8 9 1.8C9.8 1.8 10.5 2.4 10.5 3.2V10.2H11.5C12.3 10.2 13 10.8 13 11.6V11.2C13 10.4 13.7 9.8 14.5 9.8C15.3 9.8 16 10.4 16 11.2V11.8C16 11 16.7 10.4 17.5 10.4C18.3 10.4 19 11 19 11.8V15.5C19 18.8 16.4 21.2 13.1 21.2H11.2C8.9 21.2 7.1 19.9 6.1 17.9L3.9 13.7C3.5 13 3.7 12.1 4.4 11.7C5.1 11.3 6 11.6 6.4 12.3L7.5 14V3.2Z"
                stroke="#ffffff"
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
              {/* Lime fill + crisp charcoal outline */}
              <path
                d="M7.5 3.2C7.5 2.4 8.2 1.8 9 1.8C9.8 1.8 10.5 2.4 10.5 3.2V10.2H11.5C12.3 10.2 13 10.8 13 11.6V11.2C13 10.4 13.7 9.8 14.5 9.8C15.3 9.8 16 10.4 16 11.2V11.8C16 11 16.7 10.4 17.5 10.4C18.3 10.4 19 11 19 11.8V15.5C19 18.8 16.4 21.2 13.1 21.2H11.2C8.9 21.2 7.1 19.9 6.1 17.9L3.9 13.7C3.5 13 3.7 12.1 4.4 11.7C5.1 11.3 6 11.6 6.4 12.3L7.5 14V3.2Z"
                fill="var(--lime)"
                stroke="#141513"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {variant === 'text' && (
            /* High-contrast dual-halo I-beam for inputs & textareas */
            <svg
              width="16"
              height="24"
              viewBox="0 0 16 24"
              fill="none"
              className="-translate-x-1/2 -translate-y-1/2"
            >
              <path
                d="M4.5 3H11.5M8 3V21M4.5 21H11.5"
                stroke="#ffffff"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M4.5 3H11.5M8 3V21M4.5 21H11.5"
                stroke="#141513"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}

          {variant === 'grab' && (
            /* Dual-contrast 4-way move crosshair for draggable canvas nodes */
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              className="-translate-x-1/2 -translate-y-1/2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]"
            >
              <path
                d="M11 2.5V19.5M2.5 11H19.5M11 2.5L8.2 5.3M11 2.5L13.8 5.3M11 19.5L8.2 16.7M11 19.5L13.8 16.7M2.5 11L5.3 8.2M2.5 11L5.3 13.8M19.5 11L16.7 8.2M19.5 11L16.7 13.8"
                stroke="#ffffff"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 2.5V19.5M2.5 11H19.5M11 2.5L8.2 5.3M11 2.5L13.8 5.3M11 19.5L8.2 16.7M11 19.5L13.8 16.7M2.5 11L5.3 8.2M2.5 11L5.3 13.8M19.5 11L16.7 8.2M19.5 11L16.7 13.8"
                stroke="#141513"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {variant === 'action' && (
            /* Offset contextual pill below-right (flips left near right edge), never covering the icon/element */
            <div
              className={`absolute top-5 flex items-center gap-1.5 rounded-pill border border-white/25 bg-[#141513] px-2.5 py-1 text-[#f4f4f0] shadow-float ${
                flipLeft ? 'right-3' : 'left-4'
              }`}
            >
              <span className="size-1.5 shrink-0 rounded-full bg-[#e7f25a]" />
              <span className="font-mono text-micro font-semibold uppercase leading-none tracking-[0.06em] whitespace-nowrap">
                {label}
              </span>
            </div>
          )}
        </div>
      </div>
  );
}
