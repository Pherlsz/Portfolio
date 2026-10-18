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
      // Private mode: theme lasts for this visit only.
    }
    setTheme(next);
  };

  return { theme, toggleTheme };
}

const SECTION_IDS = ['inicio', ...NAV.map((item) => item.id)];

function headerOffsetPx(): number {
  const header = document.querySelector('header');
  return (header?.getBoundingClientRect().height ?? 64) + 1;
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

function scrollToId(id: string) {
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
  const active = useActiveSection();
  const jumpRef = useRef<HTMLButtonElement>(null);
  const jumpDialogRef = useRef<HTMLDialogElement>(null);
  const [jumpOpen, setJumpOpen] = useState(false);

  const closeJump = () => {
    setJumpOpen(false);
    jumpRef.current?.focus();
  };

  const goProjetos = () => {
    closeJump();
    scrollToId('projeto');
  };
  const goCv = () => {
    closeJump();
    onOpenCv();
  };
  const goContato = () => {
    closeJump();
    scrollToId('contato');
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
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === 'p') {
        event.preventDefault();
        goProjetos();
      } else if (key === 'v') {
        event.preventDefault();
        goCv();
      } else if (key === 'c') {
        event.preventDefault();
        goContato();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jumpOpen, onOpenCv]);

  const navLinks = NAV.map((item) => (
    <li key={item.id}>
      <a
        href={`#${item.id}`}
        onClick={(event) => {
          event.preventDefault();
          scrollToId(item.id);
        }}
        aria-current={active === item.id ? 'location' : undefined}
        className="inline-flex min-h-11 items-center px-2 text-[0.9375rem] font-semibold text-ink-soft transition-colors hover:text-ink aria-[current=location]:text-ink aria-[current=location]:underline"
      >
        {item.label}
      </a>
    </li>
  ));

  return (
    <header className="no-print border-b border-line bg-paper lg:sticky lg:top-0 lg:z-40">
      {/* shortcut: no sticky bar below lg, add one when the wrap fits a single 44px row */}
      <div className="flex min-h-16 flex-wrap items-center gap-x-1 gap-y-1 px-3 sm:px-5">
        <a href="#inicio" className="display inline-flex min-h-11 items-center px-2 text-lg leading-none">
          {profile.shortName}
        </a>

        <nav aria-label="Seções" className="min-w-0 flex-1">
          <ul className="flex flex-wrap items-center">{navLinks}</ul>
        </nav>

        <div className="flex flex-wrap items-center gap-1">
          <button
            ref={jumpRef}
            type="button"
            onClick={() => setJumpOpen(true)}
            aria-haspopup="dialog"
            aria-controls="atalhos"
            aria-expanded={jumpOpen}
            aria-label="Abrir atalhos, Control ou Command K"
            className="btn btn-ghost min-h-11 px-3 font-mono text-sm"
          >
            ⌘K
          </button>
          <button
            type="button"
            onClick={onOpenAssistant}
            aria-haspopup="dialog"
            aria-controls="assistente"
            className="btn btn-ghost min-h-11 px-3 text-sm"
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
            Ver CV
          </CTA>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            className="icon-btn size-11"
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
        className="jump-dialog"
        onClose={() => {
          setJumpOpen(false);
          jumpRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === jumpDialogRef.current) closeJump();
        }}
      >
        <h2 id="atalhos-titulo" className="display text-xl">
          Atalhos
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Control ou Command K abre e fecha. P, V e C só valem aqui. Esc fecha.
        </p>
        <ul className="mt-4 grid">
          <li>
            <button type="button" onClick={goProjetos} className="jump-item">
              <kbd>P</kbd>
              Projetos
            </button>
          </li>
          <li>
            <button type="button" onClick={goCv} className="jump-item">
              <kbd>V</kbd>
              Ver CV
            </button>
          </li>
          <li>
            <button type="button" onClick={goContato} className="jump-item">
              <kbd>C</kbd>
              Contato
            </button>
          </li>
        </ul>
      </dialog>
    </header>
  );
}
