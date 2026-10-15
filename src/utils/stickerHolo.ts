import { useEffect, useState } from 'react';

export const STICKER_HOLO_STORAGE_KEY = 'pherls:sticker-holo';

/** Lid cat stickers only — never d20 / typescript / react / nextjs. */
export const HOLO_ELIGIBLE_LID_STICKER_IDS = ['morcega', 'banguela', 'tomada'] as const;

export type HoloMode = 'all' | 'none';

export interface HoloState {
  mode: HoloMode;
  id: null;
  v: 1;
}

const NONE: HoloState = { mode: 'none', id: null, v: 1 };
const ALL: HoloState = { mode: 'all', id: null, v: 1 };

function randomUnit(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32;
  }
  return Math.random();
}

/**
 * Holo roulette: one roll per browser tab, persisted in `pherls:sticker-holo`.
 * - Production: 1/100 chance that all three cat lid stickers go holo together; otherwise none.
 * - No single-sticker wins (morcega, banguela, tomada only; always all three or nothing).
 * - DEV (`import.meta.env.DEV`): `?holo=1` and `?holo=all` both force all three cats holo.
 */
export function rollHolo(): HoloState {
  if (randomUnit() < 1 / 100) {
    return ALL;
  }
  return NONE;
}

function isValidStoredState(value: unknown): value is HoloState {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record.v !== 1) return false;
  if (record.mode !== 'none' && record.mode !== 'all') return false;
  return record.id === null || record.id === undefined;
}

export function readStickerHoloFromSession(): HoloState | null {
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

export function writeStickerHoloToSession(state: HoloState): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STICKER_HOLO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

/** DEV-only: `?holo=1` and `?holo=all` both force all cat stickers holo. Ignored in production. */
export function devHoloOverride(): HoloState | null {
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

export function resolveStickerHolo(): HoloState {
  const dev = devHoloOverride();
  if (dev) {
    writeStickerHoloToSession(dev);
    return dev;
  }
  const stored = readStickerHoloFromSession();
  if (stored) return stored;
  const rolled = rollHolo();
  writeStickerHoloToSession(rolled);
  return rolled;
}

export function isStickerHoloActive(
  state: HoloState,
  stickerId: string,
  eligibleIds: readonly string[] = HOLO_ELIGIBLE_LID_STICKER_IDS
): boolean {
  if (!eligibleIds.includes(stickerId)) return false;
  return state.mode === 'all';
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
