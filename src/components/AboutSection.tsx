import { Coffee, Dices, Dumbbell, FolderSearch, type LucideIcon } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { StaticSticker, type StickerId } from './stickers';
import { SectionHeading } from './ui';

const INTEREST_ICONS: Record<string, LucideIcon> = {
  gincana: FolderSearch,
  treino: Dumbbell,
  jogos: Dices,
  cafe: Coffee
};

export function AboutSection() {
  const { profile, interests, pets } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28"
    >
      <SectionHeading id="sobre-titulo" eyebrow="Sobre mim" title="Bastidores" />

      <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr]">
        <div className="space-y-4 text-lg">
          {profile.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {interests.map((interest) => {
            const Icon = INTEREST_ICONS[interest.id];
            return (
              <li key={interest.id} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
                {Icon && <Icon className="mt-1 size-5 shrink-0" aria-hidden="true" />}
                <div>
                  <h3 className="font-bold">{interest.title}</h3>
                  <p className="mt-1 text-[0.9375rem] text-ink-soft">{interest.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <h3 className="display mt-20 text-2xl">Os três gatos do escritório</h3>
      <p className="mt-2 text-ink-soft">Clique em cada um para ver a reação.</p>
      <ul className="mt-8 grid gap-6 sm:grid-cols-3">
        {pets.map((pet) => (
          <li key={pet.id} className="rounded-[1.75rem] border border-line bg-surface p-6 text-center">
            <StaticSticker id={pet.id as StickerId} className="mx-auto w-36 sm:w-40" />
            <h4 className="display mt-5 text-xl">{pet.name}</h4>
            <p className="mt-2 text-[0.9375rem] text-ink-soft">{pet.bio}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
