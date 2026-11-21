import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { t } from '../i18n/pt-BR';

const STORAGE_KEY = 'pherls.theme';
const THEME_EVENT = 'pherls:theme-change';

function readInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Ignore storage access errors
  }
  if (document.documentElement.classList.contains('dark')) return 'dark';
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

function applyThemeToDocument(theme: 'light' | 'dark') {
  const root = document.documentElement;
  const isDark = theme === 'dark';
  if (root.classList.contains('dark') !== isDark) {
    root.classList.add('theme-switching');
    root.classList.toggle('dark', isDark);
    void root.offsetHeight;
    root.classList.remove('theme-switching');
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? '#0c0d0c' : '#ecebe6');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage quota / private mode failures
  }
}

export function ThemeToggle({ iconOnly = false }: { iconOnly?: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(readInitialTheme);

  useEffect(() => {
    applyThemeToDocument(theme);
    const onThemeChange = (event: Event) => {
      const next = (event as CustomEvent<'light' | 'dark'>).detail;
      if (next === 'light' || next === 'dark') {
        setTheme(next);
      }
    };
    window.addEventListener(THEME_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_EVENT, onThemeChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDark = theme === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';
  const title = isDark ? t('theme.light') : t('theme.dark');
  const ariaLabel = isDark
    ? 'Tema escuro ativo. Alternar para tema claro'
    : 'Tema claro ativo. Alternar para tema escuro';

  function handleToggle() {
    applyThemeToDocument(nextTheme);
    setTheme(nextTheme);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: nextTheme }));
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={title}
      className={
        iconOnly
          ? 'focus-ring inline-flex size-8 cursor-pointer appearance-none items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-ink'
          : 'pill-button focus-ring appearance-none'
      }
      aria-label={ariaLabel}
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
