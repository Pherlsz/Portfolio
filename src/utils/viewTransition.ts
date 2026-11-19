import { flushSync } from 'react-dom';

type NavigateFn = (to: string) => void;

interface ViewTransitionLike {
  finished: Promise<void>;
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void) => ViewTransitionLike;
};

function focusMainContent() {
  const main = document.getElementById('conteudo');
  if (main instanceof HTMLElement) {
    main.focus({ preventScroll: true });
    main.scrollTop = 0;
  }
}

export function navigateWithTransition(setLocation: NavigateFn, to: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    setLocation(to);
    return;
  }

  if (window.location.pathname === to) {
    return;
  }

  const doc = document as DocumentWithViewTransition;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!doc.startViewTransition || prefersReducedMotion) {
    setLocation(to);
    queueMicrotask(focusMainContent);
    return;
  }

  const transition = doc.startViewTransition(() => {
    flushSync(() => {
      setLocation(to);
    });
  });

  transition.finished.finally(focusMainContent);
}
