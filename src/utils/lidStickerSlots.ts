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

/** Posição inicial na tampa, em % da largura (x, w) e da altura (y). */
export const LID_LAYOUT: LidSlot[] = [
  { id: 'morcega', x: 3, y: 12, w: 20, rotate: -5 },
  { id: 'react', x: 83, y: 14, w: 11, rotate: 10 },
  { id: 'banguela', x: 4, y: 58, w: 15, rotate: 7 },
  { id: 'tomada', x: 36, y: 66, w: 22, rotate: 2 },
  { id: 'd20', x: 64, y: 42, w: 13, rotate: 12 },
  { id: 'typescript', x: 81, y: 54, w: 11, rotate: -8 },
  { id: 'nextjs', x: 85, y: 76, w: 10, rotate: 6 }
];

/** Arrumar resets every sticker to page-load motion offsets. */
export function createArrumarArrangement(key: number) {
  return { key, targets: null };
}
