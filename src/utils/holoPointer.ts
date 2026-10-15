import { useEffect, type RefObject } from 'react';
import { prefersReducedMotion } from './stickerHolo';

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function applyPointer(el: HTMLElement, clientX: number, clientY: number, rect: DOMRect): void {
  const mx = clamp01((clientX - rect.left) / Math.max(rect.width, 1));
  const my = clamp01((clientY - rect.top) / Math.max(rect.height, 1));
  const hyp = Math.min(1, Math.hypot(mx - 0.5, my - 0.5) * 2);
  el.style.setProperty('--mx', mx.toFixed(3));
  el.style.setProperty('--my', my.toFixed(3));
  el.style.setProperty('--hyp', hyp.toFixed(3));
  el.dataset.holoState = 'tilt';
}

function setIdle(el: HTMLElement): void {
  el.dataset.holoState = 'idle';
  el.style.removeProperty('--mx');
  el.style.removeProperty('--my');
  el.style.removeProperty('--hyp');
}

/**
 * Pointer-relative --mx/--my/--hyp on each holographic sticker.
 * Hover and mouse-drag both enter `tilt` (3D + strong foil). Touch skips tilt.
 */
export function useStickerHoloPointer(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;

    let rect = el.getBoundingClientRect();
    let frame = 0;
    let dragging = false;
    let active = false;

    const cacheRect = () => {
      rect = el.getBoundingClientRect();
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      if (frame) return;
      const { clientX, clientY } = event;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (dragging) cacheRect();
        applyPointer(el, clientX, clientY, rect);
      });
    };

    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      cacheRect();
      active = true;
      applyPointer(el, event.clientX, event.clientY, rect);
    };

    const onLeave = () => {
      if (dragging) return;
      active = false;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      setIdle(el);
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      dragging = true;
      cacheRect();
      applyPointer(el, event.clientX, event.clientY, rect);
    };

    const onUp = (event: PointerEvent) => {
      dragging = false;
      cacheRect();
      const over =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!over) {
        active = false;
        setIdle(el);
      }
    };

    setIdle(el);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    window.addEventListener('resize', cacheRect);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      window.removeEventListener('resize', cacheRect);
      setIdle(el);
    };
  }, [enabled, ref]);
}
