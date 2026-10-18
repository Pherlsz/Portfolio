export type LidCatId = 'morcega' | 'banguela' | 'tomada';

export type StickerSlot = {
  x: number;
  y: number;
  w: number;
};

export type StickerCaptionStackPlacement = {
  mode: 'stack';
  edge: 'above' | 'below';
  align: 'start' | 'end';
};

export type StickerCaptionBesidePlacement = {
  mode: 'beside';
  side: 'start' | 'end';
};

export type StickerCaptionPlacement = StickerCaptionStackPlacement | StickerCaptionBesidePlacement;

const LID_CAT_SLOTS: Record<LidCatId, StickerSlot> = {
  morcega: { x: 3, y: 12, w: 20 },
  banguela: { x: 4, y: 58, w: 15 },
  tomada: { x: 36, y: 70, w: 22 }
};

/** Fixed coarse-pointer caption layout for lid cats (avoids vertical stack collisions). */
const LID_CAT_CAPTION_PLACEMENT: Record<LidCatId, StickerCaptionPlacement> = {
  morcega: { mode: 'beside', side: 'end' },
  /** Below art on the left — clear of Morcega (beside) and Tomada's tail (beside end). */
  banguela: { mode: 'stack', edge: 'below', align: 'start' },
  tomada: { mode: 'beside', side: 'end' }
};

export function lidCatCaptionPlacement(id: LidCatId): StickerCaptionPlacement {
  return LID_CAT_CAPTION_PLACEMENT[id];
}

/** Default stack placement for non-cat lid stickers (hover captions on coarse). */
export function lidStickerCaptionPlacement(slot: StickerSlot): StickerCaptionStackPlacement {
  return {
    mode: 'stack',
    edge: slot.y >= 45 ? 'above' : 'below',
    align: slot.x + slot.w / 2 < 55 ? 'start' : 'end'
  };
}

export function lidCaptionPlacementForSticker(id: string, slot: StickerSlot): StickerCaptionPlacement {
  if (id === 'morcega' || id === 'banguela' || id === 'tomada') {
    return lidCatCaptionPlacement(id);
  }
  return lidStickerCaptionPlacement(slot);
}

export { LID_CAT_SLOTS };
