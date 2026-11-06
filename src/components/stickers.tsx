import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject
} from 'react';
import { HoloSparkleCanvas } from './HoloSparkleCanvas';
import { useStickerHoloPointer } from '../utils/holoPointer';
import { holoMaskUrl, isStickerHoloActive, prefersReducedMotion, useHoloRoulette } from '../utils/stickerHolo';
import {
  localPadded,
  nudgeConflicts,
  playableRect,
  relayoutForWidth,
  scatterStickers,
  stickerBox,
  STICKER_ORDER,
  tagFracs,
  TEXT_PAD,
  type LidSlotId,
  type ScatterSlot
} from '../utils/lidStickerSlots';

export type StickerId = LidSlotId;

interface StickerDef {
  label: string;
  src: string;
  /** Tamanho real do arquivo em public/stickers, para reservar espaço sem layout shift. */
  width: number;
  height: number;
  animation: string;
}

const STICKERS: Record<StickerId, StickerDef> = {
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

function useStickerReaction(id: StickerId) {
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

function StickerArt({
  id,
  reactionKey,
  face,
  holoFoil = false
}: {
  id: StickerId;
  reactionKey: number | null;
  face?: number;
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
          loading="eager"
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

interface AxisDragConstraints {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function applyAxisConstraints(
  constraints: AxisDragConstraints,
  deltaX: number,
  deltaY: number
) {
  return {
    x: Math.min(Math.max(deltaX, constraints.left), constraints.right),
    y: Math.min(Math.max(deltaY, constraints.top), constraints.bottom)
  };
}

interface ActiveDrag {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  constraints: AxisDragConstraints;
  moved: boolean;
}

function LidSticker({
  slot,
  lidRef,
  holoActive,
  onFront,
  onOffset,
  onSettle
}: {
  slot: ScatterSlot;
  lidRef: RefObject<HTMLDivElement | null>;
  holoActive: boolean;
  onFront: () => void;
  onOffset: (id: StickerId, x: number, y: number) => void;
  onSettle: (id: StickerId, x: number, y: number) => void;
}) {
  const def = STICKERS[slot.id];
  const maskUrl = holoActive ? holoMaskUrl(slot.id) : undefined;
  const ref = useRef<HTMLButtonElement>(null);
  const tiltRef = useRef<HTMLSpanElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<ActiveDrag | null>(null);
  const suppressClickRef = useRef(false);
  const [pressed, setPressed] = useState(false);
  const { reactionKey, react, face } = useStickerReaction(slot.id);
  useStickerHoloPointer(ref, holoActive);

  useLayoutEffect(() => {
    offsetRef.current = { x: 0, y: 0 };
    if (ref.current) {
      ref.current.style.transform = '';
    }
    if (tiltRef.current) {
      tiltRef.current.style.transform = `rotate(${slot.rotate}deg) scale(1)`;
    }
  }, [slot.x, slot.y, slot.rotate]);

  const room = (): AxisDragConstraints | null => {
    const lid = lidRef.current;
    if (!lid) return null;
    return {
      left: -slot.x,
      right: lid.clientWidth - (slot.x + slot.w),
      top: -slot.y,
      bottom: lid.clientHeight - (slot.y + slot.h)
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const constraints = room();
    if (!constraints) return;
    onFront();
    setPressed(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      constraints,
      moved: false
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rawDx = event.clientX - drag.startX;
    const rawDy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(rawDx, rawDy) < 4) return;

    drag.moved = true;
    suppressClickRef.current = true;
    const next = applyAxisConstraints(drag.constraints, rawDx, rawDy);
    offsetRef.current = next;
    onOffset(slot.id, next.x, next.y);

    const now = performance.now();
    const dt = Math.max(1, now - drag.lastTime);
    const vx = ((event.clientX - drag.lastX) / dt) * 1000;
    drag.lastX = event.clientX;
    drag.lastTime = now;

    const reduceMotion = prefersReducedMotion();
    const extraRotate = reduceMotion ? 0 : Math.max(-14, Math.min(14, vx / 160));
    const scale = reduceMotion ? 1 : 1.06;

    if (ref.current) {
      ref.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
    }
    if (tiltRef.current) {
      tiltRef.current.style.transition = 'none';
      tiltRef.current.style.transform = `rotate(${slot.rotate + extraRotate}deg) scale(${scale})`;
    }
  };

  const finishDrag = (pointerId?: number) => {
    const drag = dragRef.current;
    if (!drag || (pointerId !== undefined && drag.pointerId !== pointerId)) {
      setPressed(false);
      return;
    }
    dragRef.current = null;
    setPressed(false);

    if (drag.moved) {
      const { x, y } = offsetRef.current;
      offsetRef.current = { x: 0, y: 0 };
      if (tiltRef.current) {
        tiltRef.current.style.transition = prefersReducedMotion()
          ? 'none'
          : 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)';
        tiltRef.current.style.transform = `rotate(${slot.rotate}deg) scale(1)`;
      }
      onSettle(slot.id, slot.x + x, slot.y + y);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  };

  const nudge = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 48 : 16;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    const move = moves[event.key];
    const constraints = move && room();
    if (!move || !constraints) return;
    event.preventDefault();
    onFront();
    const next = applyAxisConstraints(constraints, move[0], move[1]);
    onSettle(slot.id, slot.x + next.x, slot.y + next.y);
  };

  const holoVars: Record<string, string> = maskUrl ? { '--holo-mask': `url("${maskUrl}")` } : {};

  return (
    <button
      ref={ref}
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => finishDrag(e.pointerId)}
      onPointerCancel={(e) => finishDrag(e.pointerId)}
      onLostPointerCapture={() => finishDrag()}
      onClick={() => {
        if (suppressClickRef.current) return;
        react();
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
        left: slot.x,
        top: slot.y,
        width: slot.w,
        height: slot.h,
        ...holoVars
      }}
    >
      <span
        ref={tiltRef}
        className="block"
        style={{ width: slot.artW }}
      >
        <StickerArt id={slot.id} reactionKey={reactionKey} face={face} holoFoil={holoActive} />
      </span>
    </button>
  );
}

function measureForbidden(field: DOMRectReadOnly) {
  const identity = document.getElementById('hero-identity');
  const nodes: (Element | null)[] = [
    document.getElementById('inicio-titulo'),
    identity?.children[1] ?? null,
    identity?.children[2] ?? null,
    document.querySelector('header')
  ];
  return nodes
    .map((node) => localPadded(field, node, TEXT_PAD))
    .filter((rect): rect is NonNullable<typeof rect> => rect !== null);
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
  const heightRef = useRef(0);
  const offsetsRef = useRef<Partial<Record<StickerId, { x: number; y: number }>>>({});
  const holo = useHoloRoulette();
  const [slots, setSlots] = useState<ScatterSlot[]>([]);
  const [order, setOrder] = useState<StickerId[]>(STICKER_ORDER);

  const bringToFront = (id: StickerId) =>
    setOrder((prev) => (prev[prev.length - 1] === id ? prev : [...prev.filter((i) => i !== id), id]));

  const settle = (id: StickerId, x: number, y: number) => {
    offsetsRef.current[id] = { x: 0, y: 0 };
    const field = lidRef.current?.getBoundingClientRect();
    setSlots((prev) =>
      tagFracs(
        prev.map((slot) => (slot.id === id ? { ...slot, x, y } : slot)),
        field?.width ?? 0,
        field?.height ?? 0
      )
    );
  };

  useLayoutEffect(() => {
    const place = (reason: 'init' | 'width' | 'text') => {
      const lid = lidRef.current;
      if (!lid) return;
      const field = lid.getBoundingClientRect();
      if (field.width < 2 || field.height < 2) return;
      const widthChanged = Math.abs(field.width - widthRef.current) >= 0.5 || widthRef.current === 0;
      if (reason === 'width' && !widthChanged) return;
      const prevW = widthRef.current || field.width;
      const prevH = heightRef.current || field.height;
      widthRef.current = field.width;
      heightRef.current = field.height;
      const playable = playableRect(field.width, field.height);
      const forbidden = measureForbidden(field);
      setSlots((prev) => {
        const offsets = offsetsRef.current;
        offsetsRef.current = {};
        const dragged = foldDrag(prev, offsets);
        const folded = Object.values(offsets).some((offset) => offset && (offset.x !== 0 || offset.y !== 0))
          ? tagFracs(dragged, prevW, prevH)
          : dragged;
        if (folded.length === 0) {
          return scatterStickers(
            playable,
            STICKER_ORDER.map((id) => stickerBox(id, field.width)),
            forbidden,
            field.width,
            field.height
          );
        }
        if (reason === 'text') return nudgeConflicts(folded, playable, forbidden, field.width, field.height);
        return relayoutForWidth(folded, playable, forbidden, field.width, field.height);
      });
    };

    place('init');
    const fieldNode = lidRef.current;
    const identity = document.getElementById('hero-identity');
    const title = document.getElementById('inicio-titulo');
    const fieldWatch = new ResizeObserver(() => place('width'));
    const textWatch = new ResizeObserver(() => place('text'));
    if (fieldNode) fieldWatch.observe(fieldNode);
    if (identity) textWatch.observe(identity);
    if (title) textWatch.observe(title);
    let cancelFonts = false;
    void document.fonts.ready.then(() => {
      if (!cancelFonts) place('text');
    });
    return () => {
      cancelFonts = true;
      fieldWatch.disconnect();
      textWatch.disconnect();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] no-print">
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
                onOffset={(id, x, y) => {
                  offsetsRef.current[id] = { x, y };
                }}
                onSettle={settle}
              />
            </li>
          ))}
        </ul>
      </div>
      <p id="tampa-ajuda" className="sr-only">
        Arraste os stickers ou use as setas. Clique no D20 para rolar.
      </p>
    </div>
  );
}
