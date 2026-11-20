import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, FileCode2, Send } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { CONTACT_API, SITE_ORIGIN } from '../data/portfolioData';
import { t } from '../i18n/pt-BR';

interface EndpointDoc {
  id: string;
  path: string;
  method: 'GET' | 'POST';
  format: string;
  description: string;
  previewable: boolean;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    id: 'llms',
    path: '/llms.txt',
    method: 'GET',
    format: 'text/plain',
    description: 'Resumo estruturado do perfil, experiência, projetos e rotas para agentes de IA.',
    previewable: true
  },
  {
    id: 'cv-json',
    path: '/cv.json',
    method: 'GET',
    format: 'application/json',
    description: 'Currículo completo no padrão JSON Resume gerado da mesma fonte de dados.',
    previewable: true
  },
  {
    id: 'cv-md',
    path: '/cv.md',
    method: 'GET',
    format: 'text/markdown',
    description: 'Currículo em Markdown limpo pronto para leitura por modelos e ferramentas.',
    previewable: true
  },
  {
    id: 'sitemap',
    path: '/sitemap.xml',
    method: 'GET',
    format: 'application/xml',
    description: 'Mapa dinâmico de rotas públicas com conteúdo ativo.',
    previewable: true
  },
  {
    id: 'robots',
    path: '/robots.txt',
    method: 'GET',
    format: 'text/plain',
    description: 'Regras de rastreamento para buscadores e agentes automatizados.',
    previewable: true
  },
  {
    id: 'contact',
    path: CONTACT_API.path,
    method: 'POST',
    format: CONTACT_API.contentType,
    description: CONTACT_API.description,
    previewable: false
  }
];

const CONTACT_EXAMPLE = JSON.stringify(
  {
    name: 'Recrutador ou agente',
    email: 'contato@empresa.com',
    message: 'Resumo da oportunidade ou recado enviado pelo remetente.',
    source: 'agent'
  },
  null,
  2
);

const previewCache = new Map<string, string>();

export function AiFilesPage() {
  const [activeId, setActiveId] = useState<string>('llms');
  const [preview, setPreview] = useState<string>(() => previewCache.get('/llms.txt') ?? '');
  const [loading, setLoading] = useState<boolean>(() => !previewCache.has('/llms.txt'));
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const active = ENDPOINTS.find((item) => item.id === activeId) ?? ENDPOINTS[0];

  useEffect(() => {
    if (!active.previewable) {
      setPreview(CONTACT_EXAMPLE);
      setLoading(false);
      return;
    }

    const cached = previewCache.get(active.path);
    if (cached !== undefined) {
      setPreview(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(active.path)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((content) => {
        previewCache.set(active.path, content);
        if (!cancelled) setPreview(content);
      })
      .catch(() => {
        if (!cancelled) {
          setPreview(
            `Pré-visualização disponível no Worker em execução.\nURL pública: ${SITE_ORIGIN}${active.path}`
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active]);

  const copyUrl = async (endpoint: EndpointDoc) => {
    const url = `${SITE_ORIGIN}${endpoint.path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(endpoint.id);
      window.setTimeout(() => setCopiedId((prev) => (prev === endpoint.id ? null : prev)), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  const lineCount = preview ? preview.split('\n').length : 0;

  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-[90rem] flex-col px-5 pt-16 pb-4 sm:px-8 sm:pb-6 lg:px-10 lg:py-8">
      <PageHeader title={t('ai.title')} />

      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4 sm:mt-6 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-stretch lg:gap-5">
        <div
          className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:hidden"
          role="tablist"
          aria-label="Arquivos e endpoints"
        >
          {ENDPOINTS.map((endpoint) => {
            const isActive = endpoint.id === active.id;
            return (
              <button
                key={endpoint.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(endpoint.id)}
                className={`focus-ring inline-flex min-h-9 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-control border px-3 py-1.5 font-mono text-micro font-semibold transition-colors duration-150 ${
                  isActive
                    ? 'border-transparent bg-accent text-on-accent'
                    : 'border-border bg-surface text-ink-soft hover:border-border-strong hover:text-ink'
                }`}
              >
                {endpoint.method === 'POST' ? (
                  <Send className="size-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <FileCode2 className="size-3.5 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">{endpoint.path}</span>
              </button>
            );
          })}
        </div>

        <div
          className="surface-card hidden space-y-1 overflow-y-auto p-2 lg:block"
          role="list"
          aria-label="Arquivos e endpoints"
        >
          {ENDPOINTS.map((endpoint) => {
            const isActive = endpoint.id === active.id;
            const isCopied = copiedId === endpoint.id;
            return (
              <div
                key={endpoint.id}
                role="listitem"
                className={`rounded-inner border p-2.5 transition-colors duration-150 ${
                  isActive
                    ? 'border-border-strong bg-surface-hover'
                    : 'border-transparent hover:bg-surface-soft'
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveId(endpoint.id)}
                    aria-pressed={isActive}
                    className="focus-ring flex min-h-9 min-w-0 flex-1 flex-col items-start rounded-control p-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      {endpoint.method === 'POST' ? (
                        <Send className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                      ) : (
                        <FileCode2 className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                      )}
                      <span className="font-mono text-ui font-semibold text-ink">
                        {endpoint.path}
                      </span>
                      {endpoint.method === 'POST' ? (
                        <span className="rounded-pill bg-accent-soft px-2 py-0.5 font-mono text-micro font-medium text-ink">
                          {endpoint.method}
                        </span>
                      ) : null}
                    </div>
                    <span className="mt-1.5 rounded-pill border border-border bg-canvas px-2 py-0.5 font-mono text-micro text-muted">
                      {endpoint.format}
                    </span>
                    <p className="mt-2 text-micro leading-relaxed text-ink-soft">
                      {endpoint.description}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => copyUrl(endpoint)}
                      aria-label={`${isCopied ? t('ai.copied') : t('ai.copy')} URL de ${endpoint.path}`}
                      title={isCopied ? t('ai.copied') : `${t('ai.copy')} URL`}
                      className="focus-ring inline-flex size-8 items-center justify-center rounded-pill border border-border bg-surface text-ink-soft transition-colors duration-150 hover:border-border-strong hover:text-ink"
                    >
                      {isCopied ? (
                        <Check className="size-3.5 text-ok" aria-hidden="true" />
                      ) : (
                        <Copy className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                    {endpoint.previewable ? (
                      <a
                        href={endpoint.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${t('ai.open')} ${endpoint.path}`}
                        title={t('ai.open')}
                        className="focus-ring inline-flex size-8 items-center justify-center rounded-pill border border-border bg-surface text-ink-soft transition-colors duration-150 hover:border-border-strong hover:text-ink"
                      >
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="surface-card flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-3.5 sm:p-4">
          <div className="flex shrink-0 items-center justify-between gap-2 px-1 pt-0.5">
            <div className="flex min-w-0 items-center gap-2">
              {active.method === 'POST' ? (
                <Send className="size-4 shrink-0 text-muted" aria-hidden="true" />
              ) : (
                <FileCode2 className="size-4 shrink-0 text-muted" aria-hidden="true" />
              )}
              <span className="truncate font-mono text-ui font-semibold text-ink">
                {active.path}
              </span>
              <span className="shrink-0 rounded-pill border border-border bg-canvas px-2 py-0.5 font-mono text-micro text-ink-soft">
                {active.method}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => copyUrl(active)}
                className="focus-ring pill-button min-h-8 px-3 py-1 text-micro"
              >
                {copiedId === active.id ? (
                  <>
                    <Check className="size-3.5 text-ok" aria-hidden="true" />
                    <span>{t('ai.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" aria-hidden="true" />
                    <span>{t('ai.copy')}</span>
                  </>
                )}
              </button>
              {active.previewable ? (
                <a
                  href={active.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring pill-button min-h-8 px-3 py-1 text-micro"
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span>{t('ai.open')}</span>
                </a>
              ) : null}
            </div>
          </div>

          <p className="shrink-0 px-1 text-ui leading-snug text-ink-soft">{active.description}</p>

          <div className="flex min-h-[14rem] flex-1 flex-col overflow-hidden rounded-inner border border-border-strong bg-code-bg text-code-ink">
            <div className="flex min-h-9 shrink-0 items-center justify-between gap-2 border-b border-code-ink/15 px-3.5 py-2 font-mono text-micro text-code-ink/70 tabular-nums sm:px-4">
              <span className="truncate">{active.format}</span>
              <span className="shrink-0">
                {loading
                  ? 'Atualizando...'
                  : lineCount > 0
                    ? `${lineCount} ${lineCount === 1 ? 'linha' : 'linhas'}`
                    : ''}
              </span>
            </div>

            <div className="min-h-0 flex-1 p-3.5 sm:p-4">
              <pre
                className={`h-full overflow-auto font-mono text-micro leading-relaxed whitespace-pre-wrap break-words text-code-ink transition-opacity duration-150 ${
                  loading ? 'opacity-50' : 'opacity-100'
                }`}
              >
                <code>{preview || 'Carregando conteúdo...'}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
