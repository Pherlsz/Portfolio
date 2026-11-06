import { useEffect, useRef, useState } from 'react';
import { HoloSparkleCanvas } from './HoloSparkleCanvas';
import type { LidSlotId } from '../utils/lidStickerSlots';

export type StickerId = LidSlotId;

export interface StickerDef {
  label: string;
  src: string;
  /** Tamanho real do arquivo em public/stickers, para reservar espaço sem layout shift. */
  width: number;
  height: number;
  animation: string;
}

export const STICKERS: Record<StickerId, StickerDef> = {
  morcega: {
    label: 'Sticker da Morcega, a gata mais velha',
    src: '/stickers/morcega.webp',
    width: 290,
    height: 320,
    animation: 'animate-sleep'
  },
  banguela: {
    label: 'Sticker da Banguela, a gata de uma presa só',
    src: '/stickers/banguela.webp',
    width: 320,
    height: 290,
    animation: 'animate-munch'
  },
  tomada: {
    label: 'Sticker do Tomada, o gato caçula',
    src: '/stickers/tomada.webp',
    width: 320,
    height: 295,
    animation: 'animate-buzz'
  },
  d20: {
    label: 'Sticker de um dado D20 de RPG. Clique para rolar.',
    src: '/stickers/d20.webp',
    width: 268,
    height: 320,
    animation: 'animate-roll'
  },
  typescript: {
    label: 'Sticker do TypeScript',
    src: '/stickers/typescript.svg',
    width: 128,
    height: 128,
    animation: 'animate-pop'
  },
  react: {
    label: 'Sticker do React',
    src: '/stickers/react.svg',
    width: 128,
    height: 128,
    animation: 'animate-wiggle'
  },
  nextjs: {
    label: 'Sticker do Next.js',
    src: '/stickers/nextjs.svg',
    width: 128,
    height: 128,
    animation: 'animate-pop'
  }
};

export function useStickerReaction(id: StickerId) {
  const [reactionKey, setReactionKey] = useState<number | null>(null);
  const [face, setFace] = useState(20);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const react = () => {
    window.clearTimeout(timer.current);
    setReactionKey(Date.now());
    if (id === 'd20') {
      setFace(1 + Math.floor(Math.random() * 20));
    }
    timer.current = window.setTimeout(() => setReactionKey(null), 1800);
  };

  return { reactionKey, react, face };
}

export function StickerArt({
  id,
  reactionKey,
  face,
  eager = false,
  holoFoil = false
}: {
  id: StickerId;
  reactionKey: number | null;
  face?: number;
  eager?: boolean;
  holoFoil?: boolean;
}) {
  const def = STICKERS[id];
  return (
    <span key={reactionKey} className={`sticker-face-host relative block ${reactionKey ? def.animation : ''}`}>
      <span className={holoFoil ? 'sticker-holo-stage' : 'block'}>
        {holoFoil && <span className="holo-foil" aria-hidden="true" />}
        <img
          src={def.src}
          width={def.width}
          height={def.height}
          alt=""
          draggable={false}
          decoding="async"
          loading={eager ? 'eager' : 'lazy'}
          className="sticker-art relative z-[1] block h-auto w-full select-none"
        />
        {holoFoil && (
          <>
            <span className="holo-sheen" aria-hidden="true" />
            <span className="holo-edge" aria-hidden="true" />
            <HoloSparkleCanvas />
          </>
        )}
      </span>
      {id === 'd20' && (
        <span className="d20-face" aria-hidden="true">
          {face ?? 20}
        </span>
      )}
    </span>
  );
}

export function StaticSticker({ id, className = '' }: { id: StickerId; className?: string }) {
  const { reactionKey, react, face } = useStickerReaction(id);
  return (
    <button type="button" onClick={react} aria-label={STICKERS[id].label} className={`group relative block ${className}`}>
      <StickerArt id={id} reactionKey={reactionKey} face={face} />
    </button>
  );
}
