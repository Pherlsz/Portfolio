import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { StaticSticker, type StickerId } from './stickers';
import { Reveal, SectionHeading } from './ui';

export function AboutSection() {
  const { profile, pets } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section
      aria-labelledby="sobre-titulo"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-28"
    >
      <SectionHeading id="sobre-titulo" eyebrow="Sobre mim" title="Bastidores" />

      <Reveal className="max-w-3xl space-y-4 text-lg">
        {profile.about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </Reveal>

      <Reveal className="mt-14 sm:mt-20">
        <h3 className="display text-2xl">Os três gatos do escritório</h3>
      </Reveal>
      <ul className="mt-8 grid gap-6 sm:grid-cols-3">
        {pets.map((pet, index) => (
          <li key={pet.id}>
            <Reveal
              delay={index * 0.08}
              className="h-full rounded-[1.75rem] border border-line bg-surface p-6 text-center"
            >
              <StaticSticker id={pet.id as StickerId} className="mx-auto w-full max-w-36 sm:max-w-40" />
              <h4 className="display mt-5 text-xl">{pet.name}</h4>
              <p className="mt-2 text-[0.9375rem] text-ink-soft">{pet.bio}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
