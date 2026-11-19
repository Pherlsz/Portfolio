import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { visibleSections } from '../content/sections';
import { t } from '../i18n/pt-BR';

export function NotFoundPage() {
  const sections = visibleSections();

  return (
    <section className="mx-auto flex min-h-[75vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="ambient-glow mb-6 flex size-28 items-center justify-center rounded-pill">
        <img
          src="/stickers/morcega.webp"
          alt=""
          width={88}
          height={88}
          decoding="async"
          className="size-[88px] object-contain"
        />
      </div>

      <h1 className="font-display text-title font-bold tracking-[-0.02em] text-ink">
        {t('notFound.title')}
      </h1>
      <p className="mt-2.5 max-w-md text-body text-ink-soft">{t('notFound.description')}</p>

      <nav
        aria-label="Rotas disponíveis"
        className="mt-7 flex flex-wrap items-center justify-center gap-2"
      >
        <Link
          href="/"
          className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-pill bg-accent px-4 py-2 text-ui font-semibold text-on-accent transition-opacity duration-150 hover:opacity-90"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>{t('notFound.backHome')}</span>
        </Link>
        {sections.map((section) => (
          <Link key={section.id} href={section.path} className="focus-ring pill-button">
            {section.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
