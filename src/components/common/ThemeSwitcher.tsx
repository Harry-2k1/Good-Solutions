'use client';

import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from 'react';
import { useThemeMode } from '@/context/ThemeModeContext';
import { ThemeMode, themeLabels, themeDescriptions } from '@/theme/theme-config';

const themeIcons: Record<ThemeMode, React.ReactNode> = {
  'light-blue': <LightModeIcon fontSize="small" />,
  'dark-blue': <NightsStayIcon fontSize="small" />,
  dark: <DarkModeIcon fontSize="small" />,
};

const themeOptions: ThemeMode[] = ['light-blue', 'dark-blue', 'dark'];

export default function ThemeSwitcher() {
  const { themeMode, setThemeMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Tooltip title="Change theme">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
          <PaletteIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 220, mt: 1 } } }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
          Appearance
        </Typography>
        {themeOptions.map((mode) => (
          <MenuItem
            key={mode}
            selected={themeMode === mode}
            onClick={() => {
              setThemeMode(mode);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>{themeIcons[mode]}</ListItemIcon>
            <ListItemText
              primary={themeLabels[mode]}
              secondary={themeDescriptions[mode]}
              slotProps={{ secondary: { variant: 'caption' } }}
            />
            {themeMode === mode && (
              <CheckIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
