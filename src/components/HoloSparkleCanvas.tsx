import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../utils/stickerHolo';

const GLINT_COUNT = 96;

function seedGlints() {
  return Array.from({ length: GLINT_COUNT }, (_, i) => ({
    x: ((i * 0.137 + 0.11) % 1),
    y: ((i * 0.271 + 0.07) % 1),
    r: 0.55 + (i % 5) * 0.16,
    phase: i * 0.37
  }));
}

/** Light Canvas 2D sparkle (T9). Pauses offscreen / hidden / reduced-motion. */
export function HoloSparkleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const host = canvas.closest<HTMLElement>('[data-holo="true"]');
    if (!host) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const glints = seedGlints();
    let raf = 0;
    let visible = document.visibilityState === 'visible';
    let onscreen = true;

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
      const cell = w / 28;

      for (const glint of glints) {
        const dist = Math.hypot(glint.x - mx, glint.y - my);
        const falloff = Math.max(0, 1 - dist * 1.65);
        const twinkle = reduced ? 0.55 : 0.5 + 0.5 * Math.sin(time * 0.0016 + glint.phase);
        const alpha = (0.18 + falloff * 0.72) * twinkle;
        if (alpha < 0.08) continue;
        ctx.fillStyle = `rgba(255, 246, 220, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(glint.x * w, glint.y * h, glint.r * (cell / 14), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (time: number) => {
      raf = 0;
      if (!visible || !onscreen) return;
      draw(time);
      if (!reduced) raf = requestAnimationFrame(loop);
    };

    draw(0);
    if (!reduced) raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver((entries) => {
      onscreen = entries.some((entry) => entry.isIntersecting);
      if (onscreen && visible && !reduced && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(host);

    const onVisibility = () => {
      visible = document.visibilityState === 'visible';
      if (visible && onscreen && !reduced && !raf) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="holo-sparkle" aria-hidden="true" />;
}
