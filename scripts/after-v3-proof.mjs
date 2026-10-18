/**
 * Caption geometry checks (r5) and combined lid screenshots on coarse pointers.
 * Usage: node scripts/after-v3-proof.mjs [baseUrl]
 */
import { writeFileSync } from 'node:fs';
import { chromium, devices } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3000';
const artifactDir = '/opt/cursor/artifacts';
const catIds = ['morcega', 'banguela', 'tomada'];
const geometryWidths = [360, 390, 414];

function rectsIntersect(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function rectInside(inner, outer, epsilon = 0.5) {
  return (
    inner.left >= outer.left - epsilon &&
    inner.top >= outer.top - epsilon &&
    inner.right <= outer.right + epsilon &&
    inner.bottom <= outer.bottom + epsilon
  );
}

async function measureCaptionGeometry(page) {
  return page.evaluate((ids) => {
    const lid = document.querySelector('.lid');
    if (!lid) throw new Error('lid missing');
    const lidRect = lid.getBoundingClientRect();
    const captions = {};
    const stickers = {};
    for (const btn of document.querySelectorAll('.lid button[data-sticker-id]')) {
      const id = btn.getAttribute('data-sticker-id');
      const art = btn.querySelector('.sticker-art') ?? btn;
      const r = art.getBoundingClientRect();
      stickers[id] = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }
    for (const id of ids) {
      const bubble = document.querySelector(`.lid button[data-sticker-id="${id}"] .sticker-bubble`);
      if (!bubble) throw new Error(`caption missing: ${id}`);
      const r = bubble.getBoundingClientRect();
      captions[id] = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }
    return {
      lid: { left: lidRect.left, top: lidRect.top, right: lidRect.right, bottom: lidRect.bottom },
      captions,
      stickers
    };
  }, catIds);
}

function analyzeGeometry(geometry) {
  const captionPairs = [];
  let captionIntersectionCount = 0;
  for (let i = 0; i < catIds.length; i++) {
    for (let j = i + 1; j < catIds.length; j++) {
      const a = catIds[i];
      const b = catIds[j];
      const hit = rectsIntersect(geometry.captions[a], geometry.captions[b]);
      if (hit) captionIntersectionCount += 1;
      captionPairs.push({ a, b, intersects: hit });
    }
  }

  const captionStickerPairs = [];
  let captionStickerIntersectionCount = 0;
  for (const captionId of catIds) {
    for (const [stickerId, stickerRect] of Object.entries(geometry.stickers)) {
      if (stickerId === captionId) continue;
      const hit = rectsIntersect(geometry.captions[captionId], stickerRect);
      if (hit) captionStickerIntersectionCount += 1;
      captionStickerPairs.push({ caption: captionId, sticker: stickerId, intersects: hit });
    }
  }

  const insideLid = {};
  let allInside = true;
  for (const id of catIds) {
    const ok = rectInside(geometry.captions[id], geometry.lid);
    insideLid[id] = ok;
    if (!ok) allInside = false;
  }

  return {
    captionPairs,
    captionIntersectionCount,
    captionStickerPairs,
    captionStickerIntersectionCount,
    insideLid,
    allInside
  };
}

async function prepareLid(page, width) {
  const height = width >= 414 ? 896 : 740;
  await page.setViewportSize({ width, height });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const lid = page.locator('.lid');
  await lid.waitFor({ state: 'visible' });
  await lid.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  return lid;
}

const browser = await chromium.launch();
const geometryReport = [];

{
  const context = await browser.newContext({
    ...devices['Pixel 5'],
    hasTouch: true,
    isMobile: true
  });
  const page = await context.newPage();

  for (const width of geometryWidths) {
    const lid = await prepareLid(page, width);
    const geometry = await measureCaptionGeometry(page);
    const analysis = analyzeGeometry(geometry);
    geometryReport.push({ width, ...analysis, geometry });
    const failed =
      analysis.captionIntersectionCount !== 0 ||
      analysis.captionStickerIntersectionCount !== 0 ||
      !analysis.allInside;
    if (failed) {
      throw new Error(`caption geometry failed at ${width}px: ${JSON.stringify(analysis)}`);
    }
    await lid.screenshot({
      path: `${artifactDir}/after-v3-captions-${width}-r5.png`
    });
  }

  await context.close();
}

writeFileSync(
  `${artifactDir}/after-v3-caption-geometry-r5.json`,
  JSON.stringify(geometryReport, null, 2) + '\n'
);

console.log(
  JSON.stringify(
    geometryReport.map(
      ({
        width,
        captionIntersectionCount,
        captionStickerIntersectionCount,
        allInside,
        captionPairs,
        captionStickerPairs,
        insideLid
      }) => ({
        width,
        captionIntersectionCount,
        captionStickerIntersectionCount,
        allInside,
        captionPairs,
        captionStickerPairs,
        insideLid
      })
    ),
    null,
    2
  )
);

await browser.close();
