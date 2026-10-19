import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { StaticSticker } from './stickers';
import { SectionHeading } from './ui';

export function AboutSection() {
  const { profile, interests, pets } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section aria-labelledby="sobre-titulo" className="border-t border-line py-10">
      <SectionHeading id="sobre-titulo" eyebrow="Sobre mim" title="Bastidores" />

      <div className="max-w-[70ch] space-y-4">
        {profile.about.map((paragraph) => (
          <p key={paragraph} className="text-pretty">
            {paragraph}
          </p>
        ))}
      </div>
      <ul className="mt-8 max-w-[70ch] space-y-4">
        {interests.map((interest) => (
          <li key={interest.id} className="border-t border-line pt-4">
            <h3 className="font-bold">{interest.title}</h3>
            <p className="mt-1 text-pretty text-ink-soft">{interest.text}</p>
          </li>
        ))}
      </ul>

      <h3 className="display mt-10 text-xl">Os três gatos do escritório</h3>
      <p className="mt-2 text-ink-soft">Clique em cada um para ver a reação.</p>
      <ul className="mt-6 grid gap-6 sm:grid-cols-3">
        {pets.map((pet) => (
          <li key={pet.id} className="text-center">
            <StaticSticker id={pet.id} className="mx-auto w-full max-w-36 sm:max-w-40" />
            <h4 className="display mt-4 text-lg">{pet.name}</h4>
            <p className="mt-2 text-pretty text-[0.9375rem] text-ink-soft">{pet.bio}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
