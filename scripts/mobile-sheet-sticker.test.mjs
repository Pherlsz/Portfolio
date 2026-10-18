import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  initialJobDescriptionEditorState,
  jobDescriptionEditorReducer,
  showCollapsedJobDescription,
  truncateJobDescriptionPreview
} from '../src/utils/jobDescriptionDisclosure.ts';

const assistantSrc = readFileSync(new URL('../src/components/AssistantPanel.tsx', import.meta.url), 'utf8');
const stickersSrc = readFileSync(new URL('../src/components/stickers.tsx', import.meta.url), 'utf8');

test('job description disclosure reducer', () => {
  assert.deepEqual(jobDescriptionEditorReducer(initialJobDescriptionEditorState, { type: 'expand' }), {
    expanded: true
  });
  assert.deepEqual(jobDescriptionEditorReducer({ expanded: true }, { type: 'collapse' }), {
    expanded: false
  });
  assert.deepEqual(jobDescriptionEditorReducer({ expanded: true }, { type: 'job_submitted' }), {
    expanded: false
  });
  assert.deepEqual(jobDescriptionEditorReducer({ expanded: true }, { type: 'clear' }), initialJobDescriptionEditorState);
});

test('showCollapsedJobDescription', () => {
  assert.equal(showCollapsedJobDescription(null, initialJobDescriptionEditorState), false);
  assert.equal(showCollapsedJobDescription('job text', initialJobDescriptionEditorState), true);
  assert.equal(showCollapsedJobDescription('job text', { expanded: true }), false);
});

test('truncateJobDescriptionPreview', () => {
  assert.equal(truncateJobDescriptionPreview('  hello   world  '), 'hello world');
  assert.equal(truncateJobDescriptionPreview('a'.repeat(80)).endsWith('…'), true);
  assert.equal(truncateJobDescriptionPreview('a'.repeat(80)).length, 72);
});

test('AssistantPanel wires disclosure reducer and mobile scroll lock', () => {
  assert.match(assistantSrc, /jobDescriptionEditorReducer/);
  assert.match(assistantSrc, /assistente-vaga-disclosure/);
  assert.match(assistantSrc, /onCancel/);
  assert.match(assistantSrc, /aria-label="Limpar conversa"/);
  assert.match(assistantSrc, /matchMedia\('\(max-width: 639px\)'\)/);
  const scrollLockEffect = assistantSrc.slice(
    assistantSrc.indexOf("matchMedia('(max-width: 639px)')"),
    assistantSrc.indexOf('}, [open]);', assistantSrc.indexOf("matchMedia('(max-width: 639px)')"))
  );
  assert.match(scrollLockEffect, /html\.style\.overflow = 'hidden'/);
  assert.match(scrollLockEffect, /mq\.matches/);
});

test('stickers stop drag on lost pointer capture', () => {
  assert.match(stickersSrc, /useDragControls/);
  assert.match(stickersSrc, /lostpointercapture/);
  assert.match(stickersSrc, /dragControls\.stop\(\)/);
});

test('stickers use numeric drag constraints from room()', () => {
  assert.match(stickersSrc, /roomToDragConstraints/);
  assert.doesNotMatch(stickersSrc, /dragConstraints=\{lidRef\}/);
});
