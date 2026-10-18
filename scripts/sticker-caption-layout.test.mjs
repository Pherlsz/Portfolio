import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveLidCaptionLayout } from '../src/utils/stickerCaptionLayout.ts';

test('resolveLidCaptionLayout prefers above when there is room', () => {
  const layout = resolveLidCaptionLayout(
    { left: 0, top: 0, right: 300, bottom: 200, width: 300, height: 200, x: 0, y: 0, toJSON: () => '' },
    { left: 50, top: 80, right: 150, bottom: 160, width: 100, height: 80, x: 0, y: 0, toJSON: () => '' },
    { left: 70, top: 40, right: 130, bottom: 72, width: 60, height: 32, x: 0, y: 0, toJSON: () => '' }
  );
  assert.equal(layout.edge, 'above');
});

test('resolveLidCaptionLayout flips below when the top is tight', () => {
  const layout = resolveLidCaptionLayout(
    { left: 0, top: 0, right: 300, bottom: 200, width: 300, height: 200, x: 0, y: 0, toJSON: () => '' },
    { left: 50, top: 10, right: 150, bottom: 90, width: 100, height: 80, x: 0, y: 0, toJSON: () => '' },
    { left: 70, top: 0, right: 130, bottom: 32, width: 60, height: 32, x: 0, y: 0, toJSON: () => '' }
  );
  assert.equal(layout.edge, 'below');
});
