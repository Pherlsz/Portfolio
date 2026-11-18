import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { getStickyHeaderOffset, handleSmoothScrollClick } from './ui';

const NAV = [
  { id: 'experiencia', label: 'Experiência' },
  { id: 'projeto', label: 'Projetos' },
  { id: 'formacao', label: 'Formação' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'contato', label: 'Contato' }
];

function syncThemeColor() {
  const root = getComputedStyle(document.documentElement);
  const hex = root.getPropertyValue('--paper').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex);
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const transitionSeqRef = useRef(0);

  useEffect(() => {
    syncThemeColor();

    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'theme') return;
      if (event.newValue !== 'light' && event.newValue !== 'dark') return;
      document.documentElement.classList.toggle('dark', event.newValue === 'dark');
      syncThemeColor();
      setTheme(event.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const applyTheme = (next: 'light' | 'dark', syncDomState = false) => {
    document.documentElement.classList.toggle('dark', next === 'dark');
    syncThemeColor();
    try {
      localStorage.setItem('theme', next);
    } catch {}
    if (syncDomState) {
      flushSync(() => setTheme(next));
    } else {
      setTheme(next);
    }
  };

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || typeof document.startViewTransition !== 'function') {
      applyTheme(next);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.width > 0 ? rect.left + rect.width / 2 : window.innerWidth;
    const y = rect.height > 0 ? rect.top + rect.height / 2 : 0;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const root = document.documentElement;
    const seq = ++transitionSeqRef.current;
    root.style.setProperty('--vt-x', `${x}px`);
    root.style.setProperty('--vt-y', `${y}px`);
    root.style.setProperty('--vt-r', `${Math.ceil(radius)}px`);
    root.dataset.themeTransition = 'true';

    const transition = document.startViewTransition(() => {
      applyTheme(next, true);
    });

    void transition.finished
      .catch(() => {})
      .finally(() => {
        if (transitionSeqRef.current !== seq) return;
        delete root.dataset.themeTransition;
        root.style.removeProperty('--vt-x');
        root.style.removeProperty('--vt-y');
        root.style.removeProperty('--vt-r');
      });
  };

  return { theme, toggleTheme };
}

const SECTION_IDS = ['inicio', ...NAV.map((item) => item.id)];

function headerOffsetPx(): number {
  return getStickyHeaderOffset(0) + 1;
}

function scrollLinePx() {
  return getStickyHeaderOffset(24);
}

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    let observer: IntersectionObserver | undefined;

    const sync = () => {
      const doc = document.documentElement;
      const line = scrollLinePx();
      const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 4;
      let current: string | null = null;

      for (const id of SECTION_IDS) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= line) current = id;
      }

      const lastId = SECTION_IDS[SECTION_IDS.length - 1];
      const last = document.getElementById(lastId);
      if (atBottom && last && last.getBoundingClientRect().top > line) current = lastId;

      const next = current && current !== 'inicio' ? current : null;
      setActive((prev) => (prev === next ? prev : next));
    };

    const connect = () => {
      observer?.disconnect();
      const offset = headerOffsetPx();
      observer = new IntersectionObserver(sync, {
        root: null,
        rootMargin: `-${offset}px 0px -40% 0px`,
        threshold: [0, 0.15, 0.4, 0.7, 1]
      });
      for (const id of SECTION_IDS) {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
      }
      sync();
    };

    const onScrollOrResize = () => {
      if (document.visibilityState !== 'visible') return;
      if (raf.current !== undefined) return;
      raf.current = window.requestAnimationFrame(() => {
        raf.current = undefined;
        sync();
      });
    };

    connect();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', connect);
    window.addEventListener('hashchange', onScrollOrResize);
    document.addEventListener('visibilitychange', onScrollOrResize);
    const root = document.getElementById('conteudo');
    let mutations: MutationObserver | undefined;
    if (root) {
      mutations = new MutationObserver(() => {
        connect();
        if (SECTION_IDS.every((id) => document.getElementById(id))) mutations?.disconnect();
      });
      mutations.observe(root, { childList: true, subtree: true });
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', connect);
      window.removeEventListener('hashchange', onScrollOrResize);
      document.removeEventListener('visibilitychange', onScrollOrResize);
      mutations?.disconnect();
      if (raf.current !== undefined) window.cancelAnimationFrame(raf.current);
    };
  }, []);

  return active;
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
  const active = useActiveSection();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-2 sm:gap-3 sm:px-8">
        <a
          href="#inicio"
          onClick={(event) => handleSmoothScrollClick(event, 'inicio', 0)}
          className="display inline-flex min-h-11 shrink-0 items-center whitespace-nowrap px-2 text-[0.9375rem] leading-none"
        >
          <span className="sm:hidden">{profile.shortName.split(' ')[0]}</span>
          <span className="hidden sm:inline">{profile.shortName}</span>
        </a>

        <nav aria-label="Seções" className="site-nav min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex items-center">
            {NAV.map((item) => (
              <li key={item.id} className="shrink-0">
                <a
                  href={`#${item.id}`}
                  onClick={(event) => handleSmoothScrollClick(event, item.id)}
                  aria-current={active === item.id ? 'location' : undefined}
                  className="site-nav-link whitespace-nowrap"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onOpenAssistant}
            aria-haspopup="dialog"
            aria-controls="assistente"
            aria-keyshortcuts="Control+K Meta+K"
            title="Abrir assistente (Atalho: Ctrl+K)"
            className="btn btn-ghost hidden min-h-11 gap-1.5 px-3 text-sm md:inline-flex"
          >
            <span>Perguntar</span>
            <kbd
              aria-hidden="true"
              className="border border-line bg-surface px-1.5 py-0.5 font-mono text-[0.6875rem] leading-none text-muted"
            >
              Ctrl K
            </kbd>
          </button>
          <button
            type="button"
            onClick={onOpenCv}
            aria-haspopup="dialog"
            aria-controls="cv-preview"
            className="btn btn-ghost min-h-11 min-w-11 px-2 text-sm"
          >
            CV
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            className="icon-btn"
          >
            {theme === 'dark' ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
