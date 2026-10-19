import type { Certification } from '../data/portfolioData';

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
    <div className="flex min-h-11 items-center gap-3 p-3.5">
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
