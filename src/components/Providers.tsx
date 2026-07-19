'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SessionProvider } from 'next-auth/react';
import { ThemeModeProvider } from '@/context/ThemeModeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeModeProvider>
        <AppRouterCacheProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            {children}
          </LocalizationProvider>
        </AppRouterCacheProvider>
      </ThemeModeProvider>
    </SessionProvider>
  );
}
