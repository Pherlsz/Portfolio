export const INTRO_SESSION_KEY = 'pherls:intro-seen';

export interface IntroEligibilityOptions {
  pathname: string;
  alreadySeen: boolean;
  prefersReducedMotion: boolean;
  finePointer: boolean;
  saveData: boolean;
  effectiveType?: string;
}

const EXCLUDED_PREFIXES = ['/cv', '/v1'] as const;
const SLOW_NETWORK_TYPES = new Set(['slow-2g', '2g', '3g']);

export function shouldShowIntro(opts: IntroEligibilityOptions): boolean {
  if (opts.alreadySeen) return false;
  if (opts.prefersReducedMotion) return false;
  if (!opts.finePointer) return false;
  if (opts.saveData) return false;
  if (opts.effectiveType && SLOW_NETWORK_TYPES.has(opts.effectiveType)) {
    return false;
  }

  for (const prefix of EXCLUDED_PREFIXES) {
    if (opts.pathname === prefix || opts.pathname.startsWith(`${prefix}/`)) {
      return false;
    }
  }

  return true;
}
