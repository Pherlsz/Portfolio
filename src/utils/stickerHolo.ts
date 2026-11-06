import { useEffect, useState } from 'react';

const STICKER_HOLO_STORAGE_KEY = 'pherls:sticker-holo';
const HOLO_SCHEMA_VERSION = 2 as const;

/** Production all-three odds. Locked 2026-10-15. */
const ALL_ODDS = 1 / 100;

/** Lid cat stickers only — never d20 / typescript / react / nextjs. */
const HOLO_ELIGIBLE_LID_STICKER_IDS = ['morcega', 'banguela', 'tomada'] as const;

type HoloEligibleId = (typeof HOLO_ELIGIBLE_LID_STICKER_IDS)[number];

const HOLO_MASK_SRC: Record<HoloEligibleId, string> = {
  morcega: '/holo-masks/morcega-cut.png',
  banguela: '/holo-masks/banguela-cut.png',
  tomada: '/holo-masks/tomada-cut.png'
};

type HoloMode = 'all' | 'none';

interface HoloState {
  mode: HoloMode;
  id: null;
  v: typeof HOLO_SCHEMA_VERSION;
}

const NONE: HoloState = { mode: 'none', id: null, v: HOLO_SCHEMA_VERSION };
const ALL: HoloState = { mode: 'all', id: null, v: HOLO_SCHEMA_VERSION };

function randomUnit(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32;
  }
  return Math.random();
}

/**
 * Holo roulette: one roll per browser tab, persisted in `pherls:sticker-holo` v:2.
 * - Production: 1/100 all three cats together; otherwise none.
 * - DEV: `?holo=1` / `?holo=all` force all three and do not write sessionStorage.
 */
function rollHolo(random: () => number = randomUnit): HoloState {
  if (random() < ALL_ODDS) {
    return ALL;
  }
  return NONE;
}

function isValidStoredState(value: unknown): value is HoloState {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record.v !== HOLO_SCHEMA_VERSION) return false;
  if (record.mode !== 'none' && record.mode !== 'all') return false;
  return record.id === null || record.id === undefined;
}

function readStickerHoloFromSession(): HoloState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STICKER_HOLO_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredState(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStickerHoloToSession(state: HoloState): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STICKER_HOLO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

/** DEV-only: `?holo=1` and `?holo=all` force all cats. Ignored in production. Never writes storage. */
function devHoloOverride(): HoloState | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('holo');
  if (param === 'all' || param === '1') {
    return ALL;
  }
  return null;
}

function initialHoloState(): HoloState {
  const dev = devHoloOverride();
  if (dev) return dev;
  const stored = readStickerHoloFromSession();
  if (stored) return stored;
  return NONE;
}

function resolveStickerHolo(): HoloState {
  const dev = devHoloOverride();
  if (dev) return dev;
  const stored = readStickerHoloFromSession();
  if (stored) return stored;
  const rolled = rollHolo();
  writeStickerHoloToSession(rolled);
  return rolled;
}

export function isStickerHoloActive(state: HoloState, stickerId: string): boolean {
  if (!isHoloEligibleId(stickerId)) return false;
  return state.mode === 'all';
}

export function holoMaskUrl(stickerId: string): string | undefined {
  if (!isHoloEligibleId(stickerId)) return undefined;
  return HOLO_MASK_SRC[stickerId];
}

function isHoloEligibleId(id: string): id is HoloEligibleId {
  return (HOLO_ELIGIBLE_LID_STICKER_IDS as readonly string[]).includes(id);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useHoloRoulette(): HoloState {
  const [holo, setHolo] = useState<HoloState>(() => initialHoloState());

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setHolo(resolveStickerHolo());
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return holo;
}
