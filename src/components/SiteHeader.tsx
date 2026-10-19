import { useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CTA } from './CTA';

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

const SECTION_IDS = ['inicio', ...NAV.map((item) => item.id)];

function headerOffsetPx(): number {
  const header = document.querySelector('header');
  return (header?.getBoundingClientRect().height ?? 56) + 1;
}

function scrollLinePx() {
  const pad = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
  const header = headerOffsetPx();
  return (Number.isFinite(pad) ? Math.max(pad, header) : header) + 12;
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

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

function focusSection(id: string) {
  const node = document.getElementById(id);
  node?.scrollIntoView({ block: 'start', behavior: 'instant' });
  node?.focus();
  history.pushState(null, '', `#${id}`);
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
  const jumpRef = useRef<HTMLButtonElement>(null);
  const jumpDialogRef = useRef<HTMLDialogElement>(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [modKey, setModKey] = useState('Ctrl');

  useEffect(() => {
    setModKey(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl');
  }, []);

  const closeJump = () => {
    jumpDialogRef.current?.close();
    setJumpOpen(false);
  };

  const goProjetos = () => {
    closeJump();
    focusSection('projeto');
  };
  const goCv = () => {
    closeJump();
    onOpenCv();
  };
  const goContato = () => {
    closeJump();
    focusSection('contato');
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setJumpOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const dialog = jumpDialogRef.current;
    if (!dialog) return;
    if (jumpOpen && !dialog.open) dialog.showModal();
    if (!jumpOpen && dialog.open) dialog.close();
  }, [jumpOpen]);

  useEffect(() => {
    if (!jumpOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const key = event.key.toLowerCase();
      if (key === 'p') {
        event.preventDefault();
        goProjetos();
      } else if (key === 'c') {
        event.preventDefault();
        goCv();
      } else if (key === 't') {
        event.preventDefault();
        goContato();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jumpOpen, onOpenCv]);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-2 sm:gap-2 sm:px-8">
        <a
          href="#inicio"
          className="display inline-flex min-h-11 min-w-0 max-w-[4.75rem] items-center truncate px-2 text-[0.9375rem] leading-none sm:max-w-none"
        >
          <span className="sm:hidden">{profile.shortName.split(' ')[0]}</span>
          <span className="hidden sm:inline">{profile.shortName}</span>
        </a>

        <nav aria-label="Seções" className="site-nav min-w-0 flex-1">
          <ul className="flex items-center">
            {NAV.map((item) => {
              const compact = item.id === 'projeto' || item.id === 'contato';
              return (
                <li key={item.id} className={compact ? undefined : 'hidden lg:block'}>
                  <a
                    href={`#${item.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      focusSection(item.id);
                    }}
                    aria-current={active === item.id ? 'location' : undefined}
                    className="site-nav-link"
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <button
            ref={jumpRef}
            type="button"
            onClick={() => setJumpOpen(true)}
            aria-haspopup="dialog"
            aria-controls="atalhos"
            aria-expanded={jumpOpen}
            aria-label={`Abrir atalhos, ${modKey} K`}
            className="jump-trigger btn btn-ghost min-h-11 px-2 font-mono text-sm sm:px-3"
          >
            <kbd className="font-mono">{modKey}&nbsp;K</kbd>
          </button>
          <button
            type="button"
            onClick={onOpenAssistant}
            aria-haspopup="dialog"
            aria-controls="assistente"
            className="btn btn-ghost hidden min-h-11 px-3 text-sm md:inline-flex"
          >
            Perguntar
          </button>
          <CTA
            variant="tertiary"
            onClick={onOpenCv}
            aria-haspopup="dialog"
            aria-controls="cv-preview"
            className="min-h-11 px-2 text-sm"
            aria-label="Ver currículo"
          >
            CV
          </CTA>
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

      <dialog
        ref={jumpDialogRef}
        id="atalhos"
        aria-labelledby="atalhos-titulo"
        onClose={() => setJumpOpen(false)}
        onClick={(event) => {
          if (event.target === jumpDialogRef.current) setJumpOpen(false);
        }}
        className="jump-dialog no-print"
      >
        <h2 id="atalhos-titulo" className="display text-base">
          Ir para
        </h2>
        <p className="mt-1 text-sm text-muted">Letras só com este diálogo aberto.</p>
        <ul className="mt-3">
          <li>
            <button type="button" onClick={goProjetos} className="jump-item">
              <span>Projetos</span>
              <kbd>P</kbd>
            </button>
          </li>
          <li>
            <button type="button" onClick={goCv} className="jump-item">
              <span>CV</span>
              <kbd>C</kbd>
            </button>
          </li>
          <li>
            <button type="button" onClick={goContato} className="jump-item">
              <span>Contato</span>
              <kbd>T</kbd>
            </button>
          </li>
        </ul>
      </dialog>
    </header>
  );
}
