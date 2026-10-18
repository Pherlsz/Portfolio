import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createArrumarArrangement,
  LID_ASPECT,
  LID_LAYOUT,
  STICKER_HEIGHT_OVER_WIDTH
} from '../src/utils/lidStickerSlots.ts';

const VIEWPORT_WIDTHS = [360, 414, 1280];

function stickerHeightPercentY(slot) {
  return slot.w * LID_ASPECT * STICKER_HEIGHT_OVER_WIDTH[slot.id];
}

function lidSlotGaps(slot) {
  const heightY = stickerHeightPercentY(slot);
  return {
    left: slot.x,
    right: 100 - (slot.x + slot.w),
    top: slot.y,
    bottom: 100 - (slot.y + heightY)
  };
}

test('Arrumar resets motion to each initial slot in LID_LAYOUT', () => {
  const arrangement = createArrumarArrangement(1);
  assert.equal(arrangement.targets, null);
  for (const slot of LID_LAYOUT) {
    const expected = { x: 0, y: 0, rotate: slot.rotate };
    const fromLayout = LID_LAYOUT.find((entry) => entry.id === slot.id);
    assert.ok(fromLayout);
    assert.deepEqual(expected, { x: 0, y: 0, rotate: fromLayout.rotate });
  }
});

test('initial lid slots fit inside the lid at common viewports', () => {
  for (const width of VIEWPORT_WIDTHS) {
    const height = width / LID_ASPECT;
    for (const slot of LID_LAYOUT) {
      const gaps = lidSlotGaps(slot);
      const px = {
        left: (gaps.left / 100) * width,
        right: (gaps.right / 100) * width,
        top: (gaps.top / 100) * height,
        bottom: (gaps.bottom / 100) * height
      };
      assert.ok(px.left >= -0.5, `${slot.id}@${width} left ${px.left}`);
      assert.ok(px.right >= -0.5, `${slot.id}@${width} right ${px.right}`);
      assert.ok(px.top >= -0.5, `${slot.id}@${width} top ${px.top}`);
      assert.ok(px.bottom >= -0.5, `${slot.id}@${width} bottom ${px.bottom}`);
    }
  }
});
