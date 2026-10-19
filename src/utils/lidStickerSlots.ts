export type LidSlotId =
  | 'morcega'
  | 'banguela'
  | 'tomada'
  | 'd20'
  | 'typescript'
  | 'react'
  | 'nextjs';

export type Rect = { x: number; y: number; w: number; h: number };

export type ScatterSlot = {
  id: LidSlotId;
  x: number;
  y: number;
  w: number;
  h: number;
  artW: number;
  rotate: number;
};

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
  typescript: 28,
  react: 28,
  nextjs: 28
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

const FALLBACK: Record<LidSlotId, { fx: number; fy: number; rotate: number }> = {
  morcega: { fx: 0.78, fy: 0.08, rotate: -5 },
  react: { fx: 0.88, fy: 0.36, rotate: 8 },
  banguela: { fx: 0.7, fy: 0.62, rotate: 6 },
  tomada: { fx: 0.08, fy: 0.78, rotate: 2 },
  d20: { fx: 0.52, fy: 0.72, rotate: 10 },
  typescript: { fx: 0.88, fy: 0.72, rotate: -6 },
  nextjs: { fx: 0.36, fy: 0.8, rotate: 5 }
};

export const MIN_HIT = 44;
const PAD = 12;
const KISS = 1;
const TRIES = 48;
const GRID = 6;

export function stickerBox(id: LidSlotId, fieldW: number) {
  const scale = Math.min(2, Math.max(1, fieldW / 420));
  const artW = Math.round(ART_W[id] * scale);
  const artH = Math.round(artW * ART_H_OVER_W[id]);
  return { id, artW, w: Math.max(MIN_HIT, artW), h: Math.max(MIN_HIT, artH) };
}

export function playableRect(field: DOMRectReadOnly, viewW: number, viewH: number): Rect {
  const inset = 4;
  const left = Math.max(inset, -field.left);
  const top = Math.max(inset, -field.top);
  const right = Math.min(field.width - inset, viewW - field.left - inset);
  const bottom = Math.min(field.height - inset, viewH - field.top - inset);
  return { x: left, y: top, w: Math.max(0, right - left), h: Math.max(0, bottom - top) };
}

export function localPadded(field: DOMRectReadOnly, node: Element | null, pad = PAD): Rect | null {
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

function hits(a: Rect, b: Rect, kiss = KISS) {
  return a.x < b.x + b.w - kiss && a.x + a.w - kiss > b.x && a.y < b.y + b.h - kiss && a.y + a.h - kiss > b.y;
}

function clampLayout(playable: Rect, w: number, h: number, aw: number, ah: number, x: number, y: number) {
  const dx = (aw - w) / 2;
  const dy = (ah - h) / 2;
  const minX = playable.x - dx;
  const minY = playable.y - dy;
  const maxX = playable.x + playable.w - aw - dx;
  const maxY = playable.y + playable.h - ah - dy;
  return {
    x: Math.min(Math.max(x, minX), Math.max(minX, maxX)),
    y: Math.min(Math.max(y, minY), Math.max(minY, maxY))
  };
}

function allowed(slot: ScatterSlot, playable: Rect, forbidden: Rect[], placed: ScatterSlot[]) {
  const box = aabbOf(slot);
  if (box.x < playable.x - 0.5 || box.y < playable.y - 0.5) return false;
  if (box.x + box.w > playable.x + playable.w + 0.5) return false;
  if (box.y + box.h > playable.y + playable.h + 0.5) return false;
  for (const block of forbidden) if (hits(box, block)) return false;
  for (const other of placed) if (hits(box, aabbOf(other))) return false;
  return true;
}

function fromAabb(
  id: LidSlotId,
  size: { w: number; h: number; artW: number },
  rotate: number,
  aabbX: number,
  aabbY: number
): ScatterSlot {
  const aabb = rotSize(size.w, size.h, rotate);
  return {
    id,
    x: aabbX + (aabb.w - size.w) / 2,
    y: aabbY + (aabb.h - size.h) / 2,
    w: size.w,
    h: size.h,
    artW: size.artW,
    rotate
  };
}

function gridPlace(
  id: LidSlotId,
  size: { w: number; h: number; artW: number },
  rotate: number,
  playable: Rect,
  forbidden: Rect[],
  placed: ScatterSlot[]
): ScatterSlot | undefined {
  const aabb = rotSize(size.w, size.h, rotate);
  const maxX = playable.x + playable.w - aabb.w;
  const maxY = playable.y + playable.h - aabb.h;
  if (maxX < playable.x || maxY < playable.y) return undefined;
  for (let y = playable.y; y <= maxY; y += GRID) {
    for (let x = playable.x; x <= maxX; x += GRID) {
      const slot = fromAabb(id, size, rotate, x, y);
      if (allowed(slot, playable, forbidden, placed)) return slot;
    }
  }
  return undefined;
}

function fallbackPlace(
  id: LidSlotId,
  size: { w: number; h: number; artW: number },
  playable: Rect,
  forbidden: Rect[],
  placed: ScatterSlot[]
): ScatterSlot {
  const safe = FALLBACK[id];
  for (const rotate of [safe.rotate, 0]) {
    const found = gridPlace(id, size, rotate, playable, forbidden, placed);
    if (found) return found;
  }
  const aabb = rotSize(size.w, size.h, 0);
  const pos = clampLayout(
    playable,
    size.w,
    size.h,
    aabb.w,
    aabb.h,
    playable.x + safe.fx * Math.max(0, playable.w - aabb.w),
    playable.y + safe.fy * Math.max(0, playable.h - aabb.h)
  );
  return { id, x: pos.x, y: pos.y, w: size.w, h: size.h, artW: size.artW, rotate: 0 };
}

// shortcut: 48 random tries then a 6px grid; upgrade if a new breakpoint still packs on the name
export function scatterStickers(
  playable: Rect,
  sizes: { id: LidSlotId; w: number; h: number; artW: number }[],
  forbidden: Rect[],
  rng: () => number = Math.random
): ScatterSlot[] {
  const ordered = [...sizes].sort((a, b) => b.w * b.h - a.w * a.h);
  const out: ScatterSlot[] = [];
  for (const size of ordered) {
    let placed: ScatterSlot | undefined;
    for (let i = 0; i < TRIES; i++) {
      const rotate = Math.round((rng() * 2 - 1) * 10);
      const aabb = rotSize(size.w, size.h, rotate);
      const maxX = Math.max(0, playable.w - aabb.w);
      const maxY = Math.max(0, playable.h - aabb.h);
      const slot = fromAabb(size.id, size, rotate, playable.x + rng() * maxX, playable.y + rng() * maxY);
      if (allowed(slot, playable, forbidden, out)) {
        placed = slot;
        break;
      }
    }
    out.push(placed ?? fallbackPlace(size.id, size, playable, forbidden, out));
  }
  return STICKER_ORDER.map((id) => out.find((slot) => slot.id === id)).filter(
    (slot): slot is ScatterSlot => slot !== undefined
  );
}

export function slotInBounds(slot: ScatterSlot, playable: Rect) {
  return allowed(slot, playable, [], []);
}

export function relocateOutOfBounds(
  prev: ScatterSlot[],
  playable: Rect,
  forbidden: Rect[],
  rng: () => number = Math.random
): ScatterSlot[] {
  const next: ScatterSlot[] = [];
  const pending: ScatterSlot[] = [];
  for (const slot of prev) {
    if (slotInBounds(slot, playable) && allowed(slot, playable, forbidden, next)) next.push(slot);
    else pending.push(slot);
  }
  for (const slot of pending) {
    const occupied = next.filter((s) => s.id !== slot.id);
    const [moved] = scatterStickers(
      playable,
      [{ id: slot.id, w: slot.w, h: slot.h, artW: slot.artW }],
      forbidden.concat(occupied.map((s) => aabbOf(s))),
      rng
    );
    next.push(moved ?? fallbackPlace(slot.id, slot, playable, forbidden, occupied));
  }
  return STICKER_ORDER.map((id) => next.find((slot) => slot.id === id)).filter(
    (slot): slot is ScatterSlot => slot !== undefined
  );
}
