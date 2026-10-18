import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { StaticSticker, type StickerId } from './stickers';
import { SectionHeading } from './ui';

function petStickerId(id: string): StickerId | null {
  if (id === 'morcega' || id === 'banguela' || id === 'tomada') return id;
  return null;
}

export function AboutSection() {
  const { profile, interests, pets } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section aria-labelledby="sobre-titulo" className="scroll-mt-5 px-5 py-14 sm:px-8 sm:py-20">
      <SectionHeading id="sobre-titulo" title="Bastidores" />

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="max-w-prose space-y-4">
          {profile.about.map((paragraph) => (
            <p key={paragraph} className="text-pretty">
              {paragraph}
            </p>
          ))}
        </div>
        <ul className="space-y-4">
          {interests.map((interest) => (
            <li key={interest.id} className="border-t border-line pt-3">
              <h3 className="font-semibold">{interest.title}</h3>
              <p className="mt-1 text-ink-soft">{interest.text}</p>
            </li>
          ))}
        </ul>
      </div>

      <h3 className="display mt-12 text-xl sm:mt-16">Os três gatos do escritório</h3>
      <p className="mt-2 text-ink-soft">Clique em cada um para ver a reação.</p>
      <ul className="mt-6 grid gap-6 sm:grid-cols-3">
        {pets.map((pet) => {
          const stickerId = petStickerId(pet.id);
          return (
            <li key={pet.id} className="border-t border-line pt-4 text-left">
              {stickerId ? (
                <StaticSticker id={stickerId} className="mx-auto w-full max-w-28 sm:max-w-32" />
              ) : null}
              <h4 className="display mt-4 text-lg">{pet.name}</h4>
              <p className="mt-1 text-ink-soft">{pet.bio}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
