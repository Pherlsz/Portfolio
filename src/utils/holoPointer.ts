import { useEffect, type RefObject } from 'react';
import { prefersReducedMotion } from './stickerHolo';

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * One passive pointermove on the lid. Writes --mx/--my on the holo container
 * (inherited by hosts). No getBoundingClientRect inside the rAF.
 */
export function useHoloPointer(lidRef: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    if (prefersReducedMotion()) return;
    const root = lidRef.current;
    if (!root) return;

    const container = root.querySelector<HTMLElement>('[data-sticker-holo]');
    const target = container ?? root;
    let rect = target.getBoundingClientRect();
    let frame = 0;

    const cacheRect = () => {
      rect = target.getBoundingClientRect();
    };

    const setIdle = () => {
      target.dataset.holoState = 'idle';
      target.style.removeProperty('--mx');
      target.style.removeProperty('--my');
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      if (frame) return;
      const { clientX, clientY } = event;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const mx = clamp01((clientX - rect.left) / Math.max(rect.width, 1));
        const my = clamp01((clientY - rect.top) / Math.max(rect.height, 1));
        target.style.setProperty('--mx', mx.toFixed(3));
        target.style.setProperty('--my', my.toFixed(3));
        target.dataset.holoState = 'tilt';
      });
    };

    const onLeave = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      setIdle();
    };

    setIdle();
    target.addEventListener('pointerenter', cacheRect);
    target.addEventListener('pointermove', onMove, { passive: true });
    target.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', cacheRect);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      target.removeEventListener('pointerenter', cacheRect);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', cacheRect);
      setIdle();
    };
  }, [enabled, lidRef]);
}
