import React, { useState } from 'react';
import { CertificationBadge } from '../data/portfolioData';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface CreativeCertBadgesProps {
  certifications: CertificationBadge[];
}

const BadgeVectorInsignia: React.FC<{
  shape: CertificationBadge['badgeShape'];
  accent: string;
  code: string;
  year: string;
  isVerifiedPulse: boolean;
}> = ({ shape, accent, code, year, isVerifiedPulse }) => {
  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0 select-none">
      <svg
        viewBox="0 0 120 120"
        className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
          isVerifiedPulse ? 'rotate-12 scale-110' : ''
        }`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`grad-${code}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {shape === 'octagon' && (
          <>
            <polygon
              points="38,8 82,8 112,38 112,82 82,112 38,112 8,82 8,38"
              fill={`url(#grad-${code})`}
              stroke={accent}
              strokeWidth="2.2"
            />
            <polygon
              points="42,16 78,16 104,42 104,78 78,104 42,104 16,78 16,42"
              fill="none"
              stroke={accent}
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.7"
            />
          </>
        )}

        {shape === 'hexagon' && (
          <>
            <polygon
              points="60,6 108,33 108,87 60,114 12,87 12,33"
              fill={`url(#grad-${code})`}
              stroke={accent}
              strokeWidth="2.2"
            />
            <polygon
              points="60,15 99,38 99,82 60,105 21,82 21,38"
              fill="none"
              stroke={accent}
              strokeWidth="1"
              strokeDasharray="4 2"
              opacity="0.7"
            />
          </>
        )}

        {shape === 'shield' && (
          <>
            <path
              d="M60 8 L106 24 L106 60 C106 88 84 106 60 114 C36 106 14 88 14 60 L14 24 Z"
              fill={`url(#grad-${code})`}
              stroke={accent}
              strokeWidth="2.2"
            />
            <path
              d="M60 17 L97 30 L97 59 C97 82 79 97 60 104 C41 97 23 82 23 59 L23 30 Z"
              fill="none"
              stroke={accent}
              strokeWidth="1"
              opacity="0.65"
            />
          </>
        )}

        {shape === 'diamond' && (
          <>
            <polygon
              points="60,6 114,60 60,114 6,60"
              fill={`url(#grad-${code})`}
              stroke={accent}
              strokeWidth="2.2"
            />
            <polygon
              points="60,18 102,60 60,102 18,60"
              fill="none"
              stroke={accent}
              strokeWidth="1"
              strokeDasharray="2 3"
              opacity="0.75"
            />
          </>
        )}

        {shape === 'crest' && (
          <>
            <circle
              cx="60"
              cy="60"
              r="51"
              fill={`url(#grad-${code})`}
              stroke={accent}
              strokeWidth="2.2"
            />
            <circle
              cx="60"
              cy="60"
              r="43"
              fill="none"
              stroke={accent}
              strokeWidth="1"
              strokeDasharray="6 3"
              opacity="0.75"
            />
          </>
        )}

        <text
          x="60"
          y="55"
          textAnchor="middle"
          fill="currentColor"
          className="font-mono text-[11px] font-semibold tracking-widest"
        >
          {code.split('-').slice(0, 2).join('·')}
        </text>
        <line
          x1="36"
          y1="63"
          x2="84"
          y2="63"
          stroke={accent}
          strokeWidth="1"
          opacity="0.6"
        />
        <text
          x="60"
          y="77"
          textAnchor="middle"
          fill={accent}
          className="font-mono text-[10px] font-bold"
        >
          {year}
        </text>
      </svg>
    </div>
  );
};

export const CreativeCertBadges: React.FC<CreativeCertBadgesProps> = ({ certifications }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({});

  const triggerVerify = (id: string) => {
    setVerifiedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered =
    selectedCategory === 'all'
      ? certifications
      : certifications.filter((c) => c.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
          role="tablist"
          aria-label="Filtrar certificações por domínio"
        >
          {[
            { id: 'all', label: 'Todas Insígnias' },
            { id: 'frontend', label: 'Frontend & UX' },
            { id: 'ai', label: 'Agentes IA' },
            { id: 'architecture', label: 'Cloud & Sistemas' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selectedCategory === tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === tab.id
                  ? 'bg-[#E11D48] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((cert, index) => {
          const isVerified = !!verifiedMap[cert.id];
          return (
            <article
              key={cert.id}
              onClick={() => triggerVerify(cert.id)}
              itemScope
              itemType="https://schema.org/EducationalOccupationalCredential"
              className="group cursor-pointer relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-zinc-500/60 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <BadgeVectorInsignia
                  shape={cert.badgeShape}
                  accent={cert.accentColor}
                  code={cert.credentialCode}
                  year={cert.issuedDate}
                  isVerifiedPulse={isVerified}
                />

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--text-muted)] tabular-nums">
                    <span>0{index + 1}</span>
                    <span aria-hidden="true">·</span>
                    <span itemProp="recognizedBy">{cert.issuer}</span>
                    <span aria-hidden="true">·</span>
                    <span itemProp="dateCreated">{cert.issuedDate}</span>
                  </div>

                  <h3
                    itemProp="name"
                    className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]"
                  >
                    {cert.title}
                  </h3>

                  <p
                    itemProp="description"
                    className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed"
                  >
                    {cert.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-secondary)] font-mono">
                  {cert.skills.map((skill, sIdx) => (
                    <React.Fragment key={skill}>
                      <span>{skill}</span>
                      {sIdx < cert.skills.length - 1 && (
                        <span aria-hidden="true" className="text-[var(--text-muted)]">
                          ·
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <span className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1">
                  {isVerified ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#E11D48]" />
                  )}
                  {cert.credentialCode}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
