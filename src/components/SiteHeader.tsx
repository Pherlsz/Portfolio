import { useEffect, useState } from 'react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';

const NAV = [
  { id: 'projeto', label: 'Projetos' },
  { id: 'experiencia', label: 'Experiência' },
  { id: 'formacao', label: 'Formação' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'contato', label: 'Contato' }
];

function syncThemeColor() {
  const root = getComputedStyle(document.documentElement);
  const dark = document.documentElement.classList.contains('dark');
  const hex = root.getPropertyValue(dark ? '--neutral-950' : '--neutral-50').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex);
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  useEffect(() => {
    syncThemeColor();
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    syncThemeColor();
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Sem armazenamento (modo privado): o tema vale só para esta visita.
    }
    setTheme(next);
  };

  return { theme, toggleTheme };
}

function scrollToSection(id: string) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
      history.pushState(null, '', `#${id}`);
    });
  });
}

export function SiteHeader({
  onOpenAssistant,
  onOpenCv
}: {
  onOpenAssistant: () => void;
  onOpenCv: () => void;
}) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`no-print sticky top-0 z-40 border-b transition-colors ${
        scrolled ? 'border-line bg-paper/95' : 'border-transparent bg-paper'
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 sm:px-8">
        <a href="#inicio" className="indice-serif text-base leading-none">
          {profile.shortName}
        </a>

        <nav aria-label="Seções" className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection(item.id);
                  }}
                  className="text-link inline-flex min-h-11 items-center py-1 text-[0.9375rem]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={onOpenAssistant}
            aria-haspopup="dialog"
            aria-controls="assistente"
            className="text-link min-h-11 py-2 text-[0.9375rem]"
          >
            Perguntar
          </button>
          <button
            type="button"
            onClick={onOpenCv}
            aria-haspopup="dialog"
            aria-controls="cv-preview"
            className="text-link min-h-11 py-2 text-[0.9375rem]"
          >
            Ver CV
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="text-link min-h-11 py-2 text-[0.9375rem]"
          >
            {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          </button>
        </div>
      </div>
    </header>
  );
}
