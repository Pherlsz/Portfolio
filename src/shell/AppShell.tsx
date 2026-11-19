import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Menu, PanelLeftOpen } from 'lucide-react';
import { t } from '../i18n/pt-BR';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
  onStartContact: () => void;
}

export function AppShell({ children, onStartContact }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (mobileOpen && !dialog.open) {
      dialog.showModal();
    } else if (!mobileOpen && dialog.open) {
      dialog.close();
    }
  }, [mobileOpen]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-bg text-ink lg:gap-2 lg:p-2">
      {/* Desktop collapsible sidebar */}
      {!collapsed ? (
        <div className="hidden h-full w-[256px] shrink-0 overflow-hidden lg:block lg:rounded-sheet">
          <Sidebar
            onCollapse={() => setCollapsed(true)}
            onStartContact={onStartContact}
          />
        </div>
      ) : null}

      {/* Floating reopen button when collapsed on desktop */}
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label={t('nav.expandSidebar')}
          className="focus-ring fixed top-5 left-5 z-30 hidden size-10 cursor-pointer items-center justify-center rounded-pill border border-border-strong bg-surface text-ink shadow-card transition-colors duration-150 hover:bg-surface-hover lg:inline-flex"
        >
          <PanelLeftOpen className="size-4" aria-hidden="true" />
        </button>
      ) : null}

      {/* Floating mobile drawer trigger (no top header bar) */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label={t('nav.expandSidebar')}
        className="focus-ring fixed top-3.5 left-3.5 z-30 inline-flex size-10 cursor-pointer items-center justify-center rounded-pill border border-border-strong bg-surface text-ink shadow-card transition-colors duration-150 hover:bg-surface-hover lg:hidden"
      >
        <Menu className="size-4" aria-hidden="true" />
      </button>

      {/* Mobile navigation drawer using native <dialog> */}
      <dialog
        ref={drawerRef}
        onClose={() => setMobileOpen(false)}
        onClick={(event) => {
          if (event.target === drawerRef.current) setMobileOpen(false);
        }}
        aria-label="Menu de navegação"
        className="m-0 h-dvh max-h-none w-[min(18rem,86vw)] max-w-none overflow-hidden border-r border-border bg-rail p-0 text-ink shadow-pop"
      >
        <Sidebar
          isMobileDrawer
          onCollapse={() => setMobileOpen(false)}
          onNavigate={() => setMobileOpen(false)}
          onStartContact={onStartContact}
        />
      </dialog>

      {/* Main rounded canvas sheet */}
      <a
        href="#conteudo"
        className="focus-ring sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-pill focus:bg-accent focus:px-4 focus:py-2 focus:text-ui focus:font-semibold focus:text-on-accent focus:shadow-pop"
      >
        Pular para o conteúdo
      </a>
      <div className="flex min-w-0 flex-1">
        <main
          id="conteudo"
          tabIndex={-1}
          className="surface-sheet relative flex h-full w-full flex-col overflow-y-auto rounded-none border-0 bg-canvas lg:rounded-sheet lg:border lg:border-border"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
