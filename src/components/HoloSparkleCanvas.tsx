import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../utils/stickerHolo';

const GLINT_COUNT = 56;

function seedGlints() {
  return Array.from({ length: GLINT_COUNT }, (_, i) => ({
    x: (i * 0.173 + 0.09) % 1,
    y: (i * 0.311 + 0.05) % 1,
    r: 0.7 + (i % 4) * 0.22,
    phase: i * 0.41
  }));
}

/** Sparse Canvas 2D sparkle. rAF only while on-screen, visible, and tilting. */
export function HoloSparkleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const host = canvas.closest<HTMLElement>('[data-holo="true"]');
    if (!host) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    if (prefersReducedMotion()) return;

    const glints = seedGlints();
    let raf = 0;
    let visible = document.visibilityState === 'visible';
    let onscreen = true;

    const tilting = () =>
      host.closest('[data-sticker-holo]')?.getAttribute('data-holo-state') === 'tilt';

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(box.width * dpr));
      const h = Math.max(1, Math.round(box.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const draw = (time: number) => {
      resize();
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const cs = getComputedStyle(host);
      const mx = Number.parseFloat(cs.getPropertyValue('--mx')) || 0.5;
      const my = Number.parseFloat(cs.getPropertyValue('--my')) || 0.5;
      const size = Math.max(w, h);

      for (const glint of glints) {
        const dist = Math.hypot(glint.x - mx, glint.y - my);
        const falloff = Math.max(0, 1 - dist * 2.1);
        const twinkle = 0.45 + 0.55 * Math.sin(time * 0.0014 + glint.phase);
        const alpha = (0.08 + falloff * 0.42) * twinkle;
        if (alpha < 0.1) continue;
        ctx.fillStyle = `rgba(255, 250, 240, ${alpha})`;
        ctx.beginPath();
        ctx.arc(glint.x * w, glint.y * h, glint.r * (size / 420), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (time: number) => {
      raf = 0;
      if (!visible || !onscreen || !tilting()) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      draw(time);
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver((entries) => {
      onscreen = entries.some((entry) => entry.isIntersecting);
      if (onscreen && visible && tilting() && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(host);

    const onVisibility = () => {
      visible = document.visibilityState === 'visible';
      if (visible && onscreen && tilting() && !raf) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', onVisibility);

    const mo = new MutationObserver(() => {
      if (tilting() && visible && onscreen && !raf) raf = requestAnimationFrame(loop);
    });
    const root = host.closest('[data-sticker-holo]');
    if (root) mo.observe(root, { attributes: true, attributeFilter: ['data-holo-state'] });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="holo-sparkle" aria-hidden="true" />;
}
