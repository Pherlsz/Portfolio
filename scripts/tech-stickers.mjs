import { writeFileSync, mkdirSync } from 'node:fs';
import { siGo, siNextdotjs, siReact, siTypescript } from 'simple-icons';

mkdirSync('public/stickers', { recursive: true });

function svg(icon) {
  const pad = 28;
  const scale = (128 - pad * 2) / 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-hidden="true">
  <rect x="4" y="4" width="120" height="120" rx="34" fill="#fff"/>
  <g transform="translate(${pad} ${pad}) scale(${scale})">
    <path d="${icon.path}" fill="#${icon.hex}"/>
  </g>
</svg>
`;
}

for (const [name, icon] of [
  ['typescript', siTypescript],
  ['react', siReact],
  ['nextjs', siNextdotjs],
  ['go', siGo]
]) {
  writeFileSync(`public/stickers/${name}.svg`, svg(icon));
  console.log(name, icon.hex);
}
