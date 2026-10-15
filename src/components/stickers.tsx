import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject
} from 'react';
import { animate, MotionConfig, motion, useMotionValue } from 'motion/react';
import {
  HOLO_ELIGIBLE_LID_STICKER_IDS,
  isStickerHoloActive,
  useHoloRoulette
} from '../utils/stickerHolo';

export type StickerId =
  | 'morcega'
  | 'banguela'
  | 'tomada'
  | 'd20'
  | 'typescript'
  | 'react'
  | 'nextjs';

interface StickerDef {
  label: string;
  caption: string;
  src: string;
  /** Tamanho real do arquivo em public/stickers, para reservar espaço sem layout shift. */
  width: number;
  height: number;
  animation: string;
  react: () => string;
}

const STICKERS: Record<StickerId, StickerDef> = {
  morcega: {
    label: 'Sticker da Morcega, a gata mais velha',
    caption: 'Morcega',
    src: '/stickers/morcega.webp',
    width: 290,
    height: 320,
    animation: 'animate-sleep',
    react: () => 'Mrrr… zZz'
  },
  banguela: {
    label: 'Sticker da Banguela, a gata de uma presa só',
    caption: 'Banguela',
    src: '/stickers/banguela.webp',
    width: 320,
    height: 290,
    animation: 'animate-munch',
    react: () => 'Nhac, nhac'
  },
  tomada: {
    label: 'Sticker do Tomada, o gato caçula',
    caption: 'Tomada',
    src: '/stickers/tomada.webp',
    width: 320,
    height: 295,
    animation: 'animate-buzz',
    react: () => '220V!'
  },
  d20: {
    label: 'Sticker de um dado D20 de RPG. Clique para rolar.',
    caption: 'D20',
    src: '/stickers/d20.webp',
    width: 268,
    height: 320,
    animation: 'animate-roll',
    react: () => {
      const roll = 1 + Math.floor(Math.random() * 20);
      if (roll === 20) return '20: crítico!';
      if (roll === 1) return '1: falha crítica';
      return `${roll}`;
    }
  },
  typescript: {
    label: 'Sticker do TypeScript',
    caption: 'TypeScript',
    src: '/stickers/typescript.svg',
    width: 128,
    height: 128,
    animation: 'animate-pop',
    react: () => 'tsc --noEmit'
  },
  react: {
    label: 'Sticker do React',
    caption: 'React',
    src: '/stickers/react.svg',
    width: 128,
    height: 128,
    animation: 'animate-wiggle',
    react: () => 're-render'
  },
  nextjs: {
    label: 'Sticker do Next.js',
    caption: 'Next.js',
    src: '/stickers/nextjs.svg',
    width: 128,
    height: 128,
    animation: 'animate-pop',
    react: () => 'app/'
  }
};

interface Slot {
  id: StickerId;
  x: number;
  y: number;
  w: number;
  rotate: number;
}

/** Largura / altura da tampa unibody (aspect-ratio 16/10). */
const LID_ASPECT = 16 / 10;

/** Posição inicial na tampa, em % da largura (x, w) e da altura (y). */
const LID_LAYOUT: Slot[] = [
  { id: 'morcega', x: 3, y: 12, w: 20, rotate: -5 },
  { id: 'react', x: 83, y: 14, w: 11, rotate: 10 },
  { id: 'banguela', x: 4, y: 58, w: 15, rotate: 7 },
  { id: 'tomada', x: 36, y: 70, w: 22, rotate: 2 },
  { id: 'd20', x: 64, y: 42, w: 13, rotate: 12 },
  { id: 'typescript', x: 81, y: 54, w: 11, rotate: -8 },
  { id: 'nextjs', x: 85, y: 76, w: 10, rotate: 6 }
];

interface Reaction {
  text: string;
  key: number;
}

function parseD20Face(text: string | undefined) {
  const match = text?.match(/^(\d+)/);
  return match ? Number(match[1]) : 20;
}

function useStickerReaction(id: StickerId) {
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [face, setFace] = useState(20);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const react = () => {
    const text = STICKERS[id].react();
    window.clearTimeout(timer.current);
    setReaction({ text, key: Date.now() });
    if (id === 'd20') setFace(parseD20Face(text));
    timer.current = window.setTimeout(() => setReaction(null), 1800);
    return text;
  };

  return { reaction, react, face };
}

function StickerArt({
  id,
  reaction,
  face,
  showCaption = true,
  eager = false,
  holoFoil = false
}: {
  id: StickerId;
  reaction: Reaction | null;
  face?: number;
  showCaption?: boolean;
  eager?: boolean;
  /** Lid-only holographic foil layers (masked to sticker art). */
  holoFoil?: boolean;
}) {
  const def = STICKERS[id];
  return (
    <>
      {(showCaption || reaction) && (
        <span className="sticker-bubble" data-visible={reaction ? 'true' : undefined} aria-hidden="true">
          {reaction?.text ?? def.caption}
        </span>
      )}
      <span key={reaction?.key} className={`sticker-face-host relative block ${reaction ? def.animation : ''}`}>
        <img
          src={def.src}
          width={def.width}
          height={def.height}
          alt=""
          draggable={false}
          decoding="async"
          loading={eager ? 'eager' : 'lazy'}
          className="sticker-art relative z-0 block h-auto w-full select-none"
        />
        {holoFoil && (
          <>
            <span className="sticker-holo-layer sticker-holo-foil" aria-hidden="true" />
            <span className="sticker-holo-layer sticker-holo-shine" aria-hidden="true" />
          </>
        )}
        {id === 'd20' && (
          <span className="d20-face" aria-hidden="true">
            {face ?? 20}
          </span>
        )}
      </span>
    </>
  );
}

export function StaticSticker({ id, className = '' }: { id: StickerId; className?: string }) {
  const { reaction, react, face } = useStickerReaction(id);
  return (
    <button type="button" onClick={react} aria-label={STICKERS[id].label} className={`group relative block ${className}`}>
      <StickerArt id={id} reaction={reaction} face={face} showCaption={false} />
    </button>
  );
}

/** null volta cada sticker ao lugar original; senão cada um vai para o lugar sorteado. */
type Arrangement = { key: number; targets: Record<StickerId, Slot> | null } | null;

const SPRING = { type: 'spring', stiffness: 260, damping: 24 } as const;

/** Centro do sticker no slot, em % da tampa. */
function slotCenter(slot: Slot, id: StickerId) {
  const def = STICKERS[id];
  const height = slot.w * LID_ASPECT * (def.height / def.width);
  return { x: slot.x + slot.w / 2, y: slot.y + height / 2 };
}

function LidSticker({
  slot,
  lidRef,
  arrangement,
  holoActive,
  onFront,
  onReact
}: {
  slot: Slot;
  lidRef: RefObject<HTMLDivElement | null>;
  arrangement: Arrangement;
  holoActive: boolean;
  onFront: () => void;
  onReact: (message: string) => void;
}) {
  const def = STICKERS[slot.id];
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(slot.rotate);
  const dragged = useRef(false);
  const { reaction, react, face } = useStickerReaction(slot.id);

  const room = () => {
    const lid = lidRef.current?.getBoundingClientRect();
    const box = ref.current?.getBoundingClientRect();
    if (!lid || !box) return null;
    return {
      left: lid.left - box.left,
      right: lid.right - box.right,
      up: lid.top - box.top,
      down: lid.bottom - box.bottom
    };
  };

  useEffect(() => {
    if (!arrangement) return;
    const target = arrangement.targets?.[slot.id];
    const lid = lidRef.current?.getBoundingClientRect();
    const space = room();
    if (!target || !lid || !space) {
      animate(x, 0, SPRING);
      animate(y, 0, SPRING);
      animate(rotate, slot.rotate, SPRING);
      return;
    }
    const from = slotCenter(slot, slot.id);
    const to = slotCenter(target, slot.id);
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
    animate(x, clamp(((to.x - from.x) / 100) * lid.width, x.get() + space.left, x.get() + space.right), SPRING);
    animate(y, clamp(((to.y - from.y) / 100) * lid.height, y.get() + space.up, y.get() + space.down), SPRING);
    animate(rotate, target.rotate, SPRING);
  }, [arrangement]);

  const nudge = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 48 : 16;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    const move = moves[event.key];
    const space = move && room();
    if (!move || !space) return;
    event.preventDefault();
    onFront();
    x.set(x.get() + Math.min(Math.max(move[0], space.left), space.right));
    y.set(y.get() + Math.min(Math.max(move[1], space.up), space.down));
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      drag
      dragConstraints={lidRef}
      dragElastic={0.08}
      dragMomentum={false}
      whileDrag={{ scale: 1.08 }}
      onPointerDown={onFront}
      onDragStart={() => {
        dragged.current = true;
        onFront();
      }}
      onDragEnd={() => {
        window.setTimeout(() => {
          dragged.current = false;
        });
      }}
      onClick={() => {
        if (dragged.current) return;
        onReact(`${def.caption}: ${react()}`);
      }}
      onKeyDown={nudge}
      aria-label={def.label}
      aria-describedby="tampa-ajuda"
      data-sticker-id={slot.id}
      data-holo={holoActive ? 'true' : undefined}
      className={`group pointer-events-auto absolute cursor-grab touch-none active:cursor-grabbing${holoActive ? ' sticker-holo' : ''}`}
      style={{
        x,
        y,
        rotate,
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        width: `${slot.w}%`,
        ...(holoActive
          ? ({ '--sticker-holo-mask': `url("${def.src}")` } as CSSProperties)
          : undefined)
      }}
    >
      <StickerArt id={slot.id} reaction={reaction} face={face} eager holoFoil={holoActive} />
    </motion.button>
  );
}

export function StickerLid() {
  const lidRef = useRef<HTMLDivElement>(null);
  // Holo: 1/100/tab all three cats together, or DEV ?holo=1|all — see rollHolo() in stickerHolo.ts
  const holo = useHoloRoulette();
  const [order, setOrder] = useState<StickerId[]>(() => LID_LAYOUT.map((slot) => slot.id));
  const [arrangement, setArrangement] = useState<Arrangement>(null);
  const [announcement, setAnnouncement] = useState('');

  const bringToFront = (id: StickerId) =>
    setOrder((prev) => (prev[prev.length - 1] === id ? prev : [...prev.filter((i) => i !== id), id]));

  const shuffle = () => {
    const slots = [...LID_LAYOUT];
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    const targets = Object.fromEntries(LID_LAYOUT.map((slot, i) => [slot.id, slots[i]])) as Record<StickerId, Slot>;
    setArrangement({ key: Date.now(), targets });
    setAnnouncement('Stickers embaralhados. Use Tab e as setas para mover cada um.');
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="no-print">
      <div className="notebook relative z-10 aspect-[16/10] w-full">
        <div ref={lidRef} className="lid absolute inset-0">
          <ul
            aria-label="Stickers colados na tampa do notebook"
            data-sticker-holo={holo.mode === 'none' ? undefined : holo.mode}
          >
            {LID_LAYOUT.map((slot) => (
              <li
                key={slot.id}
                className="pointer-events-none absolute inset-0"
                style={{ zIndex: order.indexOf(slot.id) + 1 }}
              >
                <LidSticker
                  slot={slot}
                  lidRef={lidRef}
                  arrangement={arrangement}
                  holoActive={isStickerHoloActive(holo, slot.id, HOLO_ELIGIBLE_LID_STICKER_IDS)}
                  onFront={() => bringToFront(slot.id)}
                  onReact={setAnnouncement}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p id="tampa-ajuda" className="eyebrow">
          Arraste os stickers ou use as setas. Clique no D20 para rolar.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={shuffle} className="btn btn-ghost min-h-9 px-4 text-sm">
            Embaralhar
          </button>
          <button
            type="button"
            onClick={() => {
              setArrangement({ key: Date.now(), targets: null });
              setAnnouncement('Stickers no lugar original.');
            }}
            className="btn btn-ghost min-h-9 px-4 text-sm"
          >
            Arrumar
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
    </MotionConfig>
  );
}
