import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createArrumarArrangement,
  homeMotionForSlot,
  LID_LAYOUT,
  lidSlotGaps
} from '../src/utils/lidStickerSlots.ts';

const VIEWPORT_WIDTHS = [360, 414, 1280];

test('Arrumar targets match page-load layout', () => {
  const arrangement = createArrumarArrangement(1);
  assert.equal(arrangement.targets, null);
  for (const slot of LID_LAYOUT) {
    assert.deepEqual(homeMotionForSlot(slot), { x: 0, y: 0, rotate: slot.rotate });
  }
});

test('initial lid slots fit inside the lid at common viewports', () => {
  for (const width of VIEWPORT_WIDTHS) {
    const height = width / (16 / 10);
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
