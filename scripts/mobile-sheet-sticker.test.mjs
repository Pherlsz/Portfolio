import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const assistantSrc = readFileSync(new URL('../src/components/AssistantPanel.tsx', import.meta.url), 'utf8');
const stickersSrc = readFileSync(new URL('../src/components/stickers.tsx', import.meta.url), 'utf8');
const cssSrc = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

test('Fit sheet: history shrinks and mobile Fit composer is height-capped', () => {
  assert.match(
    assistantSrc,
    /role="log"[^>]*className="[^"]*min-h-0[^"]*flex-1/
  );
  assert.match(assistantSrc, /max-h-\[45%\]/);
  assert.match(assistantSrc, /sm:max-h-none sm:overflow-visible/);
});

test('assistant open locks page scroll behind the sheet', () => {
  assert.match(assistantSrc, /html\.style\.overflow = 'hidden'/);
  assert.match(assistantSrc, /body\.style\.overflow = 'hidden'/);
  assert.match(assistantSrc, /html\.style\.overflow = prevHtmlOverflow/);
});

test('Perguntas footer is not height-capped like Fit', () => {
  const chatBranch = assistantSrc.split("mode === 'jobfit' ?")[1]?.split(') : (')[1];
  assert.ok(chatBranch);
  const chatFooter = chatBranch.slice(0, chatBranch.indexOf(')}'));
  assert.doesNotMatch(chatFooter, /max-h-\[45%\]/);
});

test('stickers: hard drag clamp and coarse-pointer lid clip', () => {
  assert.match(stickersSrc, /dragElastic=\{0\}/);
  assert.match(stickersSrc, /touch-none/);
  assert.match(cssSrc, /@media \(pointer: coarse\)[\s\S]*\.lid[\s\S]*overflow: hidden/);
  const lidDefault = cssSrc.slice(cssSrc.indexOf('.lid {'), cssSrc.indexOf('@media (pointer: coarse)'));
  assert.match(lidDefault, /overflow: visible/);
});
