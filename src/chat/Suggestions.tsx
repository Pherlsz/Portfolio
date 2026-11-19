import { useEffect, useState } from 'react';
import { ArrowUpRight, ShieldAlert } from 'lucide-react';
import { t } from '../i18n/pt-BR';
import { DEFAULT_SUGGESTIONS, type SuggestionsResponse } from '../utils/chat';

interface SuggestionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const FALLBACK_DATA: SuggestionsResponse = {
  featured: [...DEFAULT_SUGGESTIONS.featured],
  breakers: [...DEFAULT_SUGGESTIONS.breakers],
  week: null
};

let cachedSuggestions: SuggestionsResponse | null = null;
let inflightRequest: Promise<SuggestionsResponse> | null = null;

async function loadSuggestions(): Promise<SuggestionsResponse> {
  if (cachedSuggestions) return cachedSuggestions;
  if (inflightRequest) return inflightRequest;

  inflightRequest = (async () => {
    try {
      const response = await fetch('/api/suggestions', {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) return FALLBACK_DATA;
      const json = (await response.json()) as Partial<SuggestionsResponse>;
      const featured =
        Array.isArray(json.featured) && json.featured.length > 0
          ? json.featured.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          : FALLBACK_DATA.featured;
      const breakers =
        Array.isArray(json.breakers) && json.breakers.length > 0
          ? json.breakers.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          : FALLBACK_DATA.breakers;
      const resolved: SuggestionsResponse = {
        featured: featured.length > 0 ? featured : FALLBACK_DATA.featured,
        breakers: breakers.length > 0 ? breakers : FALLBACK_DATA.breakers,
        week: typeof json.week === 'string' ? json.week : null
      };
      cachedSuggestions = resolved;
      return resolved;
    } catch {
      return FALLBACK_DATA;
    } finally {
      inflightRequest = null;
    }
  })();

  return inflightRequest;
}

export default function Suggestions({ onSelect, disabled = false }: SuggestionsProps) {
  const [data, setData] = useState<SuggestionsResponse>(() => cachedSuggestions ?? FALLBACK_DATA);

  useEffect(() => {
    let active = true;
    void loadSuggestions().then((result) => {
      if (active) setData(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mt-7 w-full space-y-6">
      <section aria-label={t('chat.featuredHeading')}>
        <div className="mb-2.5 flex items-baseline justify-between gap-2 px-1">
          <p className="text-micro font-medium text-muted">{t('chat.featuredHeading')}</p>
          {data.week && (
            <p className="font-mono text-micro tabular-nums text-muted">{data.week}</p>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {data.featured.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={disabled}
              data-cursor="perguntar"
              onClick={() => onSelect(prompt)}
              className="group card-editorial focus-ring relative flex min-h-[6.25rem] flex-col justify-between gap-3 p-4 text-left disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-ui font-medium leading-snug text-ink">{prompt}</span>
              <span className="flex justify-end">
                <ArrowUpRight
                  className="size-3.5 text-muted opacity-65 transition-[color,opacity] duration-150 group-hover:text-ink group-hover:opacity-100 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </span>
            </button>
          ))}
        </div>
      </section>

      {data.breakers.length > 0 && (
        <section aria-label={t('chat.breakersHeading')}>
          <div className="mb-2 flex items-center gap-1.5 px-1">
            <ShieldAlert className="size-3.5 text-muted" aria-hidden="true" />
            <p className="font-mono text-micro uppercase tracking-[0.06em] text-muted">
              {t('chat.breakersHeading')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.breakers.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={disabled}
                data-cursor="perguntar"
                onClick={() => onSelect(prompt)}
                className="focus-ring inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-pill border border-dashed border-border-strong bg-surface-soft px-3 py-1.5 text-left text-micro font-medium text-ink-soft transition-colors duration-150 hover:border-ink hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden="true" className="font-mono text-muted">
                  //
                </span>
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
