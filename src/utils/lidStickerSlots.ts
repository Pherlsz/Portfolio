export type LidSlotId =
  | 'morcega'
  | 'banguela'
  | 'tomada'
  | 'd20'
  | 'typescript'
  | 'react'
  | 'nextjs';

type Rect = { x: number; y: number; w: number; h: number };

export type ScatterSlot = {
  id: LidSlotId;
  x: number;
  y: number;
  w: number;
  h: number;
  artW: number;
  rotate: number;
  fx: number;
  fy: number;
};

type StickerBox = { id: LidSlotId; w: number; h: number; artW: number };

export const STICKER_ORDER: LidSlotId[] = [
  'morcega',
  'banguela',
  'tomada',
  'd20',
  'typescript',
  'react',
  'nextjs'
];

const ART_W: Record<LidSlotId, number> = {
  morcega: 56,
  banguela: 50,
  tomada: 56,
  d20: 46,
  typescript: 36,
  react: 36,
  nextjs: 36
};

const ART_H_OVER_W: Record<LidSlotId, number> = {
  morcega: 320 / 290,
  banguela: 290 / 320,
  tomada: 295 / 320,
  d20: 320 / 268,
  typescript: 1,
  react: 1,
  nextjs: 1
};

const FALLBACK_ROTATE: Record<LidSlotId, number> = {
  morcega: -5,
  react: 8,
  banguela: 6,
  tomada: 2,
  d20: 10,
  typescript: -6,
  nextjs: 5
};

const MIN_HIT = 44;
export const TEXT_PAD = 12;
const STICKER_GAP = 8;
const EDGE = 14;
const TRIES = 48;
const GRID = 6;

export function stickerBox(id: LidSlotId, fieldW: number): StickerBox {
  const scale = Math.min(2, Math.max(1, fieldW / 420));
  const artW = Math.round(ART_W[id] * scale);
  const artH = Math.round(artW * ART_H_OVER_W[id]);
  return { id, artW, w: Math.max(MIN_HIT, artW), h: Math.max(MIN_HIT, artH) };
}

export function playableRect(fieldW: number, fieldH: number): Rect {
  return {
    x: EDGE,
    y: EDGE,
    w: Math.max(0, fieldW - EDGE * 2),
    h: Math.max(0, fieldH - EDGE * 2)
  };
}

export function localPadded(field: DOMRectReadOnly, node: Element | null, pad = TEXT_PAD): Rect | null {
  if (!node) return null;
  const r = node.getBoundingClientRect();
  return {
    x: r.left - field.left - pad,
    y: r.top - field.top - pad,
    w: r.width + pad * 2,
    h: r.height + pad * 2
  };
}

function rotSize(w: number, h: number, deg: number) {
  const rad = (Math.abs(deg) * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return { w: w * c + h * s, h: w * s + h * c };
}

function aabbOf(slot: { x: number; y: number; w: number; h: number; rotate: number }): Rect {
  const size = rotSize(slot.w, slot.h, slot.rotate);
  return {
    x: slot.x + (slot.w - size.w) / 2,
    y: slot.y + (slot.h - size.h) / 2,
    w: size.w,
    h: size.h
  };
}

function tooClose(a: Rect, b: Rect, gap: number) {
  return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
}

function allowed(
  slot: ScatterSlot,
  playable: Rect,
  forbidden: Rect[],
  placed: ScatterSlot[],
  stickerGap = STICKER_GAP
) {
  const box = aabbOf(slot);
  if (box.x < playable.x - 0.5 || box.y < playable.y - 0.5) return false;
  if (box.x + box.w > playable.x + playable.w + 0.5) return false;
  if (box.y + box.h > playable.y + playable.h + 0.5) return false;
  for (const block of forbidden) if (tooClose(box, block, 0)) return false;
  for (const other of placed) if (tooClose(box, aabbOf(other), stickerGap)) return false;
  return true;
}

function fromAabb(size: StickerBox, rotate: number, aabbX: number, aabbY: number): ScatterSlot {
  const aabb = rotSize(size.w, size.h, rotate);
  return {
    id: size.id,
    x: aabbX + (aabb.w - size.w) / 2,
    y: aabbY + (aabb.h - size.h) / 2,
    w: size.w,
    h: size.h,
    artW: size.artW,
    rotate,
    fx: 0,
    fy: 0
  };
}

export function tagFracs(slots: ScatterSlot[], fieldW: number, fieldH: number): ScatterSlot[] {
  return slots.map((slot) => ({
    ...slot,
    fx: fieldW ? slot.x / fieldW : 0,
    fy: fieldH ? slot.y / fieldH : 0
  }));
}

function inflate(rect: Rect, pad: number): Rect {
  return { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 };
}

function mergeIntervals(spans: [number, number][]) {
  if (spans.length === 0) return [];
  const sorted = [...spans].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = out[out.length - 1];
    if (cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1]);
    else out.push(cur);
  }
  return out;
}

function verticalGaps(x: number, w: number, h: number, playable: Rect, blocked: Rect[]): { y: number; h: number }[] {
  const x1 = x + w;
  const spans: [number, number][] = [];
  for (const block of blocked) {
    if (x < block.x + block.w && x1 > block.x) spans.push([block.y, block.y + block.h]);
  }
  const merged = mergeIntervals(spans);
  const gaps: { y: number; h: number }[] = [];
  let cursor = playable.y;
  const end = playable.y + playable.h;
  for (const [top, bottom] of merged) {
    if (top - cursor >= h) gaps.push({ y: cursor, h: top - cursor });
    cursor = Math.max(cursor, bottom);
  }
  if (end - cursor >= h) gaps.push({ y: cursor, h: end - cursor });
  return gaps;
}

function scaleStickerBox(box: StickerBox, factor: number): StickerBox {
  if (factor >= 0.999) return box;
  const artW = Math.max(26, Math.round(box.artW * factor));
  const artH = Math.max(26, Math.round(artW * ART_H_OVER_W[box.id]));
  const minHit = factor < 0.85 ? 32 : MIN_HIT;
  return {
    id: box.id,
    artW,
    w: Math.max(minHit, artW),
    h: Math.max(minHit, artH)
  };
}

function gridPlace(
  size: StickerBox,
  rotate: number,
  playable: Rect,
  forbidden: Rect[],
  placed: ScatterSlot[],
  step = GRID,
  stickerGap = STICKER_GAP
): ScatterSlot | undefined {
  const aabb = rotSize(size.w, size.h, rotate);
  const maxX = playable.x + playable.w - aabb.w;
  const maxY = playable.y + playable.h - aabb.h;
  if (maxX < playable.x || maxY < playable.y) return undefined;
  for (let y = maxY; y >= playable.y; y -= step) {
    for (let x = maxX; x >= playable.x; x -= step) {
      const slot = fromAabb(size, rotate, x, y);
      if (allowed(slot, playable, forbidden, placed, stickerGap)) return slot;
    }
  }
  return undefined;
}

function fallbackPlace(
  size: StickerBox,
  playable: Rect,
  forbidden: Rect[],
  placed: ScatterSlot[],
  stickerGap = STICKER_GAP
): ScatterSlot | undefined {
  for (const rotate of [FALLBACK_ROTATE[size.id], 0]) {
    const found = gridPlace(size, rotate, playable, forbidden, placed, GRID, stickerGap);
    if (found) return found;
  }
  return undefined;
}

function orderSlots(slots: ScatterSlot[]) {
  return STICKER_ORDER.map((id) => slots.find((slot) => slot.id === id)).filter(
    (slot): slot is ScatterSlot => slot !== undefined
  );
}

function findForbiddenFreeSpot(
  size: StickerBox,
  playable: Rect,
  forbidden: Rect[],
  placed: ScatterSlot[]
): ScatterSlot {
  for (const factor of [1, 0.82, 0.68, 0.56]) {
    const scaled = scaleStickerBox(size, factor);
    for (const gap of [4, 2, 0]) {
      const hit = gridPlace(scaled, 0, playable, forbidden, placed, 4, gap);
      if (hit) return hit;
    }
  }
  const compact = scaleStickerBox(size, 0.56);
  let bestSlot: ScatterSlot | undefined;
  let bestClearance = -Infinity;
  const maxX = Math.max(playable.x, playable.x + playable.w - compact.w);
  const maxY = Math.max(playable.y, playable.y + playable.h - compact.h);
  for (let y = maxY; y >= playable.y; y -= 6) {
    for (let x = maxX; x >= playable.x; x -= 6) {
      const candidate = fromAabb(compact, 0, x, y);
      const box = aabbOf(candidate);
      if (forbidden.some((block) => tooClose(box, block, 0))) continue;
      let minDist = Infinity;
      for (const other of placed) {
        const ob = aabbOf(other);
        const dx = (box.x + box.w / 2) - (ob.x + ob.w / 2);
        const dy = (box.y + box.h / 2) - (ob.y + ob.h / 2);
        minDist = Math.min(minDist, Math.hypot(dx, dy));
      }
      if (minDist > bestClearance) {
        bestClearance = minDist;
        bestSlot = candidate;
      }
    }
  }
  if (bestSlot) return bestSlot;
  return {
    ...compact,
    x: maxX,
    y: maxY,
    rotate: 0,
    fx: 0,
    fy: 0
  };
}

function safeForbiddenGrid(
  sizes: StickerBox[],
  playable: Rect,
  forbidden: Rect[]
): ScatterSlot[] {
  for (const factor of [0.82, 0.68, 0.58]) {
    const scaledSizes = sizes.map((box) => scaleStickerBox(box, factor));
    const ordered = [...scaledSizes].sort((a, b) => b.w * b.h - a.w * a.h);
    const out: ScatterSlot[] = [];
    let allFit = true;
    for (const box of ordered) {
      const placed =
        fallbackPlace(box, playable, forbidden, out, 4) ??
        gridPlace(box, 0, playable, forbidden, out, 4, 2);
      if (!placed) {
        allFit = false;
        break;
      }
      out.push(placed);
    }
    if (allFit) return orderSlots(out);
  }

  const emergency: ScatterSlot[] = [];
  for (const box of [...sizes].sort((a, b) => b.w * b.h - a.w * a.h)) {
    emergency.push(findForbiddenFreeSpot(box, playable, forbidden, emergency));
  }
  return orderSlots(emergency);
}

function nearestPlace(
  from: ScatterSlot | undefined,
  size: StickerBox,
  playable: Rect,
  forbidden: Rect[],
  placed: ScatterSlot[]
): ScatterSlot | undefined {
  const rotate = from?.rotate ?? 0;
  if (from) {
    const candidate = { ...from, w: size.w, h: size.h, artW: size.artW };
    if (allowed(candidate, playable, forbidden, placed)) return candidate;
  }
  const originX = from?.x ?? playable.x;
  const originY = from?.y ?? playable.y;
  const maxR = Math.ceil(Math.max(playable.w, playable.h) / GRID);
  for (let r = 1; r <= maxR; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const slot: ScatterSlot = {
          id: size.id,
          x: originX + dx * GRID,
          y: originY + dy * GRID,
          w: size.w,
          h: size.h,
          artW: size.artW,
          rotate,
          fx: 0,
          fy: 0
        };
        if (allowed(slot, playable, forbidden, placed)) return slot;
      }
    }
  }
  return fallbackPlace(size, playable, forbidden, placed);
}

function pack(
  sizes: StickerBox[],
  playable: Rect,
  forbidden: Rect[],
  rng: () => number,
  occupied: ScatterSlot[] = []
): ScatterSlot[] | null {
  const out = [...occupied];
  const ordered = [...sizes].sort((a, b) => b.w * b.h - a.w * a.h);
  for (const size of ordered) {
    let placed: ScatterSlot | undefined;
    for (let i = 0; i < TRIES; i++) {
      const rotate = Math.round((rng() * 2 - 1) * 10);
      const aabb = rotSize(size.w, size.h, rotate);
      const maxX = Math.max(0, playable.w - aabb.w);
      const x = playable.x + rng() * maxX;
      const gaps = verticalGaps(
        x,
        aabb.w,
        aabb.h,
        playable,
        forbidden.concat(out.map((slot) => inflate(aabbOf(slot), STICKER_GAP)))
      );
      if (gaps.length === 0) continue;
      const weights = gaps.map((gap) => gap.h - aabb.h);
      let pick = rng() * weights.reduce((sum, w) => sum + w, 0);
      let gap = gaps[0];
      for (let g = 0; g < gaps.length; g++) {
        pick -= weights[g];
        if (pick <= 0) {
          gap = gaps[g];
          break;
        }
      }
      const y = gap.y + rng() * Math.max(0, gap.h - aabb.h);
      const slot = fromAabb(size, rotate, x, y);
      if (allowed(slot, playable, forbidden, out)) {
        placed = slot;
        break;
      }
    }
    placed = placed ?? fallbackPlace(size, playable, forbidden, out);
    if (!placed) return null;
    out.push(placed);
  }
  return orderSlots(out);
}

export function scatterStickers(
  playable: Rect,
  sizes: StickerBox[],
  forbidden: Rect[],
  fieldW: number,
  fieldH: number,
  rng: () => number = Math.random
): ScatterSlot[] {
  for (const factor of [1, 0.82, 0.68]) {
    const scaled = factor === 1 ? sizes : sizes.map((box) => scaleStickerBox(box, factor));
    const packed =
      pack(scaled, playable, forbidden, rng) ?? pack(scaled, playable, forbidden, rng);
    if (packed) return tagFracs(packed, fieldW, fieldH);
  }
  return tagFracs(safeForbiddenGrid(sizes, playable, forbidden), fieldW, fieldH);
}

export function relayoutForWidth(
  prev: ScatterSlot[],
  playable: Rect,
  forbidden: Rect[],
  fieldW: number,
  fieldH: number,
  rng: () => number = Math.random
): ScatterSlot[] {
  const keep: ScatterSlot[] = [];
  const rest: StickerBox[] = [];
  for (const id of STICKER_ORDER) {
    const box = stickerBox(id, fieldW);
    const last = prev.find((slot) => slot.id === id);
    const candidate = last
      ? {
          ...last,
          ...box,
          x: last.fx * fieldW,
          y: last.fy * fieldH
        }
      : { ...box, x: playable.x, y: playable.y, rotate: 0, fx: 0, fy: 0 };
    if (last && allowed(candidate, playable, forbidden, keep)) keep.push(candidate);
    else rest.push(box);
  }
  if (rest.length === 0) return tagFracs(orderSlots(keep), fieldW, fieldH);
  const stacked = pack(rest, playable, forbidden, rng, keep);
  if (stacked) return tagFracs(stacked, fieldW, fieldH);
  return scatterStickers(
    playable,
    STICKER_ORDER.map((id) => stickerBox(id, fieldW)),
    forbidden,
    fieldW,
    fieldH,
    rng
  );
}

export function nudgeConflicts(
  prev: ScatterSlot[],
  playable: Rect,
  forbidden: Rect[],
  fieldW: number,
  fieldH: number
): ScatterSlot[] {
  const keep: ScatterSlot[] = [];
  const rest: { last?: ScatterSlot; box: StickerBox }[] = [];
  for (const id of STICKER_ORDER) {
    const box = stickerBox(id, fieldW);
    const last = prev.find((slot) => slot.id === id);
    const candidate = last
      ? { ...last, w: box.w, h: box.h, artW: box.artW }
      : { ...box, x: playable.x, y: playable.y, rotate: 0, fx: 0, fy: 0 };
    if (last && allowed(candidate, playable, forbidden, keep)) keep.push(candidate);
    else rest.push({ last, box });
  }
  for (const item of rest) {
    let moved: ScatterSlot | undefined;
    for (const factor of [1, 0.82, 0.68]) {
      const scaled = scaleStickerBox(item.box, factor);
      moved =
        nearestPlace(item.last, scaled, playable, forbidden, keep) ??
        fallbackPlace(scaled, playable, forbidden, keep);
      if (moved) break;
    }
    keep.push(moved ?? findForbiddenFreeSpot(item.box, playable, forbidden, keep));
  }
  return tagFracs(orderSlots(keep), fieldW, fieldH);
}
