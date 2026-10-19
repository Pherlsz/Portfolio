import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject
} from 'react';
import {
  animate,
  MotionConfig,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion
} from 'motion/react';
import { HoloSparkleCanvas } from './HoloSparkleCanvas';
import { useStickerHoloPointer } from '../utils/holoPointer';
import { holoMaskUrl, isStickerHoloActive, useHoloRoulette } from '../utils/stickerHolo';
import {
  localPadded,
  playableRect,
  relayoutForWidth,
  scatterStickers,
  stickerBox,
  STICKER_ORDER,
  TEXT_PAD,
  type LidSlotId,
  type ScatterSlot
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

export type StickerId = LidSlotId;

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

const SPRING = { type: 'spring', stiffness: 260, damping: 24 } as const;

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
  holoActive,
  onFront,
  onReact,
  onOffset,
  onSettle
}: {
  slot: ScatterSlot;
  lidRef: RefObject<HTMLDivElement | null>;
  holoActive: boolean;
  onFront: () => void;
  onReact: (message: string) => void;
  onOffset: (id: StickerId, x: number, y: number) => void;
  onSettle: (id: StickerId, x: number, y: number) => void;
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
  const reduceMotion = useReducedMotion() === true;
  const baseRotate = useRef(slot.rotate);
  useStickerHoloPointer(ref, holoActive);

  useLayoutEffect(() => {
    x.set(0);
    y.set(0);
    rotate.set(slot.rotate);
    baseRotate.current = slot.rotate;
  }, [slot.x, slot.y, slot.rotate, rotate, x, y]);

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
  }, [pressed, reaction, lidRef]);

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
    onSettle(slot.id, slot.x + next.x, slot.y + next.y);
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
      whileDrag={reduceMotion ? undefined : { scale: 1.06 }}
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
        baseRotate.current = rotate.get();
      }}
      onDrag={(_event, info) => {
        onOffset(slot.id, x.get(), y.get());
        if (reduceMotion) return;
        const extra = Math.max(-14, Math.min(14, info.velocity.x / 160));
        rotate.set(baseRotate.current + extra);
      }}
      onDragEnd={() => {
        releasePressed();
        onSettle(slot.id, slot.x + x.get(), slot.y + y.get());
        if (reduceMotion) {
          rotate.set(baseRotate.current);
        } else {
          void animate(rotate, baseRotate.current, SPRING);
        }
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
      data-pressed={pressed ? 'true' : undefined}
      data-holo={holoActive ? 'true' : undefined}
      data-holo-state={holoActive ? 'idle' : undefined}
      className="group pointer-events-auto absolute flex cursor-grab touch-none items-center justify-center active:cursor-grabbing"
      style={{
        x,
        y,
        rotate,
        left: slot.x,
        top: slot.y,
        width: slot.w,
        height: slot.h,
        ...holoVars
      }}
    >
      <span className="block" style={{ width: slot.artW }}>
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
      </span>
    </motion.button>
  );
}

function measureForbidden(field: DOMRectReadOnly) {
  const identity = document.getElementById('hero-identity');
  const lines = identity ? [...identity.children] : [];
  return [
    ...lines.map((node) => localPadded(field, node, TEXT_PAD)),
    localPadded(field, document.getElementById('tampa-ajuda'), TEXT_PAD)
  ].filter((rect): rect is NonNullable<typeof rect> => rect !== null);
}

function foldDrag(slots: ScatterSlot[], offsets: Partial<Record<StickerId, { x: number; y: number }>>) {
  return slots.map((slot) => {
    const offset = offsets[slot.id];
    if (!offset || (offset.x === 0 && offset.y === 0)) return slot;
    return { ...slot, x: slot.x + offset.x, y: slot.y + offset.y };
  });
}

export function StickerLid() {
  const lidRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(0);
  const offsetsRef = useRef<Partial<Record<StickerId, { x: number; y: number }>>>({});
  const holo = useHoloRoulette();
  const [slots, setSlots] = useState<ScatterSlot[]>([]);
  const [order, setOrder] = useState<StickerId[]>(STICKER_ORDER);
  const [announcement, setAnnouncement] = useState('');

  const bringToFront = (id: StickerId) =>
    setOrder((prev) => (prev[prev.length - 1] === id ? prev : [...prev.filter((i) => i !== id), id]));

  const settle = (id: StickerId, x: number, y: number) => {
    offsetsRef.current[id] = { x: 0, y: 0 };
    setSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, x, y } : slot)));
  };

  useLayoutEffect(() => {
    const place = (reason: 'init' | 'width' | 'text') => {
      const lid = lidRef.current;
      if (!lid) return;
      const field = lid.getBoundingClientRect();
      if (field.width < 2 || field.height < 2) return;
      const widthChanged = Math.abs(field.width - widthRef.current) >= 0.5 || widthRef.current === 0;
      if (reason === 'width' && !widthChanged) return;
      widthRef.current = field.width;
      const playable = playableRect(field.width, field.height);
      const forbidden = measureForbidden(field);
      setSlots((prev) => {
        const folded = foldDrag(prev, offsetsRef.current);
        offsetsRef.current = {};
        if (folded.length === 0) {
          return scatterStickers(
            playable,
            STICKER_ORDER.map((id) => stickerBox(id, field.width)),
            forbidden
          );
        }
        return relayoutForWidth(folded, playable, forbidden, field.width);
      });
    };

    place('init');
    const fieldNode = lidRef.current;
    const identity = document.getElementById('hero-identity');
    const fieldWatch = new ResizeObserver(() => place('width'));
    const textWatch = new ResizeObserver(() => place('text'));
    if (fieldNode) fieldWatch.observe(fieldNode);
    if (identity) textWatch.observe(identity);
    void document.fonts.ready.then(() => place('text'));
    return () => {
      fieldWatch.disconnect();
      textWatch.disconnect();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="pointer-events-none absolute inset-0 z-[1] no-print">
        <div ref={lidRef} className="lid absolute inset-0">
          <ul
            aria-label="Stickers"
            data-sticker-holo={holo.mode === 'none' ? undefined : holo.mode}
          >
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="pointer-events-none absolute inset-0"
                style={{ zIndex: order.indexOf(slot.id) + 1 }}
              >
                <LidSticker
                  slot={slot}
                  lidRef={lidRef}
                  holoActive={isStickerHoloActive(holo, slot.id)}
                  onFront={() => bringToFront(slot.id)}
                  onReact={setAnnouncement}
                  onOffset={(id, x, y) => {
                    offsetsRef.current[id] = { x, y };
                  }}
                  onSettle={settle}
                />
              </li>
            ))}
          </ul>
        </div>
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </div>
    </MotionConfig>
  );
}
