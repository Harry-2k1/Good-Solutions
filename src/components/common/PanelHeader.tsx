'use client';

import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PanelHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

/** Title row that stacks on narrow screens so actions remain tappable. */
export function PanelHeader({ title, subtitle, action }: PanelHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        justifyContent: 'space-between',
        gap: { xs: 1.5, sm: 2 },
        mb: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {typeof title === 'string' ? (
          <Typography variant="h6">{title}</Typography>
        ) : (
          title
        )}
        {subtitle &&
          (typeof subtitle === 'string' ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : (
            subtitle
          ))}
      </Box>
      {action && (
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: { xs: 'stretch', sm: 'flex-end' },
            '& > .MuiButton-root': { width: { xs: '100%', sm: 'auto' } },
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
}
