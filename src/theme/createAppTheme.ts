'use client';

import { createTheme, Theme, alpha } from '@mui/material/styles';
import { ThemeMode } from './theme-config';

const sharedTypography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h4: { fontWeight: 700, letterSpacing: '-0.02em' },
  h5: { fontWeight: 600, letterSpacing: '-0.01em' },
  h6: { fontWeight: 600 },
  button: { fontWeight: 600 },
};

const sharedShape = { borderRadius: 12 };

function buildComponents(mode: 'light' | 'dark', primaryMain: string) {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          boxShadow: `0 4px 14px ${alpha(primaryMain, 0.35)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow:
            mode === 'light'
              ? '0 4px 24px rgba(15, 23, 42, 0.06)'
              : '0 4px 24px rgba(0, 0, 0, 0.35)',
          border: `1px solid ${mode === 'light' ? alpha('#0f172a', 0.06) : alpha('#fff', 0.08)}`,
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${mode === 'light' ? alpha('#0f172a', 0.08) : alpha('#fff', 0.08)}`,
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${mode === 'light' ? alpha('#0f172a', 0.08) : alpha('#fff', 0.08)}`,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          minHeight: 48,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
  };
}

export function createAppTheme(themeMode: ThemeMode): Theme {
  switch (themeMode) {
    case 'light-blue':
      return createTheme({
        palette: {
          mode: 'light',
          primary: {
            main: '#1565C0',
            light: '#42A5F5',
            dark: '#0D47A1',
            contrastText: '#ffffff',
          },
          secondary: { main: '#00838F', light: '#4FB3BF', dark: '#005662' },
          background: { default: '#EEF4FB', paper: '#FFFFFF' },
          text: { primary: '#0F172A', secondary: '#64748B' },
          divider: alpha('#0f172a', 0.08),
          error: { main: '#D32F2F' },
          warning: { main: '#ED6C02' },
          success: { main: '#2E7D32' },
          info: { main: '#0288D1' },
        },
        typography: sharedTypography,
        shape: sharedShape,
        components: buildComponents('light', '#1565C0'),
      });

    case 'dark-blue':
      return createTheme({
        palette: {
          mode: 'dark',
          primary: {
            main: '#64B5F6',
            light: '#90CAF9',
            dark: '#1976D2',
            contrastText: '#0B1929',
          },
          secondary: { main: '#4DD0E1', light: '#80DEEA', dark: '#00838F' },
          background: { default: '#0B1929', paper: '#122640' },
          text: { primary: '#E8F1FA', secondary: '#94A3B8' },
          divider: alpha('#ffffff', 0.08),
          error: { main: '#EF5350' },
          warning: { main: '#FFA726' },
          success: { main: '#66BB6A' },
          info: { main: '#29B6F6' },
        },
        typography: sharedTypography,
        shape: sharedShape,
        components: buildComponents('dark', '#64B5F6'),
      });

    case 'dark':
    default:
      return createTheme({
        palette: {
          mode: 'dark',
          primary: {
            main: '#90CAF9',
            light: '#BBDEFB',
            dark: '#42A5F5',
            contrastText: '#121212',
          },
          secondary: { main: '#80CBC4', light: '#B2DFDB', dark: '#00897B' },
          background: { default: '#121212', paper: '#1E1E1E' },
          text: { primary: '#F5F5F5', secondary: '#A0A0A0' },
          divider: alpha('#ffffff', 0.1),
          error: { main: '#EF5350' },
          warning: { main: '#FFB74D' },
          success: { main: '#81C784' },
          info: { main: '#4FC3F7' },
        },
        typography: sharedTypography,
        shape: sharedShape,
        components: buildComponents('dark', '#90CAF9'),
      });
  }
}
