import { useEffect, useState } from 'react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';

function syncThemeColor() {
  const dark = document.documentElement.classList.contains('dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1c1915' : '#f4f1ea');
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  useEffect(() => {
    syncThemeColor();
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    syncThemeColor();
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Private mode: theme lasts for this visit only.
    }
    setTheme(next);
  };

  return { theme, toggleTheme };
}

export function SiteHeader({
  onOpenAssistant,
  onOpenCv
}: {
  onOpenAssistant: () => void;
  onOpenCv: () => void;
}) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <p className="font-mono text-sm text-ink-soft">
        {profile.jobTitle}
        <span className="mx-2 text-ink-soft" aria-hidden="true">
          ·
        </span>
        <span>{profile.location}</span>
      </p>
      <p className="flex flex-wrap items-center gap-x-4">
        <button
          type="button"
          onClick={onOpenAssistant}
          aria-haspopup="dialog"
          aria-controls="assistente"
          className="link min-h-11 px-1 text-sm"
        >
          Perguntar
        </button>
        <button
          type="button"
          onClick={onOpenCv}
          aria-haspopup="dialog"
          aria-controls="cv-preview"
          className="link min-h-11 px-1 text-sm"
        >
          Ver CV
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="link min-h-11 px-1 text-sm"
        >
          {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        </button>
      </p>
    </div>
  );
}
