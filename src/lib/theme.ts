export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'lastlook_theme';
const SYSTEM_QUERY = '(prefers-color-scheme: dark)';

const isTheme = (value: string | null): value is Theme =>
  value === 'light' || value === 'dark' || value === 'system';

export const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  const saved = window.localStorage.getItem(THEME_KEY);
  return isTheme(saved) ? saved : 'system';
};

export const setStoredTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_KEY, theme);
};

export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia(SYSTEM_QUERY).matches ? 'dark' : 'light';
};

export const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return 'light';
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
  return resolved;
};

export const initializeTheme = (): Theme => {
  const stored = getStoredTheme();
  applyTheme(stored);
  return stored;
};

export const getThemeKey = () => THEME_KEY;
