'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeMode, THEME_STORAGE_KEY } from '@/theme/theme-config';
import { createAppTheme } from '@/theme/createAppTheme';

interface ThemeModeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light-blue';
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  if (stored === 'light-blue' || stored === 'dark-blue' || stored === 'dark') {
    return stored;
  }
  return 'light-blue';
}

function readThemeFromDom(): ThemeMode {
  const value = document.documentElement.dataset.theme;
  if (value === 'light-blue' || value === 'dark-blue' || value === 'dark') {
    return value;
  }
  return getInitialTheme();
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light-blue');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeModeState(readThemeFromDom());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme =
      themeMode === 'light-blue' ? 'light' : 'dark';
  }, [themeMode, ready]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  const value = useMemo(() => ({ themeMode, setThemeMode }), [themeMode, setThemeMode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {ready ? <CssBaseline /> : null}
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}
