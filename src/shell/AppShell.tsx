import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'wouter';
import { t } from '../i18n/pt-BR';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
  onStartContact: () => void;
}

function resolveRoom(pathname: string): string {
  if (pathname.startsWith('/projetos')) return 'projects';
  if (pathname.startsWith('/experiencia')) return 'experience';
  if (pathname.startsWith('/estudos')) return 'studies';
  if (pathname.startsWith('/artigos')) return 'articles';
  if (pathname.startsWith('/ai')) return 'ai';
  return 'chat';
}

export function AppShell({ children, onStartContact }: AppShellProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const room = resolveRoom(location);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (mobileOpen && !dialog.open) {
      dialog.showModal();
    } else if (!mobileOpen && dialog.open) {
      dialog.close();
    }
  }, [mobileOpen]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const el = mainRef.current;
    const bar = progressBarRef.current;
    if (!el || !bar) return;

    const updateProgress = () => {
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 4) {
        bar.style.opacity = '0';
        bar.style.transform = 'scaleX(0)';
        return;
      }
      const ratio = Math.min(1, Math.max(0, el.scrollTop / maxScroll));
      bar.style.opacity = '1';
      bar.style.transform = `scaleX(${ratio})`;
    };

    updateProgress();
    el.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateProgress);
      observer.observe(el);
    }

    return () => {
      el.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
      observer?.disconnect();
    };
  }, [location]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-bg text-ink lg:py-2 lg:pr-2">
      <div
        className={`vt-sidebar hidden h-full shrink-0 overflow-hidden transition-[width] duration-200 ease-out lg:block motion-reduce:transition-none ${
          collapsed ? 'w-[64px]' : 'w-[248px]'
        }`}
      >
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          onStartContact={onStartContact}
        />
      </div>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label={t('nav.expandSidebar')}
        className="focus-ring fixed top-3.5 left-3.5 z-30 inline-flex size-10 cursor-pointer appearance-none items-center justify-center rounded-pill border border-border-strong bg-surface text-ink shadow-card transition-colors duration-150 hover:bg-surface-hover lg:hidden"
      >
        <Menu className="size-4" aria-hidden="true" />
      </button>

      <dialog
        ref={drawerRef}
        onClose={() => setMobileOpen(false)}
        onClick={(event) => {
          if (event.target === drawerRef.current) setMobileOpen(false);
        }}
        aria-label="Menu de navegação"
        className="m-0 h-dvh max-h-none w-[min(18rem,86vw)] max-w-none overflow-hidden border-r border-border bg-bg p-0 text-ink shadow-pop"
      >
        <Sidebar
          isMobileDrawer
          onToggleCollapse={() => setMobileOpen(false)}
          onNavigate={() => setMobileOpen(false)}
          onStartContact={onStartContact}
        />
      </dialog>

      <a
        href="#conteudo"
        className="focus-ring sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-pill focus:bg-accent focus:px-4 focus:py-2 focus:text-ui focus:font-semibold focus:text-on-accent focus:shadow-pop"
      >
        Pular para o conteúdo
      </a>
      <div
        data-room={room}
        className="surface-sheet relative flex min-w-0 flex-1 overflow-hidden rounded-none border-0 bg-canvas lg:rounded-sheet lg:border lg:border-border-strong/70 lg:shadow-card"
      >
        <div aria-hidden="true" className="paper-grain" />
        <main
          ref={mainRef}
          id="conteudo"
          data-scroll-container="main"
          tabIndex={-1}
          className="relative z-10 flex h-full w-full flex-col overflow-y-auto bg-transparent [scrollbar-gutter:stable]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none sticky top-0 z-30 -mb-[2px] h-[2px] w-full shrink-0 overflow-hidden"
          >
            <div
              ref={progressBarRef}
              className="scroll-progress-bar h-full w-full bg-accent opacity-0"
            />
          </div>
          <div className="vt-sheet relative z-10 flex min-h-full w-full min-w-0 flex-1 flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
}
