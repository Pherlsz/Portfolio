export type CaptionEdge = 'above' | 'below';

export type CaptionAlign = 'start' | 'center' | 'end';

export type LidCaptionLayout = {
  edge: CaptionEdge;
  align: CaptionAlign;
};

const CAPTION_GAP_PX = 4;

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

  return { edge, align };
}
