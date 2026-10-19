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
  morcega: 72,
  banguela: 60,
  tomada: 72,
  d20: 56,
  typescript: 32,
  react: 32,
  nextjs: 32
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

/** Safe corners/edges used when sampling fails. */
const FALLBACK: Record<LidSlotId, { fx: number; fy: number; rotate: number }> = {
  morcega: { fx: 0.02, fy: 0.06, rotate: -5 },
  react: { fx: 0.86, fy: 0.04, rotate: 10 },
  banguela: { fx: 0.04, fy: 0.7, rotate: 7 },
  tomada: { fx: 0.52, fy: 0.72, rotate: 2 },
  d20: { fx: 0.78, fy: 0.38, rotate: 12 },
  typescript: { fx: 0.88, fy: 0.58, rotate: -8 },
  nextjs: { fx: 0.72, fy: 0.78, rotate: 6 }
};

export const MIN_HIT = 44;
const PAD = 10;
const KISS = 2;
const TRIES = 48;

export function stickerBox(id: LidSlotId, fieldW: number) {
  const scale = Math.min(2.1, Math.max(1, fieldW / 360));
  const artW = Math.round(ART_W[id] * scale);
  const artH = Math.round(artW * ART_H_OVER_W[id]);
  return { id, artW, w: Math.max(MIN_HIT, artW), h: Math.max(MIN_HIT, artH) };
}

export function playableRect(field: DOMRectReadOnly, viewW: number, viewH: number): Rect {
  const left = Math.max(0, -field.left);
  const top = Math.max(0, -field.top);
  const right = Math.min(field.width, viewW - field.left);
  const bottom = Math.min(field.height, viewH - field.top);
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

function hits(a: Rect, b: Rect, kiss = KISS) {
  return a.x < b.x + b.w - kiss && a.x + a.w - kiss > b.x && a.y < b.y + b.h - kiss && a.y + a.h - kiss > b.y;
}

function clampTo(playable: Rect, w: number, h: number, x: number, y: number) {
  const maxX = playable.x + Math.max(0, playable.w - w);
  const maxY = playable.y + Math.max(0, playable.h - h);
  return {
    x: Math.min(Math.max(x, playable.x), maxX),
    y: Math.min(Math.max(y, playable.y), maxY)
  };
}

function fits(c: Rect, playable: Rect, forbidden: Rect[], placed: Rect[]) {
  if (c.x < playable.x - 0.5 || c.y < playable.y - 0.5) return false;
  if (c.x + c.w > playable.x + playable.w + 0.5) return false;
  if (c.y + c.h > playable.y + playable.h + 0.5) return false;
  for (const block of forbidden) if (hits(c, block)) return false;
  for (const other of placed) if (hits(c, other)) return false;
  return true;
}

function fallbackPlace(
  id: LidSlotId,
  size: { w: number; h: number; artW: number },
  playable: Rect,
  forbidden: Rect[],
  placed: Rect[]
): ScatterSlot {
  const safe = FALLBACK[id];
  const origin = clampTo(
    playable,
    size.w,
    size.h,
    playable.x + safe.fx * Math.max(0, playable.w - size.w),
    playable.y + safe.fy * Math.max(0, playable.h - size.h)
  );
  const step = 12;
  for (let radius = 0; radius <= 8; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        const pos = clampTo(playable, size.w, size.h, origin.x + dx * step, origin.y + dy * step);
        const c = { x: pos.x, y: pos.y, w: size.w, h: size.h };
        if (fits(c, playable, forbidden, placed)) {
          return { id, ...c, artW: size.artW, rotate: safe.rotate };
        }
      }
    }
  }
  return { id, ...origin, w: size.w, h: size.h, artW: size.artW, rotate: safe.rotate };
}

// shortcut: 48 random tries then a fixed slot; upgrade if a breakpoint still packs on the name
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
    const maxX = Math.max(0, playable.w - size.w);
    const maxY = Math.max(0, playable.h - size.h);
    for (let i = 0; i < TRIES; i++) {
      const c = {
        x: playable.x + rng() * maxX,
        y: playable.y + rng() * maxY,
        w: size.w,
        h: size.h
      };
      if (!fits(c, playable, forbidden, out)) continue;
      placed = { id: size.id, ...c, artW: size.artW, rotate: Math.round((rng() * 2 - 1) * 12) };
      break;
    }
    out.push(placed ?? fallbackPlace(size.id, size, playable, forbidden, out));
  }
  return STICKER_ORDER.map((id) => out.find((slot) => slot.id === id)).filter(
    (slot): slot is ScatterSlot => slot !== undefined
  );
}

export function slotInBounds(slot: Rect, playable: Rect) {
  return fits(slot, playable, [], []);
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
    if (slotInBounds(slot, playable)) next.push(slot);
    else pending.push(slot);
  }
  for (const slot of pending) {
    const occupied = next.filter((s) => s.id !== slot.id);
    const [moved] = scatterStickers(
      playable,
      [{ id: slot.id, w: slot.w, h: slot.h, artW: slot.artW }],
      forbidden.concat(occupied),
      rng
    );
    next.push(moved ?? fallbackPlace(slot.id, slot, playable, forbidden, occupied));
  }
  return STICKER_ORDER.map((id) => next.find((slot) => slot.id === id)).filter(
    (slot): slot is ScatterSlot => slot !== undefined
  );
}
