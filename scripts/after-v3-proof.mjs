/**
 * Captures after-v3 caption PNGs (r4) with geometry checks and optional B1 proof.
 * Usage: node scripts/after-v3-proof.mjs [baseUrl]
 */
import { writeFileSync } from 'node:fs';
import { chromium, devices } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3000';
const artifactDir = '/opt/cursor/artifacts';
const catIds = ['morcega', 'banguela', 'tomada'];
const geometryWidths = [360, 390, 414];
const shotWidths = [360, 414];

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
    for (const id of ids) {
      const bubble = document.querySelector(`.lid button[data-sticker-id="${id}"] .sticker-bubble`);
      if (!bubble) throw new Error(`caption missing: ${id}`);
      const r = bubble.getBoundingClientRect();
      captions[id] = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }
    return {
      lid: { left: lidRect.left, top: lidRect.top, right: lidRect.right, bottom: lidRect.bottom },
      captions
    };
  }, catIds);
}

function analyzeGeometry(geometry) {
  const pairs = [];
  let intersectionCount = 0;
  for (let i = 0; i < catIds.length; i++) {
    for (let j = i + 1; j < catIds.length; j++) {
      const a = catIds[i];
      const b = catIds[j];
      const hit = rectsIntersect(geometry.captions[a], geometry.captions[b]);
      if (hit) intersectionCount += 1;
      pairs.push({ a, b, intersects: hit });
    }
  }
  const insideLid = {};
  let allInside = true;
  for (const id of catIds) {
    const ok = rectInside(geometry.captions[id], geometry.lid);
    insideLid[id] = ok;
    if (!ok) allInside = false;
  }
  return { pairs, intersectionCount, insideLid, allInside };
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

async function captureCaptionsR4(page, width) {
  const lid = await prepareLid(page, width);
  for (const id of catIds) {
    await page.evaluate((stickerId) => {
      for (const bubble of document.querySelectorAll('.lid .sticker-bubble')) {
        bubble.removeAttribute('data-visible');
      }
      const btn = document.querySelector(`.lid button[data-sticker-id="${stickerId}"]`);
      const bubble = btn?.querySelector('.sticker-bubble');
      if (bubble) bubble.setAttribute('data-visible', 'true');
    }, id);
    await page.waitForTimeout(200);
    await lid.screenshot({
      path: `${artifactDir}/after-v3-caption-${id}-${width}-r4.png`
    });
  }
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
    await prepareLid(page, width);
    const geometry = await measureCaptionGeometry(page);
    const analysis = analyzeGeometry(geometry);
    geometryReport.push({ width, ...analysis, geometry });
    if (analysis.intersectionCount !== 0 || !analysis.allInside) {
      throw new Error(`caption geometry failed at ${width}px: ${JSON.stringify(analysis)}`);
    }
  }

  for (const width of shotWidths) {
    await captureCaptionsR4(page, width);
  }

  await prepareLid(page, 390);
  await page.locator('.lid').screenshot({
    path: `${artifactDir}/after-v3-captions-390-r4.png`
  });

  await context.close();
}

writeFileSync(
  `${artifactDir}/after-v3-caption-geometry-r4.json`,
  JSON.stringify(geometryReport, null, 2) + '\n'
);

console.log(
  JSON.stringify(
    geometryReport.map(({ width, intersectionCount, allInside, pairs, insideLid }) => ({
      width,
      intersectionCount,
      allInside,
      pairs,
      insideLid
    })),
    null,
    2
  )
);

await browser.close();
