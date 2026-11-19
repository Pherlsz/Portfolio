import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { t } from '../i18n/pt-BR';

const STORAGE_KEY = 'pherls.theme';

function readInitialTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeToggle() {
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
      className="pill-button focus-ring"
      aria-label={t('theme.toggle')}
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun className="size-3.5 text-ink-soft" aria-hidden="true" />
      ) : (
        <Moon className="size-3.5 text-ink-soft" aria-hidden="true" />
      )}
      <span>{isDark ? 'Claro' : 'Escuro'}</span>
    </button>
  );
}
