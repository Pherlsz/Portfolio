import { access, rename, stat, unlink } from 'node:fs/promises';
import sharp from 'sharp';

async function toWebp(input, output, { maxEdge, quality }) {
  await access(input);
  const before = await sharp(input).metadata();
  const tmp = `${output}.tmp.webp`;
  await sharp(input)
    .resize(maxEdge, maxEdge, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(tmp);
  await rename(tmp, output);
  const out = await sharp(output).metadata();
  const { size } = await stat(output);
  console.log(
    `${input} ${before.width}x${before.height} -> ${output} ${out.width}x${out.height} ${Math.round(size / 1024)}KB`
  );
}

for (const name of ['morcega', 'banguela', 'tomada', 'd20']) {
  const file = `public/stickers/${name}.webp`;
  await toWebp(file, file, { maxEdge: 320, quality: 70 });
}

const azurePng = 'public/badges/azure-fundamentals.png';
const azureWebp = 'public/badges/azure-fundamentals.webp';
await toWebp(azurePng, azureWebp, { maxEdge: 96, quality: 80 }).catch(() =>
  toWebp(azureWebp, azureWebp, { maxEdge: 96, quality: 80 })
);
await unlink(azurePng).catch(() => {});

const projectJpg = 'public/projects/gymkhana-database-assistente.jpg';
const projectWebp = 'public/projects/gymkhana-database-assistente.webp';
await toWebp(projectJpg, projectWebp, { maxEdge: 960, quality: 72 }).catch(() =>
  toWebp(projectWebp, projectWebp, { maxEdge: 960, quality: 72 })
);
await unlink(projectJpg).catch(() => {});
