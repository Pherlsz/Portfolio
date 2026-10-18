export type StickerSlot = {
  x: number;
  y: number;
  w: number;
};

/** Keep caption pills inside the lid on coarse pointers (avoid center translate clipping). */
export function stickerCaptionAlign(slot: StickerSlot): 'start' | 'end' {
  return slot.x + slot.w / 2 < 55 ? 'start' : 'end';
}

/** Bottom-row stickers need the pill above the art so it is not clipped by the lid bottom. */
export function stickerCaptionEdge(slot: StickerSlot): 'above' | 'below' {
  return slot.y >= 45 ? 'above' : 'below';
}
