'use client';

import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

/** Viewport below the `sm` breakpoint (600px). */
export function useIsMobile() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
}

/** Viewport below the `md` breakpoint (900px) — e.g. hide wide tables. */
export function useIsTabletDown() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
}
