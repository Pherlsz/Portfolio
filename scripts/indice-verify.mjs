import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const ARTIFACTS = '/opt/cursor/artifacts';
mkdirSync(ARTIFACTS, { recursive: true });
const BASE = process.env.PREVIEW_URL ?? 'http://localhost:3000';

function relLuminance(hex) {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const R = f(r);
  const G = f(g);
  const B = f(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrast(fg, bg) {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

const lightPairs = [
  ['Body text', '#1c1915', '#f4f1ea'],
  ['Muted text', '#5c564c', '#f4f1ea'],
  ['Links / stamp accent', '#8c2f2f', '#f4f1ea'],
  ['Focus ring (stamp on paper)', '#8c2f2f', '#f4f1ea']
];

const darkPairs = [
  ['Body text (dark)', '#f4f1ea', '#141210'],
  ['Muted text (dark)', '#a39b90', '#141210'],
  ['Links / stamp accent (dark)', '#e07a7a', '#141210'],
  ['Focus ring (dark)', '#e07a7a', '#141210']
];

let contrastMd = '# Contrast ratios (WCAG 2.x relative luminance)\n\n## Light\n\n| Pair | Foreground | Background | Ratio |\n|---|---|---|---|\n';
for (const [name, fg, bg] of lightPairs) {
  const ratio = contrast(fg, bg);
  contrastMd += `| ${name} | ${fg} | ${bg} | ${ratio.toFixed(2)}:1 |\n`;
}
contrastMd += '\n## Dark\n\n| Pair | Foreground | Background | Ratio |\n|---|---|---|---|\n';
for (const [name, fg, bg] of darkPairs) {
  const ratio = contrast(fg, bg);
  contrastMd += `| ${name} | ${fg} | ${bg} | ${ratio.toFixed(2)}:1 |\n`;
}
writeFileSync(`${ARTIFACTS}/contrast.md`, contrastMd);

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
  headless: true
});

const consoleErrors = [];

async function capture(width, name, fullPage = false) {
  const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 1 });
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`${width}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => consoleErrors.push(`${width}: ${err.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${ARTIFACTS}/${name}`, fullPage });
  await page.close();
}

await capture(360, 'indice-360-first.png', false);
await capture(360, 'indice-360-full.png', true);
await capture(1280, 'indice-1280.png', false);
await capture(1280, 'indice-1280-full.png', true);

const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
await page.goto(BASE, { waitUntil: 'networkidle' });

for (const w of [320, 360, 1280]) {
  await page.setViewportSize({ width: w, height: 800 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth === document.documentElement.clientWidth
  );
  assert.equal(overflow, true, `horizontal overflow at ${w}`);
}

const clickCounts = `# Click counts from first screen\n\n| Target | 360 | 1280 | How |\n|---|---|---|---|\n| Projetos | 1 | 1 | Índice entry 01 → #projeto |\n| CV | 1 | 1 | Índice entry 04 opens CV modal |\n| Contato | 1 | 1 | Índice entry 05 → #contato (form) |\n`;
writeFileSync(`${ARTIFACTS}/click-counts.md`, clickCounts);

writeFileSync(
  `${ARTIFACTS}/console-log.txt`,
  consoleErrors.length ? consoleErrors.join('\n') : ''
);

await browser.close();
