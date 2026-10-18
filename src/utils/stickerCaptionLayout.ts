export type CaptionEdge = 'above' | 'below';

export type CaptionAlign = 'start' | 'center' | 'end';

export type LidCaptionLayout = {
  edge: CaptionEdge;
  align: CaptionAlign;
  /** Extra horizontal px after align anchoring so the pill stays inside the lid. */
  shiftX: number;
};

const CAPTION_GAP_PX = 4;

function bubbleLeftForAlign(
  align: CaptionAlign,
  stickerRect: DOMRectReadOnly,
  bubbleWidth: number
): number {
  if (align === 'start') return stickerRect.left;
  if (align === 'end') return stickerRect.right - bubbleWidth;
  return stickerRect.left + stickerRect.width / 2 - bubbleWidth / 2;
}

/** Pick above/below and horizontal alignment so the pill stays inside the lid. */
export function resolveLidCaptionLayout(
  lidRect: DOMRectReadOnly,
  stickerRect: DOMRectReadOnly,
  bubbleRect: DOMRectReadOnly
): LidCaptionLayout {
  const spaceAbove = stickerRect.top - lidRect.top;
  const spaceBelow = lidRect.bottom - stickerRect.bottom;
  const edge: CaptionEdge =
    spaceAbove >= bubbleRect.height + CAPTION_GAP_PX || spaceAbove >= spaceBelow ? 'above' : 'below';

  const centerX = stickerRect.left + stickerRect.width / 2;
  const halfW = bubbleRect.width / 2;
  let align: CaptionAlign = 'center';
  if (centerX - halfW < lidRect.left) align = 'start';
  else if (centerX + halfW > lidRect.right) align = 'end';

  const naturalLeft = bubbleLeftForAlign(align, stickerRect, bubbleRect.width);
  const minLeft = lidRect.left;
  const maxLeft = lidRect.right - bubbleRect.width;
  const clampedLeft = Math.min(Math.max(naturalLeft, minLeft), maxLeft);
  const shiftX = clampedLeft - naturalLeft;

  return { edge, align, shiftX };
}
