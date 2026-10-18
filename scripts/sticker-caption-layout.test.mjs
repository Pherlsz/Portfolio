import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  lidCatCaptionPlacement,
  lidStickerCaptionPlacement
} from '../src/utils/stickerCaptionLayout.ts';

test('lid cat captions use non-overlapping coarse layout', () => {
  assert.deepEqual(lidCatCaptionPlacement('morcega'), { mode: 'beside', side: 'end' });
  assert.deepEqual(lidCatCaptionPlacement('banguela'), { mode: 'stack', edge: 'below', align: 'start' });
  assert.deepEqual(lidCatCaptionPlacement('tomada'), { mode: 'beside', side: 'end' });
});

test('lidStickerCaptionPlacement keeps stack heuristics for other stickers', () => {
  assert.deepEqual(lidStickerCaptionPlacement({ x: 83, y: 14, w: 11 }), {
    mode: 'stack',
    edge: 'below',
    align: 'end'
  });
});
