import {
  siDocker,
  siDotnet,
  siGithubactions,
  siGo,
  siNextdotjs,
  siNodedotjs,
  siPython,
  siReact,
  siReactquery,
  siRedux,
  siTailwindcss,
  siTypescript
} from 'simple-icons';
import type { Certification } from '../data/portfolioData';

const SKILL_ICONS: Record<string, { path: string; hex: string }> = {
  TypeScript: siTypescript,
  React: siReact,
  'Next.js': siNextdotjs,
  'Tailwind CSS': siTailwindcss,
  'TanStack Query': siReactquery,
  Redux: siRedux,
  Python: siPython,
  Go: siGo,
  'Node.js': siNodedotjs,
  '.NET': siDotnet,
  Docker: siDocker,
  'GitHub Actions': siGithubactions
};

function VitestMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-4 shrink-0" aria-hidden="true">
      <path
        fill="#729b1b"
        d="M21.088 8.304 12.064 24.464a4 4 0 0 1-6.928 0L.112 13.088A4 4 0 0 1 3.576 7h6.848a4 4 0 0 1 3.464 2l1.2 2.08 2.496-4.32a4 4 0 0 1 3.504-2z"
      />
      <path
        fill="#fcc72b"
        d="m31.888 13.088-5.024 8.704a4 4 0 0 1-5.48 1.216 4 4 0 0 1-1.216-5.472l5.024-8.704A4 4 0 0 1 28.656 7h.008a4 4 0 0 1 3.224 6.088z"
      />
    </svg>
  );
}

export function SkillBadge({ name }: { name: string }) {
  const icon = SKILL_ICONS[name];
  const fill = !icon || icon.hex === '000000' ? 'currentColor' : `#${icon.hex}`;

  return (
    <li className="inline-flex min-h-11 items-center gap-2 border-b border-line px-1 py-2 text-[0.9375rem]">
      {name === 'Vitest' ? (
        <VitestMark />
      ) : icon ? (
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" aria-hidden="true">
          <path d={icon.path} fill={fill} />
        </svg>
      ) : null}
      {name}
    </li>
  );
}

function certParts(cert: Certification) {
  const cut = cert.name.indexOf(': ');
  if (cut > 0) {
    return { series: cert.name.slice(0, cut), title: cert.name.slice(cut + 2) };
  }
  return { series: cert.badge.caption || cert.issuer, title: cert.name };
}

export function CertBadge({ cert }: { cert: Certification }) {
  const { badge } = cert;
  const { series, title } = certParts(cert);
  const isHex = badge.shape === 'hexagon';
  const inner = (
    <div className="flex items-center gap-3 p-3.5">
      {cert.image ? (
        <img
          src={cert.image}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          className="size-12 shrink-0 object-contain"
        />
      ) : (
        <svg
          viewBox={isHex ? '0 0 80 88' : '0 0 80 80'}
          className={isHex ? 'h-12 w-[2.65rem] shrink-0' : 'size-12 shrink-0'}
          aria-hidden="true"
        >
          {isHex ? (
            <polygon points="40,4 75,23 75,65 40,84 5,65 5,23" fill={badge.color} />
          ) : (
            <circle cx="40" cy="40" r="36" fill={badge.color} />
          )}
          <text
            x="40"
            y={isHex ? 50 : 46}
            textAnchor="middle"
            fill="var(--poster-ink)"
            fontSize="11"
            fontWeight="800"
            fontFamily="var(--font-display)"
          >
            {badge.code}
          </text>
        </svg>
      )}
      <div className="min-w-0">
        <p className="eyebrow">{series}</p>
        <p className="mt-0.5 font-bold leading-snug">{title}</p>
        <p className="eyebrow mt-1">
          {badge.code === cert.issuer ? `${cert.issuer} · ${cert.year}` : `${cert.issuer} · ${badge.code} · ${cert.year}`}
        </p>
      </div>
    </div>
  );

  return (
    <li className="overflow-hidden border border-line">
      {cert.href ? (
        <a href={cert.href} target="_blank" rel="noreferrer" className="block hover:bg-paper/60">
          {inner}
        </a>
      ) : (
        inner
      )}
    </li>
  );
}
