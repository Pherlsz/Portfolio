import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import {
  BookOpen,
  Briefcase,
  Check,
  FileText,
  FolderKanban,
  Mail,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Terminal,
  Trash2,
  X
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { chatStore, useChatStore } from '../chat/chatStore';
import { visibleSections, type SectionId } from '../content/sections';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { t } from '../i18n/pt-BR';
import type { Reasoning } from '../utils/chat';
import { navigateWithTransition } from '../utils/viewTransition';
import { ThemeToggle } from './ThemeToggle';

const EMBLEM_MASCOTS: Record<Reasoning, { src: string; name: string }> = {
  fast: { src: '/stickers/tomada.webp', name: 'Tomada (modo Rápido)' },
  default: { src: '/stickers/morcega.webp', name: 'Morcega (modo Padrão)' },
  high: { src: '/stickers/banguela.webp', name: 'Banguela (modo Profundo)' }
};

function isPlainLeftClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

interface SidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  onStartContact: () => void;
  isMobileDrawer?: boolean;
}

function SectionIcon({ id, active }: { id: SectionId; active: boolean }) {
  const cls = `size-4 shrink-0 transition-colors duration-150 ${active ? 'text-ink' : 'text-muted'}`;
  if (id === 'projects') return <FolderKanban className={cls} aria-hidden="true" />;
  if (id === 'experience') return <Briefcase className={cls} aria-hidden="true" />;
  if (id === 'studies') return <BookOpen className={cls} aria-hidden="true" />;
  if (id === 'articles') return <FileText className={cls} aria-hidden="true" />;
  return <Terminal className={cls} aria-hidden="true" />;
}

export function Sidebar({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
  onStartContact,
  isMobileDrawer = false
}: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { chats, activeChatId, defaultReasoning } = useChatStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [emblemHop, setEmblemHop] = useState(0);
  const emblemRef = useRef<HTMLSpanElement | null>(null);

  const activeThread = activeChatId ? chats.find((c) => c.id === activeChatId) : null;
  const activeReasoning = activeThread?.reasoning ?? defaultReasoning;
  const emblemMascot = EMBLEM_MASCOTS[activeReasoning];

  const sections = visibleSections();

  const go = useCallback(
    (to: string) => {
      navigateWithTransition(setLocation, to);
      onNavigate?.();
    },
    [onNavigate, setLocation]
  );

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>, to: string) => {
    if (!isPlainLeftClick(event)) return;
    event.preventDefault();
    if (location === to) {
      onNavigate?.();
      return;
    }
    go(to);
  };

  const handleEmblemPointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    const el = emblemRef.current;
    if (!el) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    el.style.setProperty('--tx', `${(nx * 3.5).toFixed(2)}px`);
    el.style.setProperty('--ty', `${(ny * 3.5).toFixed(2)}px`);
    el.style.setProperty('--rot', `${(nx * 7).toFixed(2)}deg`);
  };

  const handleEmblemPointerLeave = () => {
    const el = emblemRef.current;
    if (!el) return;
    el.style.setProperty('--tx', '0px');
    el.style.setProperty('--ty', '0px');
    el.style.setProperty('--rot', '0deg');
  };

  const handleNewChat = useCallback(() => {
    chatStore.newChat();
    go('/');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const composer = document.querySelector<HTMLTextAreaElement>('main#conteudo textarea');
        composer?.focus();
      });
    });
  }, [go]);

  useEffect(() => {
    if (isMobileDrawer || typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (document.querySelector('dialog[open]')) {
        return;
      }
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      handleNewChat();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNewChat, isMobileDrawer]);

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setDraftTitle(currentTitle);
  };

  const commitRename = (id: string) => {
    const trimmed = draftTitle.trim();
    if (trimmed) {
      chatStore.rename(id, trimmed);
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    chatStore.remove(id);
    if (location === `/c/${id}`) {
      setLocation('/');
    }
  };

  /* ---------- Minimized 1-click icon rail (desktop) ---------- */
  if (collapsed && !isMobileDrawer) {
    return (
      <aside
        aria-label="Navegação principal"
        className="flex h-full w-full flex-col items-center justify-between px-2 py-2.5 text-ink"
      >
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/"
            onClick={(event) => {
              setEmblemHop((count) => count + 1);
              chatStore.selectChat(null);
              handleLinkClick(event, '/');
            }}
            title="pherls.md · Início"
            aria-label="pherls.md · Início"
            className="focus-ring flex size-10 items-center justify-center rounded-control"
          >
            <span
              key={emblemHop}
              className={`relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-pill border border-border-strong bg-lime p-0.5 ${
                emblemHop > 0 ? 'mascot-hop' : ''
              }`}
            >
              <img
                src={emblemMascot.src}
                alt=""
                aria-hidden="true"
                width={26}
                height={26}
                className="size-6.5 object-contain"
              />
            </span>
          </Link>

          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={t('nav.expandSidebar')}
              aria-label={t('nav.expandSidebar')}
              className="focus-ring inline-flex size-9 cursor-pointer items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-ink"
            >
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleNewChat}
            title={t('nav.newChat')}
            aria-label={t('nav.newChat')}
            className="focus-ring inline-flex size-9 cursor-pointer items-center justify-center rounded-control border border-border bg-surface text-ink transition-colors duration-150 hover:border-border-strong hover:bg-surface-hover"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>

          <nav aria-label={t('nav.sections')} className="mt-1 flex flex-col items-center gap-1">
            {sections.map((section) => {
              const active =
                location === section.path || location.startsWith(`${section.path}/`);
              return (
                <Link
                  key={section.id}
                  href={section.path}
                  onClick={(event) => handleLinkClick(event, section.path)}
                  title={section.label}
                  aria-label={section.label}
                  aria-current={active ? 'page' : undefined}
                  className={`focus-ring inline-flex size-9 items-center justify-center rounded-control transition-colors duration-150 ${
                    active
                      ? 'bg-surface text-ink shadow-card'
                      : 'text-muted hover:bg-surface-hover hover:text-ink'
                  }`}
                >
                  <SectionIcon id={section.id} active={active} />
                </Link>
              );
            })}
          </nav>
        </div>

        <footer className="flex flex-col items-center gap-1.5 border-t border-border pt-2.5">
          <button
            type="button"
            onClick={onStartContact}
            title={t('nav.contact')}
            aria-label={t('nav.contact')}
            className="focus-ring inline-flex size-8 cursor-pointer items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-ink"
          >
            <Mail className="size-4" aria-hidden="true" />
          </button>
          <Link
            href="/experiencia"
            title={t('nav.cv')}
            aria-label={t('nav.cv')}
            className="focus-ring inline-flex size-8 items-center justify-center rounded-control font-mono text-micro font-medium text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-ink"
          >
            CV
          </Link>
          <ThemeToggle iconOnly />
        </footer>
      </aside>
    );
  }

  /* ---------- Expanded flush sidebar (integrated with site background) ---------- */
  return (
    <aside
      aria-label="Navegação principal"
      className="flex h-full w-full flex-col justify-between bg-transparent px-3 py-2.5 text-ink"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 px-1 pb-3">
          <Link
            href="/"
            onPointerMove={handleEmblemPointerMove}
            onPointerLeave={handleEmblemPointerLeave}
            onClick={(event) => {
              setEmblemHop((count) => count + 1);
              chatStore.selectChat(null);
              handleLinkClick(event, '/');
            }}
            title={emblemMascot.name}
            className="focus-ring group flex min-h-9 items-center gap-2.5 rounded-control px-1"
          >
            <span
              ref={emblemRef}
              key={emblemHop}
              className={`living-emblem relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-pill border border-border-strong bg-lime p-0.5 ${
                emblemHop > 0 ? 'mascot-hop' : ''
              }`}
            >
              <img
                src={emblemMascot.src}
                alt=""
                aria-hidden="true"
                width={24}
                height={24}
                className="size-6 object-contain"
              />
            </span>
            <span className="flex items-baseline gap-0.5">
              <span className="font-display text-ui font-extrabold tracking-[-0.03em] text-ink">
                pherls
              </span>
              <span className="font-mono text-micro text-muted">.md</span>
            </span>
          </Link>

          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isMobileDrawer ? 'Fechar menu' : t('nav.collapseSidebar')}
              aria-label={isMobileDrawer ? 'Fechar menu' : t('nav.collapseSidebar')}
              className="focus-ring inline-flex size-8 cursor-pointer items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-ink"
            >
              {isMobileDrawer ? (
                <X className="size-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="size-4" aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleNewChat}
          className="focus-ring flex min-h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-control border border-border bg-surface px-3 py-1.5 text-ui font-medium text-ink transition-colors duration-150 hover:border-border-strong hover:bg-surface-hover"
        >
          <span className="flex items-center gap-2">
            <Plus className="size-4 text-muted" aria-hidden="true" />
            <span>{t('nav.newChat')}</span>
          </span>
          <kbd className="rounded border border-border bg-surface-soft px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted">
            /
          </kbd>
        </button>

        <nav aria-label={t('nav.sections')} className="mt-3.5">
          <ul className="space-y-0.5">
            {sections.map((section) => {
              const active =
                location === section.path || location.startsWith(`${section.path}/`);
              return (
                <li key={section.id}>
                  <Link
                    href={section.path}
                    onClick={(event) => handleLinkClick(event, section.path)}
                    aria-current={active ? 'page' : undefined}
                    className={`focus-ring group flex min-h-9 items-center justify-between gap-2 rounded-control px-2.5 py-1.5 text-ui transition-colors duration-150 ${
                      active
                        ? 'bg-surface font-semibold text-ink shadow-card'
                        : 'font-medium text-ink-soft hover:bg-surface-hover/70 hover:text-ink'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <SectionIcon id={section.id} active={active} />
                      <span className="truncate">{section.label}</span>
                    </span>
                    {section.id !== 'ai' && section.count > 0 ? (
                      <span
                        aria-hidden="true"
                        className="rounded-pill border border-border bg-surface-soft px-1.5 py-0.5 font-mono text-[11px] leading-none text-muted tabular-nums"
                      >
                        {section.count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-border pt-3">
          <div className="flex items-center justify-between px-2.5 pb-1.5">
            <p className="text-micro font-medium text-muted">{t('nav.history')}</p>
            {chats.length > 0 && (
              <span className="font-mono text-micro tabular-nums text-muted">
                {chats.length}
              </span>
            )}
          </div>

          {chats.length === 0 ? (
            <p className="px-2.5 text-micro leading-relaxed text-muted">
              {t('nav.historyEmpty')}
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-0.5">
              {chats.map((chat) => {
                const isActive =
                  location === `/c/${chat.id}` || (location === '/' && activeChatId === chat.id);
                const isEditing = editingId === chat.id;

                return (
                  <li
                    key={chat.id}
                    className={`group flex min-h-9 items-center gap-1 rounded-control px-2 transition-colors duration-150 ${
                      isActive
                        ? 'bg-surface text-ink shadow-card'
                        : 'text-ink-soft hover:bg-surface-hover/70'
                    }`}
                  >
                    {isEditing ? (
                      <form
                        className="flex flex-1 items-center gap-1 py-1"
                        onSubmit={(event) => {
                          event.preventDefault();
                          commitRename(chat.id);
                        }}
                      >
                        <input
                          type="text"
                          value={draftTitle}
                          onChange={(event) => setDraftTitle(event.target.value)}
                          onBlur={() => commitRename(chat.id)}
                          autoFocus
                          aria-label="Novo título da conversa"
                          className="focus-ring min-h-8 w-full rounded-control border border-border-strong bg-canvas px-2 text-micro text-ink"
                        />
                        <button
                          type="submit"
                          aria-label="Salvar título"
                          className="focus-ring inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-pill text-ok"
                        >
                          <Check className="size-3.5" aria-hidden="true" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <Link
                          href={`/c/${chat.id}`}
                          onClick={() => {
                            chatStore.selectChat(chat.id);
                            onNavigate?.();
                          }}
                          className="focus-ring flex min-w-0 flex-1 items-center gap-2 rounded-control py-1.5 text-ui"
                        >
                          <MessageSquare
                            className={`size-3.5 shrink-0 ${isActive ? 'text-ink-soft' : 'text-muted'}`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{chat.title}</span>
                        </Link>
                        <div
                          className={`flex shrink-0 items-center transition-opacity duration-150 ${
                            isActive
                              ? 'opacity-100'
                              : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => startRename(chat.id, chat.title)}
                            aria-label={`Renomear ${chat.title}`}
                            className="focus-ring inline-flex size-8 cursor-pointer items-center justify-center rounded-pill text-muted transition-colors duration-150 hover:text-ink"
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(chat.id)}
                            aria-label={`${t('chat.deleteThread')} ${chat.title}`}
                            className="focus-ring inline-flex size-8 cursor-pointer items-center justify-center rounded-pill text-muted transition-colors duration-150 hover:text-danger"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <footer className="mt-3 space-y-2 border-t border-border pt-2.5">
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onStartContact();
              onNavigate?.();
            }}
            className="focus-ring flex min-h-8 w-full cursor-pointer items-center gap-2.5 rounded-control px-2.5 py-1 text-ui font-medium text-ink-soft transition-colors duration-150 hover:bg-surface-hover/70 hover:text-ink"
          >
            <Mail className="size-3.5 text-muted" aria-hidden="true" />
            <span>{t('nav.contact')}</span>
          </button>
          <Link
            href="/experiencia"
            onClick={onNavigate}
            aria-label={t('nav.cv')}
            className="focus-ring flex min-h-8 w-full items-center gap-2.5 rounded-control px-2.5 py-1 text-ui font-medium text-ink-soft transition-colors duration-150 hover:bg-surface-hover/70 hover:text-ink"
          >
            <FileText className="size-3.5 text-muted" aria-hidden="true" />
            <span>{t('nav.cv')}</span>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-2">
          <ThemeToggle />
          <div className="flex items-center gap-1 text-muted">
            <a
              href={DEFAULT_PORTFOLIO_DATA.profile.github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              title="GitHub"
              className="focus-ring inline-flex size-8 items-center justify-center rounded-control transition-colors duration-150 hover:bg-surface-hover/70 hover:text-ink"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
              </svg>
            </a>
            <a
              href={DEFAULT_PORTFOLIO_DATA.profile.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="focus-ring inline-flex size-8 items-center justify-center rounded-control transition-colors duration-150 hover:bg-surface-hover/70 hover:text-ink"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4"
              >
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </aside>
  );
}
