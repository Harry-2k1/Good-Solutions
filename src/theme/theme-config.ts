export type ThemeMode = 'light-blue' | 'dark-blue' | 'dark';

export const THEME_STORAGE_KEY = 'goodsolutions-theme';

export const themeLabels: Record<ThemeMode, string> = {
  'light-blue': 'Light Blue',
  'dark-blue': 'Dark Blue',
  dark: 'Dark Mode',
};

export const themeDescriptions: Record<ThemeMode, string> = {
  'light-blue': 'Clean professional light theme',
  'dark-blue': 'Deep navy dark theme',
  dark: 'Neutral dark theme',
};
