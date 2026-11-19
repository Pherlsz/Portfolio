import { useState } from 'react';
import {
  BookOpen,
  Briefcase,
  Check,
  FileText,
  FolderKanban,
  MessageSquare,
  PanelLeftClose,
  Pencil,
  Plus,
  Terminal,
  Trash2,
  X
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { chatStore, useChatStore } from '../chat/chatStore';
import { visibleSections, type SectionId } from '../content/sections';
import { t } from '../i18n/pt-BR';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  onNavigate?: () => void;
  onCollapse?: () => void;
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
  onNavigate,
  onCollapse,
  onStartContact,
  isMobileDrawer = false
}: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { chats, activeChatId } = useChatStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  const sections = visibleSections();

  const handleNewChat = () => {
    chatStore.newChat();
    setLocation('/');
    onNavigate?.();
  };

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

  return (
    <aside
      aria-label="Navegação principal"
      className="flex h-full w-full flex-col justify-between bg-rail px-3 py-3 text-ink"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 px-1.5 pb-3">
          <Link
            href="/"
            onClick={() => {
              chatStore.selectChat(null);
              onNavigate?.();
            }}
            className="focus-ring flex min-h-9 items-center gap-2 rounded-control px-1.5"
          >
            <span className="flex size-7 items-center justify-center rounded-pill bg-lime font-mono text-micro font-bold text-on-lime">
              PL
            </span>
            <span className="font-display text-ui font-bold tracking-tight text-ink">
              {t('brand.name')}
            </span>
          </Link>

          {onCollapse ? (
            <button
              type="button"
              onClick={onCollapse}
              aria-label={isMobileDrawer ? 'Fechar menu' : t('nav.collapseSidebar')}
              className="focus-ring inline-flex size-9 cursor-pointer items-center justify-center rounded-pill text-muted transition-colors duration-150 hover:bg-surface-soft hover:text-ink"
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
          className="surface-card surface-card-interactive focus-ring flex min-h-10 w-full items-center gap-2.5 rounded-control px-3.5 py-2 text-ui font-medium text-ink"
        >
          <Plus className="size-4 text-ink-soft" aria-hidden="true" />
          <span>{t('nav.newChat')}</span>
        </button>

        <nav aria-label={t('nav.sections')} className="mt-4">
          <ul className="space-y-0.5">
            {sections.map((section) => {
              const active =
                location === section.path || location.startsWith(`${section.path}/`);
              return (
                <li key={section.id}>
                  <Link
                    href={section.path}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`focus-ring flex min-h-9 items-center gap-2.5 rounded-control px-2.5 py-2 text-ui font-medium transition-colors duration-150 ${
                      active
                        ? 'bg-surface text-ink shadow-card'
                        : 'text-ink-soft hover:bg-surface-soft hover:text-ink'
                    }`}
                  >
                    <SectionIcon id={section.id} active={active} />
                    <span className="truncate">{section.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-5 flex min-h-0 flex-1 flex-col">
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
                        : 'text-ink-soft hover:bg-surface-soft'
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

      <footer className="mt-3 flex items-center justify-between gap-1.5 border-t border-border pt-3">
        <ThemeToggle />
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              onStartContact();
              onNavigate?.();
            }}
            className="focus-ring inline-flex min-h-9 cursor-pointer items-center rounded-pill px-2.5 text-micro font-medium text-ink-soft transition-colors duration-150 hover:bg-surface-soft hover:text-ink"
          >
            {t('nav.contact')}
          </button>
          <Link
            href="/experiencia"
            onClick={onNavigate}
            aria-label={t('nav.cv')}
            className="focus-ring inline-flex min-h-9 items-center rounded-pill px-2.5 text-micro font-medium text-ink-soft transition-colors duration-150 hover:bg-surface-soft hover:text-ink"
          >
            CV
          </Link>
        </div>
      </footer>
    </aside>
  );
}
