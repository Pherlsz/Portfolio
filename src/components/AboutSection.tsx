import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { Reveal, SectionHeading } from './ui';

export function AboutSection() {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section
      aria-labelledby="sobre-titulo"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-28"
    >
      <SectionHeading id="sobre-titulo" title="Sobre" />

      <Reveal className="max-w-3xl space-y-4 text-lg leading-relaxed text-ink-soft">
        {profile.about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </Reveal>
    </section>
  );
}
