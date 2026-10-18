import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stickerCaptionAlign, stickerCaptionEdge } from '../src/utils/stickerCaptionLayout.ts';

test('stickerCaptionAlign keeps left stickers start-aligned', () => {
  assert.equal(stickerCaptionAlign({ x: 3, y: 12, w: 20 }), 'start');
  assert.equal(stickerCaptionAlign({ x: 4, y: 58, w: 15 }), 'start');
  assert.equal(stickerCaptionAlign({ x: 36, y: 70, w: 22 }), 'start');
});

test('stickerCaptionEdge lifts bottom-row captions above art', () => {
  assert.equal(stickerCaptionEdge({ x: 3, y: 12, w: 20 }), 'below');
  assert.equal(stickerCaptionEdge({ x: 4, y: 58, w: 15 }), 'above');
  assert.equal(stickerCaptionEdge({ x: 36, y: 70, w: 22 }), 'above');
});
