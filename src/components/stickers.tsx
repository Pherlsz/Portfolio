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
import { useStickerHoloPointer } from '../utils/holoPointer';
import { holoMaskUrl, isStickerHoloActive, useHoloRoulette } from '../utils/stickerHolo';
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
  type ScatterSlot
} from '../utils/lidStickerSlots';
import { STICKERS, StickerArt, useStickerReaction, type StickerId } from './stickerArt';

interface AxisDragConstraints {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const ZERO_DRAG_CONSTRAINTS: AxisDragConstraints = { left: 0, right: 0, top: 0, bottom: 0 };

function roomToDragConstraints(
  space: { left: number; right: number; up: number; down: number },
  offset: { x: number; y: number }
): AxisDragConstraints {
  return {
    left: offset.x + space.left,
    right: offset.x + space.right,
    top: offset.y + space.up,
    bottom: offset.y + space.down
  };
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
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(slot.rotate);
  const dragged = useRef(false);
  const dragControls = useDragControls();
  const dragConstraints = useRef<AxisDragConstraints>({ ...ZERO_DRAG_CONSTRAINTS }).current;
  const [pressed, setPressed] = useState(false);
  const { reactionKey, react, face } = useStickerReaction(slot.id);
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
          reactionKey={reactionKey}
          face={face}
          eager
          holoFoil={holoActive}
        />
      </span>
    </motion.button>
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
    <MotionConfig reducedMotion="user">
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
    </MotionConfig>
  );
}
