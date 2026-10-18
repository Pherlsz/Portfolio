export type LidSlotId =
  | 'morcega'
  | 'banguela'
  | 'tomada'
  | 'd20'
  | 'typescript'
  | 'react'
  | 'nextjs';

export type LidSlot = {
  id: LidSlotId;
  x: number;
  y: number;
  w: number;
  rotate: number;
};

/** Largura / altura da tampa unibody (aspect-ratio 16/10). */
export const LID_ASPECT = 16 / 10;

/** height / width of each sticker asset (matches public/stickers). */
export const STICKER_HEIGHT_OVER_WIDTH: Record<LidSlotId, number> = {
  morcega: 320 / 290,
  banguela: 290 / 320,
  tomada: 295 / 320,
  d20: 320 / 268,
  typescript: 1,
  react: 1,
  nextjs: 1
};

/** Initial band slots in % of width (x, w) and height (y). */
// shortcut: 14% min width so 320px stays 44px; split the row if a sticker clips
export const LID_LAYOUT: LidSlot[] = [
  { id: 'morcega', x: 2, y: 8, w: 22, rotate: -5 },
  { id: 'react', x: 82, y: 6, w: 14, rotate: 10 },
  { id: 'banguela', x: 3, y: 52, w: 18, rotate: 7 },
  { id: 'tomada', x: 30, y: 58, w: 22, rotate: 2 },
  { id: 'd20', x: 56, y: 36, w: 16, rotate: 12 },
  { id: 'typescript', x: 78, y: 46, w: 14, rotate: -8 },
  { id: 'nextjs', x: 82, y: 74, w: 14, rotate: 6 }
];

/** Arrumar resets every sticker to page-load motion offsets. */
export function createArrumarArrangement(key: number) {
  return { key, targets: null };
}
