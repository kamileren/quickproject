/**
 * Reading preferences (text size, colours), kept in the reader's browser.
 *
 * The same few lines also run inline in the page head, before anything is
 * drawn, so a reader who chose dark colours never sees a flash of white. Keep
 * PREFS_KEY and the attribute names in step with BaseLayout.astro.
 */
export const PREFS_KEY = 'book-of-ml:prefs:v1';

export type TextSize = 's' | 'm' | 'l';
export type Theme = 'light' | 'dark' | 'auto';

export interface Prefs {
  size: TextSize;
  theme: Theme;
}

export const DEFAULT_PREFS: Prefs = { size: 'm', theme: 'light' };

const SIZES: readonly string[] = ['s', 'm', 'l'];
const THEMES: readonly string[] = ['light', 'dark', 'auto'];

/** Reads stored preferences, falling back to the defaults for anything missing or odd. */
export function parsePrefs(raw: string | null): Prefs {
  try {
    const parsed = JSON.parse(raw ?? '{}') as Partial<Prefs>;
    return {
      size: SIZES.includes(parsed.size as string) ? (parsed.size as TextSize) : DEFAULT_PREFS.size,
      theme: THEMES.includes(parsed.theme as string) ? (parsed.theme as Theme) : DEFAULT_PREFS.theme,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/** Whether the page should be drawn dark, given the preference and what the device asks for. */
export function isDark(theme: Theme, deviceWantsDark: boolean): boolean {
  return theme === 'dark' || (theme === 'auto' && deviceWantsDark);
}

export function loadPrefs(): Prefs {
  try {
    return parsePrefs(localStorage.getItem(PREFS_KEY));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // The choice still applies to this page; it just will not be remembered.
  }
}

/** Puts the preferences on the page. */
export function applyPrefs(prefs: Prefs): void {
  const root = document.documentElement;
  root.dataset.size = prefs.size;
  root.dataset.theme = isDark(prefs.theme, matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}
