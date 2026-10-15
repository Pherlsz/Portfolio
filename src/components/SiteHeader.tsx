import { useEffect, useState } from 'react';
import { Download, Menu, Moon, Sun, X } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';

const NAV = [
  { id: 'experiencia', label: 'Experiência' },
  { id: 'projeto', label: 'Projetos' },
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

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    // O hero também é observado para limpar o destaque quando o visitante volta ao topo.
    for (const id of ['inicio', ...NAV.map((item) => item.id)]) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  return active;
}

export function SiteHeader() {
  const { profile } = DEFAULT_PORTFOLIO_DATA;
  const { theme, toggleTheme } = useTheme();
  const active = useActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = (onNavigate?: () => void) =>
    NAV.map((item) => (
      <li key={item.id}>
        <a
          href={`#${item.id}`}
          onClick={onNavigate}
          aria-current={active === item.id ? 'location' : undefined}
          className="block rounded-full px-3 py-2 text-[0.9375rem] font-semibold text-ink-soft transition-colors hover:text-ink aria-[current=location]:bg-marker aria-[current=location]:text-on-marker"
        >
          {item.label}
        </a>
      </li>
    ));

  return (
    <header
      className={`no-print sticky top-0 z-40 border-b transition-colors ${
        scrolled || menuOpen ? 'border-line bg-paper/90 backdrop-blur-md' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5 sm:px-8">
        <a href="#inicio" className="display text-lg leading-none">
          {profile.shortName}
        </a>

        <nav aria-label="Seções" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">{navLinks()}</ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-3">
          <a href={profile.cvUrl} download className="btn btn-primary hidden min-h-10 px-4 text-sm sm:inline-flex">
            <Download className="size-4" aria-hidden="true" />
            Baixar CV
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            className="icon-btn size-10"
          >
            {theme === 'dark' ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            className="icon-btn size-10 md:hidden"
          >
            {menuOpen ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="menu-mobile" aria-label="Seções" className="border-t border-line px-5 pb-5 pt-3 md:hidden">
          <ul className="grid gap-1">{navLinks(() => setMenuOpen(false))}</ul>
          <a href={profile.cvUrl} download className="btn btn-primary mt-4 w-full justify-center">
            <Download className="size-4" aria-hidden="true" />
            Baixar CV (PDF)
          </a>
        </nav>
      )}
    </header>
  );
}
