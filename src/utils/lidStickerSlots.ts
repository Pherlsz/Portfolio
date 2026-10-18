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

// shortcut: short strip instead of the 16/10 lid, restore that aspect if drag room feels cramped
export const LID_ASPECT = 5.2;

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
  { id: 'morcega', x: 1, y: 4, w: 16, rotate: -4 },
  { id: 'banguela', x: 18, y: 12, w: 16, rotate: 5 },
  { id: 'tomada', x: 35, y: 8, w: 16, rotate: 2 },
  { id: 'd20', x: 52, y: 8, w: 11, rotate: 7 },
  { id: 'typescript', x: 64, y: 22, w: 9, rotate: -5 },
  { id: 'react', x: 75, y: 20, w: 9, rotate: 6 },
  { id: 'nextjs', x: 87, y: 24, w: 9, rotate: 3 }
];

/** Arrumar resets every sticker to page-load motion offsets. */
export function createArrumarArrangement(key: number) {
  return { key, targets: null };
}
