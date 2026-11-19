import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent
} from 'react';
import {
  AlignLeft,
  ArrowUp,
  Briefcase,
  FileText,
  History,
  Mail,
  Paperclip,
  Plus,
  Square,
  X
} from 'lucide-react';
import { t } from '../i18n/pt-BR';
import { MESSAGE_LIMIT, type ChatSkill, type Reasoning } from '../utils/chat';
import ReasoningSelect from './ReasoningSelect';

const MAX_ATTACHMENT_BYTES = 200 * 1024;
const MAX_ATTACHMENT_CHARS = 8000;
const ALLOWED_EXTENSIONS = ['.txt', '.md'];

export interface ComposerSubmitPayload {
  text: string;
  skill?: ChatSkill;
  attachmentText?: string;
  attachmentName?: string;
}

interface ComposerProps {
  reasoning: Reasoning;
  onReasoningChange: (next: Reasoning) => void;
  isStreaming: boolean;
  onSend: (payload: ComposerSubmitPayload) => void;
  onStop: () => void;
  autoFocus?: boolean;
}

interface AttachmentState {
  name: string;
  text: string;
  truncated: boolean;
}

export default function Composer({
  reasoning,
  onReasoningChange,
  isStreaming,
  onSend,
  onStop,
  autoFocus = false
}: ComposerProps) {
  const [value, setValue] = useState('');
  const [activeSkill, setActiveSkill] = useState<ChatSkill | null>(null);
  const [attachment, setAttachment] = useState<AttachmentState | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, 220);
    el.style.height = `${Math.max(nextHeight, 44)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (isStreaming) setMenuOpen(false);
  }, [isStreaming]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (menuRootRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        plusButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const trimmedLength = value.trim().length;
  const overLimit = value.length > MESSAGE_LIMIT;
  const showCounter = value.length >= Math.floor(MESSAGE_LIMIT * 0.8);
  const canSubmit = !isStreaming && !overLimit && (trimmedLength > 0 || Boolean(attachment));

  const submit = useCallback(() => {
    if (!canSubmit) return;
    onSend({
      text: value.trim(),
      skill: activeSkill ?? undefined,
      attachmentText: attachment?.text,
      attachmentName: attachment?.name
    });
    setValue('');
    setActiveSkill(null);
    setAttachment(null);
    setFileError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  }, [activeSkill, attachment, canSubmit, onSend, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    setMenuOpen(false);
    if (!file) return;

    const lower = file.name.toLowerCase();
    const validExt = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (!validExt) {
      setFileError('Aceito apenas arquivos .txt ou .md.');
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setFileError('O arquivo excede o limite de 200 KB.');
      return;
    }

    try {
      const raw = await file.text();
      const normalized = raw.trim();
      if (!normalized) {
        setFileError('O arquivo selecionado está vazio.');
        return;
      }
      const truncated = normalized.length > MAX_ATTACHMENT_CHARS;
      setAttachment({
        name: file.name,
        text: truncated ? normalized.slice(0, MAX_ATTACHMENT_CHARS) : normalized,
        truncated
      });
      setFileError(null);
      textareaRef.current?.focus();
    } catch {
      setFileError('Não foi possível ler o arquivo selecionado.');
    }
  };

  const triggerQuickCommand = (command: '/vaga' | '/resumo' | '/contato' | '/v1') => {
    setMenuOpen(false);
    setFileError(null);

    if (command === '/vaga') {
      setActiveSkill('vaga');
      textareaRef.current?.focus();
      return;
    }

    if (command === '/resumo') {
      if (value.trim() || attachment) {
        setActiveSkill('resumo');
        textareaRef.current?.focus();
      } else {
        onSend({ text: '/resumo', skill: 'resumo' });
      }
      return;
    }

    onSend({ text: command });
  };

  return (
    <div className="w-full">
      <div className="surface-composer p-3 sm:p-3.5">
        {(activeSkill || attachment) && (
          <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
            {activeSkill && (
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-strong bg-accent-soft py-1 pr-1.5 pl-3 font-mono text-micro font-medium text-ink">
                <span>/{activeSkill}</span>
                <button
                  type="button"
                  onClick={() => setActiveSkill(null)}
                  aria-label={`Remover modo /${activeSkill}`}
                  className="focus-ring inline-flex size-5 cursor-pointer items-center justify-center rounded-pill text-muted transition-colors duration-150 hover:text-ink"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            )}

            {attachment && (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-pill border border-border bg-surface-soft py-1 pr-1.5 pl-2.5 font-mono text-micro text-ink-soft">
                <FileText className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                <span className="truncate">{attachment.name}</span>
                {attachment.truncated && <span className="text-muted">(8k)</span>}
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  aria-label={`Remover anexo ${attachment.name}`}
                  className="focus-ring inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-pill text-muted transition-colors duration-150 hover:text-ink"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            )}
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeSkill === 'vaga'
              ? 'Cole a descrição da vaga ou anexe um arquivo .txt/.md...'
              : t('chat.placeholder')
          }
          aria-label={t('chat.placeholder')}
          className="block max-h-[220px] min-h-[44px] w-full resize-none bg-transparent px-1.5 py-1.5 text-body text-ink placeholder:text-muted outline-none focus-visible:outline-none"
        />

        {fileError && (
          <p role="alert" className="px-1.5 pb-1 text-micro text-danger">
            {fileError}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div ref={menuRootRef} className="relative inline-flex">
              <button
                ref={plusButtonRef}
                type="button"
                disabled={isStreaming}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls={menuOpen ? menuId : undefined}
                aria-label="Ações, comandos e anexos"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="pill-button focus-ring w-[34px] justify-center !px-0"
              >
                <Plus
                  className={`size-4 transition-transform duration-150 ${menuOpen ? 'rotate-45' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {menuOpen && (
                <div
                  id={menuId}
                  role="menu"
                  aria-label="Comandos e anexos"
                  className="surface-popover popover-in absolute bottom-full left-0 z-40 mb-2 w-[min(19rem,calc(100vw-2rem))] p-2"
                >
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => triggerQuickCommand('/vaga')}
                      className="focus-ring flex w-full cursor-pointer items-start gap-2.5 rounded-control px-2.5 py-2 text-left transition-colors duration-150 hover:bg-surface-hover"
                    >
                      <Briefcase className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block font-mono text-ui font-medium text-ink">
                          {t('skills.vaga')}
                        </span>
                        <span className="block text-micro text-muted">{t('skills.vagaDesc')}</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => triggerQuickCommand('/resumo')}
                      className="focus-ring flex w-full cursor-pointer items-start gap-2.5 rounded-control px-2.5 py-2 text-left transition-colors duration-150 hover:bg-surface-hover"
                    >
                      <AlignLeft className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block font-mono text-ui font-medium text-ink">
                          {t('skills.resumo')}
                        </span>
                        <span className="block text-micro text-muted">{t('skills.resumoDesc')}</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => triggerQuickCommand('/contato')}
                      className="focus-ring flex w-full cursor-pointer items-start gap-2.5 rounded-control px-2.5 py-2 text-left transition-colors duration-150 hover:bg-surface-hover"
                    >
                      <Mail className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block font-mono text-ui font-medium text-ink">/contato</span>
                        <span className="block text-micro text-muted">
                          Abre o formulário de recado direto
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => triggerQuickCommand('/v1')}
                      className="focus-ring flex w-full cursor-pointer items-start gap-2.5 rounded-control px-2.5 py-2 text-left transition-colors duration-150 hover:bg-surface-hover"
                    >
                      <History className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block font-mono text-ui font-medium text-ink">/v1</span>
                        <span className="block text-micro text-muted">
                          Mostra a versão arquivada de 2025
                        </span>
                      </span>
                    </button>
                  </div>

                  <div className="my-1.5 border-t border-border" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => fileInputRef.current?.click()}
                    className="focus-ring flex w-full cursor-pointer items-start gap-2.5 rounded-control px-2.5 py-2 text-left transition-colors duration-150 hover:bg-surface-hover"
                  >
                    <Paperclip className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-ui font-medium text-ink">Anexar .txt ou .md</span>
                      <span className="block text-micro text-muted">
                        Leitura local, até 200 KB
                      </span>
                    </span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={handleFileChange}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>

            <ReasoningSelect
              value={reasoning}
              onChange={onReasoningChange}
              disabled={isStreaming}
            />
          </div>

          <div className="flex items-center gap-2">
            {showCounter && (
              <span
                className={`font-mono text-micro tabular-nums ${
                  overLimit ? 'font-semibold text-danger' : 'text-muted'
                }`}
              >
                {value.length}/{MESSAGE_LIMIT}
              </span>
            )}

            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                aria-label={t('chat.stop')}
                className="focus-ring inline-flex size-9 cursor-pointer items-center justify-center rounded-pill bg-accent text-on-accent transition-opacity duration-150 hover:opacity-90"
              >
                <Square className="size-3.5 fill-current" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                aria-label={t('chat.send')}
                className="focus-ring inline-flex size-9 cursor-pointer items-center justify-center rounded-pill bg-accent text-on-accent transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2.5 text-center text-micro text-muted">{t('chat.privacyNotice')}</p>
    </div>
  );
}
