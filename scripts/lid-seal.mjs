import sharp from 'sharp';
import path from 'node:path';

const SRC = process.argv[2];
const DEST = process.argv[3] ?? 'public/stickers/lid-seal.webp';

if (!SRC) {
  console.error('uso: node scripts/lid-seal.mjs <origem> [destino]');
  process.exit(1);
}

const MAGENTA = { r: 255, g: 0, b: 255 };
const KEY_DISTANCE = 95;
const LID = { r: 200, g: 204, b: 209 };

function dist(r, g, b, target) {
  return Math.hypot(r - target.r, g - target.g, b - target.b);
}

const { data, info } = await sharp(path.resolve(SRC)).ensureAlpha().raw().toBuffer({
  resolveWithObject: true
});
const { width, height } = info;
const total = width * height;

const corner = (x, y) => {
  const o = (y * width + x) * 4;
  return { r: data[o], g: data[o + 1], b: data[o + 2] };
};
const bgSamples = [corner(2, 2), corner(width - 3, 2), corner(2, height - 3), corner(width - 3, height - 3)];
const bg = {
  r: bgSamples.reduce((s, c) => s + c.r, 0) / bgSamples.length,
  g: bgSamples.reduce((s, c) => s + c.g, 0) / bgSamples.length,
  b: bgSamples.reduce((s, c) => s + c.b, 0) / bgSamples.length
};

for (let i = 0; i < total; i++) {
  const o = i * 4;
  const r = data[o];
  const g = data[o + 1];
  const b = data[o + 2];
  const magenta = dist(r, g, b, MAGENTA);
  const sampled = dist(r, g, b, bg);
  if (magenta < KEY_DISTANCE || sampled < KEY_DISTANCE) {
    data[o + 3] = 0;
    continue;
  }
  // Soft edge against the key.
  const nearest = Math.min(magenta, sampled);
  if (nearest < KEY_DISTANCE + 28) {
    data[o + 3] = Math.round(data[o + 3] * ((nearest - KEY_DISTANCE) / 28));
  }

  // Despill residual magenta on the silhouette edge.
  if (r > g + 12 && r > b + 12) {
    const spill = Math.min(r - g, r - b);
    data[o] = r - spill;
  }

  const luma = 0.2126 * data[o] + 0.7152 * g + 0.0722 * b;
  const t = Math.min(1, Math.max(0, (luma - 72) / 128));
  const shade = 0.52 + t * 0.5;
  data[o] = Math.round(LID.r * shade);
  data[o + 1] = Math.round(LID.g * shade);
  data[o + 2] = Math.round(LID.b * shade);
}

let minX = width;
let minY = height;
let maxX = 0;
let maxY = 0;
for (let i = 0; i < total; i++) {
  if (data[i * 4 + 3] > 16) {
    const x = i % width;
    const y = (i - x) / width;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}

const pad = 6;
const left = Math.max(0, minX - pad);
const top = Math.max(0, minY - pad);
const cropW = Math.min(width - 1, maxX + pad) - left + 1;
const cropH = Math.min(height - 1, maxY + pad) - top + 1;
const faceH = Math.round(cropH * 0.62);

const cropped = await sharp(data, { raw: { width, height, channels: 4 } })
  .extract({ left, top, width: cropW, height: Math.min(faceH, cropH) })
  .resize(512, 512, { fit: 'inside' })
  .webp({ quality: 90, alphaQuality: 100, effort: 6 })
  .toFile(path.resolve(DEST));

console.log(`${DEST} ${cropped.width}x${cropped.height}`);
