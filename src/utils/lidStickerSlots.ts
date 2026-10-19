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

/** Width / height of the sticker frame (a short row, not the old 16/10 lid). */
export const LID_ASPECT = 3.6;

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

/** Cats + D20 in one row, % of the frame. */
export const LID_LAYOUT: LidSlot[] = [
  { id: 'morcega', x: 2, y: 10, w: 22, rotate: -4 },
  { id: 'banguela', x: 27, y: 14, w: 22, rotate: 5 },
  { id: 'tomada', x: 52, y: 12, w: 22, rotate: 2 },
  { id: 'd20', x: 76, y: 8, w: 20, rotate: 8 }
];

/** Arrumar resets every sticker to page-load motion offsets. */
export function createArrumarArrangement(key: number) {
  return { key, targets: null };
}
