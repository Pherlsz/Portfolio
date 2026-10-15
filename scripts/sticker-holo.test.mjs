import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const holoSrc = readFileSync(new URL('../src/utils/stickerHolo.ts', import.meta.url), 'utf8');
const stickersSrc = readFileSync(new URL('../src/components/stickers.tsx', import.meta.url), 'utf8');
const cssSrc = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const pointerSrc = readFileSync(new URL('../src/utils/holoPointer.ts', import.meta.url), 'utf8');
const sparkleSrc = readFileSync(new URL('../src/components/HoloSparkleCanvas.tsx', import.meta.url), 'utf8');
const repoFiles = [holoSrc, stickersSrc, cssSrc, pointerSrc, sparkleSrc];

function rollHolo(random, allOdds = 1 / 100, singleOdds = 0) {
  if (random() < allOdds) return { mode: 'all', id: null };
  if (singleOdds > 0 && random() < singleOdds) {
    return { mode: 'single', id: 'morcega' };
  }
  return { mode: 'none', id: null };
}

test('v2 schema, all-three odds, single permanently off', () => {
  assert.match(holoSrc, /HOLO_SCHEMA_VERSION = 2/);
  assert.match(holoSrc, /ALL_ODDS = 1 \/ 100/);
  assert.match(holoSrc, /SINGLE_ODDS = 0/);
  assert.match(holoSrc, /record\.v !== HOLO_SCHEMA_VERSION/);
  assert.match(holoSrc, /HOLO_ELIGIBLE_LID_STICKER_IDS = \['morcega', 'banguela', 'tomada'\]/);
});

test('rollHolo: rng below ALL_ODDS is all; otherwise none; SINGLE_ODDS 0 never single', () => {
  assert.equal(rollHolo(() => 0.009).mode, 'all');
  assert.equal(rollHolo(() => 0.01).mode, 'none');
  assert.equal(rollHolo(() => 0.5).mode, 'none');
  for (let i = 0; i < 20; i++) {
    assert.notEqual(rollHolo(() => 0.5 + i / 100).mode, 'single');
  }
});

test('DEV query overrides do not write sessionStorage', () => {
  assert.match(holoSrc, /if \(dev\) return dev;/);
  assert.doesNotMatch(
    holoSrc,
    /if \(dev\) \{\s*writeStickerHoloToSession\(dev\)/
  );
});

test('recipe #1: prismatic film behind ink, no gutters or linear stripe', () => {
  assert.match(cssSrc, /--holo-ink: 0\.66/);
  assert.match(cssSrc, /repeating-linear-gradient\(\s*115deg/);
  assert.match(cssSrc, /perspective\(800px\)/);
  assert.match(cssSrc, /feTurbulence/);
  assert.match(cssSrc, /hsl\(0 0% 100% \/ 0\.12\)/);
  assert.match(stickersSrc, /className="holo-foil"/);
  assert.match(stickersSrc, /className="holo-sheen"/);
  assert.match(sparkleSrc, /getContext\('2d'/);
  assert.doesNotMatch(sparkleSrc, /getContext\(\s*['"]webgl/i);
  assert.doesNotMatch(cssSrc, /holo-gutter/);
  const foilBlock = cssSrc.slice(cssSrc.indexOf('.holo-foil {'), cssSrc.indexOf('.holo-foil::after'));
  assert.doesNotMatch(foilBlock, /soft-light|color-dodge|mix-blend-mode/);
  const sheenBlock = cssSrc.slice(cssSrc.indexOf('.holo-sheen {'), cssSrc.indexOf('.holo-sparkle {'));
  assert.doesNotMatch(sheenBlock, /linear-gradient/);
  assert.doesNotMatch(sheenBlock, /color-dodge|soft-light/);
});

test('clean die-cut rasters exist; cats keep dedicated holo masks', () => {
  for (const id of ['morcega', 'banguela', 'tomada', 'cafe', 'd20', 'dossie', 'halter']) {
    assert.equal(existsSync(new URL(`../public/stickers/${id}.webp`, import.meta.url)), true);
  }
  for (const id of ['morcega', 'banguela', 'tomada']) {
    assert.equal(existsSync(new URL(`../public/holo-masks/${id}-cut.png`, import.meta.url)), true);
  }
  assert.match(holoSrc, /\/holo-masks\/morcega-cut\.png/);
  const svgs = readdirSync(new URL('../public/stickers', import.meta.url)).filter((name) => name.endsWith('.svg'));
  assert.deepEqual(svgs.sort(), ['nextjs.svg', 'react.svg', 'typescript.svg']);
});

test('unused notebook-seal sticker is not in the repo', () => {
  const name = ['lid', 'seal'].join('-');
  assert.doesNotMatch(stickersSrc, new RegExp(name));
  assert.doesNotMatch(holoSrc, new RegExp(name));
  assert.equal(existsSync(new URL(`../public/stickers/${name}.webp`, import.meta.url)), false);
  assert.equal(existsSync(new URL(`../design/raw/${name}.jpg`, import.meta.url)), false);
  assert.equal(existsSync(new URL(`../scripts/${name}.mjs`, import.meta.url)), false);
});
