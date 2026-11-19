import { lazy, memo, Suspense, useCallback, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  FileText,
  Mail,
  RotateCcw
} from 'lucide-react';
import { useLocation } from 'wouter';
import type { ChatAction } from '../utils/chat';
import ChatContentCards from './ChatContentCards';
import { ChatLoader } from './ChatLoader';
import type { ChatMessage } from './chatStore';
import Mascot from './Mascot';

function safeUrlTransform(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed, 'https://pherls.dev');
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'mailto:') {
      return trimmed;
    }
    return '';
  } catch {
    return '';
  }
}

const LazyMarkdown = lazy(async () => {
  const [{ default: ReactMarkdown }, { default: remarkGfm }] = await Promise.all([
    import('react-markdown'),
    import('remark-gfm')
  ]);

  function MarkdownRenderer({ content }: { content: string }) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={safeUrlTransform}
        components={{
          a: ({ href, children }) => {
            const safeHref = href ? safeUrlTransform(href) : '';
            if (!safeHref) {
              return <span className="text-ink-soft">{children}</span>;
            }
            const isExternal = safeHref.startsWith('http://') || safeHref.startsWith('https://');
            return (
              <a
                href={safeHref}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="focus-ring rounded-sm font-medium text-ink underline decoration-border-strong underline-offset-4 transition-colors duration-150 hover:decoration-ink"
              >
                {children}
              </a>
            );
          },
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => (
            <h2 className="mb-2 mt-4 font-display text-lead font-bold text-ink first:mt-0">{children}</h2>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 font-display text-lead font-bold text-ink first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h4 className="mb-1.5 mt-3 text-body font-semibold text-ink first:mt-0">{children}</h4>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-border-strong pl-3 text-ink-soft last:mb-0">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isBlock = Boolean(className);
            if (isBlock) {
              return <code className="font-mono text-ui text-code-ink">{children}</code>;
            }
            return (
              <code className="rounded-md bg-surface-soft px-1.5 py-0.5 font-mono text-ui text-ink">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-inner bg-code-bg p-3.5 font-mono text-ui leading-relaxed text-code-ink last:mb-0">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto rounded-control border border-border last:mb-0">
              <table className="w-full border-collapse text-left text-ui">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-surface-soft px-3 py-2 font-semibold text-ink">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-2 text-ink-soft last:border-b-0">{children}</td>
          ),
          hr: () => <hr className="my-4 border-border" />
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  return { default: MarkdownRenderer };
});

interface MessageBubbleProps {
  message: ChatMessage;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
  onContactAction?: (prefill?: string) => void;
}

function MessageBubbleInner({
  message,
  canRegenerate = false,
  onRegenerate,
  onContactAction
}: MessageBubbleProps) {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!message.text) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted contexts.
    }
  }, [message.text]);

  const handleAction = useCallback(
    (action: ChatAction) => {
      if (action.type === 'route' || action.type === 'navigate') {
        const target = action.value.startsWith('/') ? action.value : `/${action.value}`;
        setLocation(target);
        return;
      }
      if (action.type === 'export_cv') {
        const href = action.value || '/cv/Pedro-Henrique-Lopes-CV.pdf';
        if (href.startsWith('/experiencia') || href === '/cv') {
          setLocation(href);
        } else {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      if (action.type === 'contact') {
        if (onContactAction) {
          onContactAction(action.value || undefined);
        } else {
          setLocation('/experiencia');
        }
      }
    },
    [onContactAction, setLocation]
  );

  if (message.role === 'user') {
    return (
      <div className="message-in flex justify-end">
        <div className="max-w-[85%] rounded-card bg-accent px-4 py-3 text-body text-on-accent sm:max-w-[75%]">
          {message.attachmentName && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-pill bg-surface-soft px-2.5 py-1 font-mono text-micro text-on-accent/90">
              <FileText className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{message.attachmentName}</span>
            </div>
          )}
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
        </div>
      </div>
    );
  }

  const isStreaming = message.status === 'streaming';
  const hasText = message.text.trim().length > 0;
  const reasoning = message.reasoning ?? 'default';

  return (
    <article className="message-in flex flex-col gap-1.5" aria-busy={isStreaming}>
      {isStreaming && !hasText && <ChatLoader reasoning={reasoning} />}
      {isStreaming && hasText && (
        <Mascot reasoning={reasoning} statusText="Escrevendo resposta" />
      )}

      {message.notice && (
        <div className="rounded-control border border-border bg-warn-soft px-3 py-2 text-ui text-warn">
          {message.notice}
        </div>
      )}

      {hasText && (
        <div
          className={`text-body leading-relaxed ${
            message.status === 'error' ? 'text-danger' : 'text-ink'
          }`}
        >
          <Suspense fallback={<p className="whitespace-pre-wrap break-words">{message.text}</p>}>
            <LazyMarkdown content={message.text} />
          </Suspense>
        </div>
      )}

      {message.status === 'aborted' && (
        <p className="font-mono text-micro text-muted">Resposta interrompida.</p>
      )}

      <ChatContentCards cards={message.cards} />

      {message.actions && message.actions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {message.actions.map((action, index) => (
            <button
              key={`${action.type}-${action.value}-${index}`}
              type="button"
              onClick={() => handleAction(action)}
              className="pill-button focus-ring"
            >
              {action.type === 'export_cv' ? (
                <Download className="size-3.5 text-muted" aria-hidden="true" />
              ) : action.type === 'contact' ? (
                <Mail className="size-3.5 text-muted" aria-hidden="true" />
              ) : (
                <ArrowUpRight className="size-3.5 text-muted" aria-hidden="true" />
              )}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {!isStreaming && (hasText || canRegenerate) && (
        <div className="mt-1 flex items-center gap-1">
          {hasText && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? 'Resposta copiada' : 'Copiar resposta'}
              className="focus-ring inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-control px-2.5 py-1 text-micro font-medium text-muted transition-colors duration-150 hover:bg-surface-soft hover:text-ink"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-ok" aria-hidden="true" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden="true" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          )}

          {canRegenerate && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              aria-label="Gerar resposta novamente"
              className="focus-ring inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-control px-2.5 py-1 text-micro font-medium text-muted transition-colors duration-150 hover:bg-surface-soft hover:text-ink"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>Tentar de novo</span>
            </button>
          )}
        </div>
      )}
    </article>
  );
}

const MessageBubble = memo(MessageBubbleInner, (prev, next) => {
  if (prev.message.status === 'streaming' || next.message.status === 'streaming') {
    return false;
  }
  return (
    prev.message === next.message &&
    prev.canRegenerate === next.canRegenerate &&
    prev.onRegenerate === next.onRegenerate &&
    prev.onContactAction === next.onContactAction
  );
});

export default MessageBubble;
