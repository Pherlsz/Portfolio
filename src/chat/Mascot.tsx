import { useEffect, useRef, useState } from 'react';
import type { Reasoning } from '../utils/chat';

interface MascotProps {
  reasoning: Reasoning;
  statusText?: string;
}

interface MascotSpec {
  name: string;
  src: string;
  width: number;
  height: number;
  status: string;
}

const MASCOTS: Record<Reasoning, MascotSpec> = {
  fast: { name: 'Tomada', src: '/stickers/tomada.webp', width: 48, height: 44, status: 'Respondendo...' },
  default: { name: 'Morcega', src: '/stickers/morcega.webp', width: 44, height: 48, status: 'Pensando...' },
  high: { name: 'Banguela', src: '/stickers/banguela.webp', width: 48, height: 44, status: 'Pensando com calma' },
};

export default function Mascot({ reasoning, statusText }: MascotProps) {
  const mascot = MASCOTS[reasoning] ?? MASCOTS.default;
  const text = statusText?.trim() || mascot.status;
  const hopRef = useRef<HTMLSpanElement>(null);

  // Populate live region after mount so screen readers announce it.
  const [announced, setAnnounced] = useState('');
  useEffect(() => {
    const id = window.setTimeout(() => setAnnounced(text), 60);
    return () => window.clearTimeout(id);
  }, [text]);

  const hop = () => {
    const el = hopRef.current;
    if (!el) return;
    el.classList.remove('mascot-hop');
    void el.offsetWidth; // Force reflow to restart animation on rapid clicks
    el.classList.add('mascot-hop');
  };

  return (
    <div className="status-in flex items-center gap-3 py-1" data-reasoning={reasoning}>
      <button
        type="button"
        onClick={hop}
        aria-label={`${mascot.name}: clique para fazer pular`}
        className="mascot focus-ring relative -my-1 flex size-14 shrink-0 cursor-pointer flex-col items-center justify-end rounded-control pb-0.5"
        data-mascot={reasoning}
      >
        <span
          ref={hopRef}
          className="mascot-hop-layer"
          onAnimationEnd={(e) => {
            if (e.animationName === 'mascot-hop') e.currentTarget.classList.remove('mascot-hop');
          }}
        >
          <span className="mascot-idle">
            <img
              src={mascot.src}
              width={mascot.width}
              height={mascot.height}
              alt=""
              decoding="async"
              draggable={false}
              className="block select-none"
              style={{ width: mascot.width, height: mascot.height }}
            />
          </span>
        </span>
        <span className="mascot-shadow" aria-hidden="true" />
      </button>

      <div className="flex min-w-0 items-center gap-2">
        <p key={text} aria-hidden="true" className="status-in thinking-shimmer truncate text-ui font-medium">
          {text}
        </p>
        <span className="thinking-dots inline-flex items-center gap-1" aria-hidden="true">
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
        </span>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {announced}
      </span>
    </div>
  );
}
