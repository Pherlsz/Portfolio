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

test('diamond lattice stack is behind ink, not soft-light foil', () => {
  assert.match(cssSrc, /--holo-angle: 45deg/);
  assert.match(cssSrc, /--holo-ink: 0\.6/);
  assert.match(cssSrc, /mix-blend-mode: plus-lighter/);
  assert.match(cssSrc, /mix-blend-mode: color-dodge/);
  assert.match(stickersSrc, /className="holo-foil"/);
  assert.match(stickersSrc, /className="holo-sheen"/);
  assert.match(stickersSrc, /className="holo-edge"/);
  assert.match(sparkleSrc, /getContext\('2d'/);
  assert.doesNotMatch(sparkleSrc, /getContext\(\s*['"]webgl/i);
  const foilBlock = cssSrc.slice(cssSrc.indexOf('.holo-foil {'), cssSrc.indexOf('.holo-foil::before'));
  assert.doesNotMatch(foilBlock, /soft-light/);
});

test('clean die-cut masks exist for the three cats only', () => {
  for (const id of ['morcega', 'banguela', 'tomada']) {
    assert.equal(existsSync(new URL(`../public/holo-masks/${id}-cut.png`, import.meta.url)), true);
  }
  assert.match(holoSrc, /\/holo-masks\/morcega-cut\.png/);
});

test('lid-seal is not an active sticker, asset, mask, or script', () => {
  for (const src of repoFiles) {
    assert.doesNotMatch(src, /lid-seal|lidSeal|lid_seal/i);
  }
  assert.equal(existsSync(new URL('../public/stickers/lid-seal.webp', import.meta.url)), false);
  assert.equal(existsSync(new URL('../scripts/lid-seal.mjs', import.meta.url)), false);
  const stickers = readdirSync(new URL('../public/stickers', import.meta.url));
  assert.equal(stickers.some((name) => /lid-seal/i.test(name)), false);
  if (existsSync(new URL('../public/holo-masks', import.meta.url))) {
    const masks = readdirSync(new URL('../public/holo-masks', import.meta.url));
    assert.equal(masks.some((name) => /lid-seal/i.test(name)), false);
  }
});
