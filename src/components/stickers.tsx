import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject
} from 'react';
import { animate, MotionConfig, motion, useDragControls, useMotionValue } from 'motion/react';
import { HoloSparkleCanvas } from './HoloSparkleCanvas';
import { useStickerHoloPointer } from '../utils/holoPointer';
import { holoMaskUrl, isStickerHoloActive, useHoloRoulette } from '../utils/stickerHolo';
import {
  createArrumarArrangement,
  LID_ASPECT,
  LID_LAYOUT,
  type LidSlot
} from '../utils/lidStickerSlots';
import {
  resolveLidCaptionLayout,
  type LidCaptionLayout
} from '../utils/stickerCaptionLayout';
import {
  roomToDragConstraints,
  ZERO_DRAG_CONSTRAINTS,
  type AxisDragConstraints
} from '../utils/stickerDragConstraints';

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

type Slot = LidSlot & { id: StickerId };

const DEFAULT_CAPTION_LAYOUT: LidCaptionLayout = { edge: 'above', align: 'center', shiftX: 0 };

function prefersCoarsePointer() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

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
  holoFoil = false,
  captionLayout = DEFAULT_CAPTION_LAYOUT,
  captionVisible = false,
  bubbleRef
}: {
  id: StickerId;
  reaction: Reaction | null;
  face?: number;
  showCaption?: boolean;
  eager?: boolean;
  holoFoil?: boolean;
  captionLayout?: LidCaptionLayout;
  captionVisible?: boolean;
  bubbleRef?: RefObject<HTMLSpanElement | null>;
}) {
  const def = STICKERS[id];
  const showBubble = Boolean(reaction) || captionVisible;
  return (
    <>
      {(showCaption || reaction) && (
        <span
          ref={bubbleRef}
          className="sticker-bubble"
          data-caption-edge={captionLayout.edge}
          data-caption-align={captionLayout.align}
          data-visible={showBubble ? 'true' : undefined}
          aria-hidden="true"
        >
          {reaction?.text ?? def.caption}
        </span>
      )}
      <span key={reaction?.key} className={`sticker-face-host relative block ${reaction ? def.animation : ''}`}>
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

function applyAxisConstraints(
  constraints: AxisDragConstraints,
  offset: { x: number; y: number },
  deltaX: number,
  deltaY: number
) {
  const nextX = offset.x + deltaX;
  const nextY = offset.y + deltaY;
  return {
    x: Math.min(Math.max(nextX, constraints.left), constraints.right),
    y: Math.min(Math.max(nextY, constraints.top), constraints.bottom)
  };
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
  const maskUrl = holoActive ? holoMaskUrl(slot.id) : undefined;
  const ref = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(slot.rotate);
  const dragged = useRef(false);
  const dragControls = useDragControls();
  const dragConstraints = useRef<AxisDragConstraints>({ ...ZERO_DRAG_CONSTRAINTS }).current;
  const [pressed, setPressed] = useState(false);
  const [captionLayout, setCaptionLayout] = useState<LidCaptionLayout>(DEFAULT_CAPTION_LAYOUT);
  const { reaction, react, face } = useStickerReaction(slot.id);
  useStickerHoloPointer(ref, holoActive);

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

  const syncDragConstraints = () => {
    const space = room();
    if (!space) return;
    const next = roomToDragConstraints(space, { x: x.get(), y: y.get() });
    dragConstraints.left = next.left;
    dragConstraints.right = next.right;
    dragConstraints.top = next.top;
    dragConstraints.bottom = next.bottom;
  };

  const releasePressed = () => setPressed(false);

  useLayoutEffect(() => {
    if (!prefersCoarsePointer()) return;
    const bubble = bubbleRef.current;
    if (!bubble) return;
    bubble.style.setProperty('--caption-clamp-x', `${captionLayout.shiftX}px`);
  }, [captionLayout.shiftX]);

  useLayoutEffect(() => {
    if (!prefersCoarsePointer() || (!pressed && !reaction)) return;
    const measure = () => {
      const lid = lidRef.current;
      const button = ref.current;
      const bubble = bubbleRef.current;
      if (!lid || !button || !bubble) return;
      setCaptionLayout(
        resolveLidCaptionLayout(lid.getBoundingClientRect(), button.getBoundingClientRect(), bubble.getBoundingClientRect())
      );
    };
    measure();
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [pressed, reaction, arrangement, lidRef]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const stopDrag = () => {
      dragControls.stop();
    };
    node.addEventListener('lostpointercapture', stopDrag);
    node.addEventListener('pointercancel', stopDrag);
    return () => {
      node.removeEventListener('lostpointercapture', stopDrag);
      node.removeEventListener('pointercancel', stopDrag);
    };
  }, [dragControls]);

  useEffect(() => {
    if (!arrangement) return;
    const target = arrangement.targets?.[slot.id];
    const lid = lidRef.current?.getBoundingClientRect();
    const space = room();
    if (!target || !lid || !space) {
      void Promise.all([animate(x, 0, SPRING), animate(y, 0, SPRING), animate(rotate, slot.rotate, SPRING)]);
      return;
    }
    const from = slotCenter(slot, slot.id);
    const to = slotCenter(target, slot.id);
    const constraints = roomToDragConstraints(space, { x: x.get(), y: y.get() });
    const deltaX = ((to.x - from.x) / 100) * lid.width;
    const deltaY = ((to.y - from.y) / 100) * lid.height;
    const clamped = applyAxisConstraints(constraints, { x: x.get(), y: y.get() }, deltaX, deltaY);
    void Promise.all([
      animate(x, clamped.x, SPRING),
      animate(y, clamped.y, SPRING),
      animate(rotate, target.rotate, SPRING)
    ]);
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
    const constraints = roomToDragConstraints(space, { x: x.get(), y: y.get() });
    const next = applyAxisConstraints(constraints, { x: x.get(), y: y.get() }, move[0], move[1]);
    x.set(next.x);
    y.set(next.y);
  };

  const holoVars: Record<string, string> = maskUrl ? { '--holo-mask': `url("${maskUrl}")` } : {};

  return (
    <motion.button
      ref={ref}
      type="button"
      drag
      dragControls={dragControls}
      dragConstraints={dragConstraints}
      dragElastic={0}
      dragMomentum={false}
      whileDrag={{ scale: 1.08 }}
      onPointerDown={() => {
        onFront();
        setPressed(true);
        syncDragConstraints();
      }}
      onPointerUp={releasePressed}
      onPointerCancel={releasePressed}
      onLostPointerCapture={releasePressed}
      onDragStart={() => {
        dragged.current = true;
        onFront();
        setPressed(true);
        syncDragConstraints();
      }}
      onDragEnd={() => {
        releasePressed();
        window.setTimeout(() => {
          dragged.current = false;
        });
      }}
      onClick={() => {
        if (dragged.current) return;
        onReact(`${def.caption}: ${react()}`);
      }}
      onKeyDown={nudge}
      aria-label={`${def.caption}. ${def.label}`}
      aria-describedby="tampa-ajuda"
      data-sticker-id={slot.id}
      data-pressed={pressed ? 'true' : undefined}
      data-holo={holoActive ? 'true' : undefined}
      data-holo-state={holoActive ? 'idle' : undefined}
      className="group pointer-events-auto absolute cursor-grab touch-none active:cursor-grabbing"
      style={{
        x,
        y,
        rotate,
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        width: `${slot.w}%`,
        ...holoVars
      }}
    >
      <StickerArt
        id={slot.id}
        reaction={reaction}
        face={face}
        eager
        holoFoil={holoActive}
        captionLayout={captionLayout}
        captionVisible={pressed}
        bubbleRef={bubbleRef}
      />
    </motion.button>
  );
}

/** Compact row layout (% of a shallow tray). LID_LAYOUT stays the source of truth for Arrumar. */
const ROW_LAYOUT: LidSlot[] = [
  { id: 'morcega', x: 1, y: 18, w: 22, rotate: -4 },
  { id: 'banguela', x: 25, y: 14, w: 20, rotate: 6 },
  { id: 'tomada', x: 47, y: 16, w: 22, rotate: 2 },
  { id: 'd20', x: 72, y: 8, w: 20, rotate: 10 }
];

export function StickerLid({ variant = 'lid' }: { variant?: 'lid' | 'row' }) {
  const lidRef = useRef<HTMLDivElement>(null);
  const holo = useHoloRoulette();
  const displaySlots = variant === 'row' ? ROW_LAYOUT : LID_LAYOUT;
  const [order, setOrder] = useState<StickerId[]>(() => displaySlots.map((slot) => slot.id));
  const [arrangement, setArrangement] = useState<Arrangement>(null);
  const [announcement, setAnnouncement] = useState('');

  const bringToFront = (id: StickerId) =>
    setOrder((prev) => (prev[prev.length - 1] === id ? prev : [...prev.filter((i) => i !== id), id]));

  const shuffle = () => {
    const slots = [...displaySlots];
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    const targets = Object.fromEntries(
      displaySlots.map((slot, i) => [slot.id, slots[i]])
    ) as Record<StickerId, Slot>;
    setArrangement({ key: Date.now(), targets });
    setAnnouncement('Stickers embaralhados. Use Tab e as setas para mover cada um.');
  };

  const trayClass =
    variant === 'row'
      ? 'sticker-row-tray relative z-10 aspect-[4/1] w-full max-w-lg'
      : 'notebook relative z-10 aspect-[16/10] w-full';

  return (
    <MotionConfig reducedMotion="user">
      <div className="no-print">
        <div className={trayClass}>
          <div ref={lidRef} className="lid absolute inset-0">
            <ul
              aria-label={
                variant === 'row'
                  ? 'Stickers das gatas e do D20'
                  : 'Stickers colados na tampa do notebook'
              }
              data-sticker-holo={holo.mode === 'none' ? undefined : holo.mode}
            >
              {displaySlots.map((slot) => (
                <li
                  key={slot.id}
                  className="pointer-events-none absolute inset-0"
                  style={{ zIndex: order.indexOf(slot.id) + 1 }}
                >
                  <LidSticker
                    slot={slot}
                    lidRef={lidRef}
                    arrangement={arrangement}
                    holoActive={isStickerHoloActive(holo, slot.id)}
                    onFront={() => bringToFront(slot.id)}
                    onReact={setAnnouncement}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p id="tampa-ajuda" className="eyebrow max-w-md">
            Arraste os stickers ou use as setas. Clique no D20 para rolar.
          </p>
          {variant === 'lid' ? (
            <div className="flex gap-2">
              <button type="button" onClick={shuffle} className="text-link min-h-11 px-1 text-sm">
                Embaralhar
              </button>
              <button
                type="button"
                onClick={() => {
                  setArrangement(createArrumarArrangement(Date.now()));
                  setAnnouncement('Stickers no lugar original.');
                }}
                className="text-link min-h-11 px-1 text-sm"
              >
                Arrumar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setArrangement(createArrumarArrangement(Date.now()));
                setAnnouncement('Stickers no lugar original.');
              }}
              className="text-link min-h-11 px-1 text-sm"
            >
              Arrumar
            </button>
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </div>
    </MotionConfig>
  );
}
