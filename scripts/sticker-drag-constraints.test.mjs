import assert from 'node:assert/strict';
import { test } from 'node:test';
import { roomToDragConstraints, ZERO_DRAG_CONSTRAINTS } from '../src/utils/stickerDragConstraints.ts';

test('roomToDragConstraints maps room offsets to motion axes', () => {
  assert.deepEqual(roomToDragConstraints({ left: -12, right: 48, up: -5, down: 90 }, { x: 0, y: 0 }), {
    left: -12,
    right: 48,
    top: -5,
    bottom: 90
  });
});

test('roomToDragConstraints accounts for current motion offset', () => {
  assert.deepEqual(roomToDragConstraints({ left: -50, right: 10, up: 0, down: 0 }, { x: -100, y: 0 }), {
    left: -150,
    right: -90,
    top: 0,
    bottom: 0
  });
});

test('ZERO_DRAG_CONSTRAINTS is neutral', () => {
  assert.deepEqual(ZERO_DRAG_CONSTRAINTS, { left: 0, right: 0, top: 0, bottom: 0 });
});
