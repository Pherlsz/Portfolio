import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE_DIR = 'design/raw';
const OUTPUT_DIR = 'public/stickers';
const MAX_SIZE = 512;

// A pixel is background when it sits on the color line between the flat
// background and the white die-cut border. Sticker art is off that line, so the
// flood fill from the image edges stops at the border instead of leaking inside.
const MAX_WHITENESS = 0.85;
const MAX_OFF_LINE = 70;
// Enclosed holes (a mug handle) only count as background when their pixels are
// almost exactly the background color and they are ringed by the white border.
const MAX_HOLE_DISTANCE = 35;
const MIN_HOLE_WHITE_RING = 0.8;

function sampleBackground(data, width, height) {
  const patch = 8;
  const corners = [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch]
  ];
  const sum = [0, 0, 0];
  let count = 0;
  for (const [x0, y0] of corners) {
    for (let y = y0; y < y0 + patch; y++) {
      for (let x = x0; x < x0 + patch; x++) {
        const o = (y * width + x) * 4;
        sum[0] += data[o];
        sum[1] += data[o + 1];
        sum[2] += data[o + 2];
        count++;
      }
    }
  }
  return sum.map((s) => s / count);
}

async function cutOut(file) {
  const { data, info } = await sharp(path.join(SOURCE_DIR, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const total = width * height;

  const bg = sampleBackground(data, width, height);
  const axis = bg.map((c) => 255 - c);
  const axisLengthSq = axis[0] ** 2 + axis[1] ** 2 + axis[2] ** 2;
  const whiteness = new Float32Array(total);
  const passable = new Uint8Array(total);
  const onLine = new Uint8Array(total);
  const nearBackground = new Uint8Array(total);

  for (let i = 0; i < total; i++) {
    const o = i * 4;
    const d0 = data[o] - bg[0];
    const d1 = data[o + 1] - bg[1];
    const d2 = data[o + 2] - bg[2];
    const a = (d0 * axis[0] + d1 * axis[1] + d2 * axis[2]) / axisLengthSq;
    const off = Math.hypot(d0 - a * axis[0], d1 - a * axis[1], d2 - a * axis[2]);
    whiteness[i] = a;
    onLine[i] = off < MAX_OFF_LINE ? 1 : 0;
    passable[i] = onLine[i] && a < MAX_WHITENESS ? 1 : 0;
    nearBackground[i] = Math.hypot(d0, d1, d2) < MAX_HOLE_DISTANCE ? 1 : 0;

    // Generated images sometimes carry a stray 1–2 px line on the edges; it is always background.
    const x = i % width;
    const y = (i - x) / width;
    if (x < 2 || y < 2 || x >= width - 2 || y >= height - 2) {
      passable[i] = 1;
      whiteness[i] = 0;
    }
  }

  const neighbors = (i, visit) => {
    const x = i % width;
    if (x > 0) visit(i - 1);
    if (x < width - 1) visit(i + 1);
    if (i >= width) visit(i - width);
    if (i < total - width) visit(i + width);
  };

  // 1 = background reached from the image edges or an enclosed hole, 2 = rejected hole.
  const visited = new Uint8Array(total);
  const stack = new Int32Array(total);
  const fill = (seeds, mark) => {
    const region = [];
    let top = 0;
    let ringWhite = 0;
    let ringOther = 0;
    const push = (i) => {
      if (visited[i]) return;
      if (!passable[i]) {
        if (onLine[i] && whiteness[i] >= MAX_WHITENESS) ringWhite++;
        else ringOther++;
        return;
      }
      visited[i] = mark;
      stack[top++] = i;
      region.push(i);
    };
    seeds.forEach(push);
    while (top > 0) neighbors(stack[--top], push);
    return { region, whiteRing: ringWhite / Math.max(1, ringWhite + ringOther) };
  };

  const edges = [];
  for (let x = 0; x < width; x++) edges.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) edges.push(y * width, y * width + width - 1);
  fill(edges, 1);

  for (let i = 0; i < total; i++) {
    if (visited[i] || !nearBackground[i] || !passable[i]) continue;
    const { region, whiteRing } = fill([i], 1);
    if (whiteRing < MIN_HOLE_WHITE_RING) region.forEach((j) => (visited[j] = 2));
  }

  for (let i = 0; i < total; i++) {
    const o = i * 4;
    if (visited[i] === 1) {
      data[o] = data[o + 1] = data[o + 2] = 255;
      data[o + 3] = Math.round(255 * Math.min(1, Math.max(0, whiteness[i] / MAX_WHITENESS)));
      continue;
    }
    // Remove the background tint from the outermost ring of the white border.
    const x = i % width;
    const touchesBackground =
      (x > 0 && visited[i - 1] === 1) ||
      (x < width - 1 && visited[i + 1] === 1) ||
      (i >= width && visited[i - width] === 1) ||
      (i < total - width && visited[i + width] === 1);
    if (touchesBackground && onLine[i] && whiteness[i] > 0.5) {
      data[o] = data[o + 1] = data[o + 2] = 255;
    }
  }

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < total; i++) {
    if (data[i * 4 + 3] > 128) {
      const x = i % width;
      const y = (i - x) / width;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  // The bounding box only counts solid pixels; the padding keeps the anti-aliased border edge.
  const pad = 4;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  return sharp(data, { raw: { width, height, channels: 4 } }).extract({
    left,
    top,
    width: Math.min(width - 1, maxX + pad) - left + 1,
    height: Math.min(height - 1, maxY + pad) - top + 1
  });
}

await mkdir(OUTPUT_DIR, { recursive: true });
const files = (await readdir(SOURCE_DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f));

for (const file of files) {
  const name = path.parse(file).name;
  const sticker = await (await cutOut(file)).png().toBuffer();
  const output = sharp(sticker).resize(MAX_SIZE, MAX_SIZE, { fit: 'inside' });
  const { width, height } = await output
    .clone()
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(path.join(OUTPUT_DIR, `${name}.webp`));
  console.log(`${name}.webp ${width}x${height}`);

  if (name === 'morcega') {
    await sharp(sticker)
      .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile('public/favicon.png');
    await sharp(sticker)
      .resize(150, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 15, bottom: 15, left: 15, right: 15, background: '#E3E5E8' })
      .flatten({ background: '#E3E5E8' })
      .png()
      .toFile('public/apple-touch-icon.png');
    console.log('favicon.png, apple-touch-icon.png');
  }
}
