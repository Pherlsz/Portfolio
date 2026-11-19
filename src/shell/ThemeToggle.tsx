import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { t } from '../i18n/pt-BR';

const STORAGE_KEY = 'pherls.theme';

function readInitialTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeToggle({ iconOnly = false }: { iconOnly?: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(readInitialTheme);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0c0d0c' : '#ecebe6');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage quota / private mode failures
    }
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? t('theme.light') : t('theme.dark')}
      className={
        iconOnly
          ? 'focus-ring inline-flex size-8 cursor-pointer items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-ink'
          : 'pill-button focus-ring'
      }
      aria-label={t('theme.toggle')}
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun className="size-3.5 text-ink-soft" aria-hidden="true" />
      ) : (
        <Moon className="size-3.5 text-ink-soft" aria-hidden="true" />
      )}
      {iconOnly ? null : <span>{isDark ? 'Claro' : 'Escuro'}</span>}
    </button>
  );
}
