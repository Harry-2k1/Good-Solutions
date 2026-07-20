'use client';

import { Box, IconButton, Typography, Button, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useState } from 'react';

interface FieldValueRowProps {
  label: string;
  value?: string;
  displayValue?: string;
  sensitive?: boolean;
  isLink?: boolean;
  revealed?: boolean;
  onToggleReveal?: () => void;
  copyable?: boolean;
}

export function FieldValueRow({
  label,
  value,
  displayValue,
  sensitive = false,
  isLink = false,
  revealed = false,
  onToggleReveal,
  copyable = false,
}: FieldValueRowProps) {
  const [copied, setCopied] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';
  const shown = displayValue ?? (hasValue ? value : '—');
  const canCopy = copyable && hasValue && (!sensitive || revealed);

  const handleCopy = async () => {
    if (!canCopy || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (isLink && hasValue) {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {label}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
          sx={{ mt: 0.5, textTransform: 'none' }}
        >
          Open Link
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
        <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
          {shown}
        </Typography>
        {sensitive && hasValue && onToggleReveal && (
          <Tooltip title={revealed ? 'Hide' : 'Reveal'}>
            <IconButton size="small" onClick={onToggleReveal} aria-label={revealed ? 'Hide value' : 'Reveal value'}>
              {revealed ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
        {canCopy && (
          <Tooltip title={copied ? 'Copied!' : 'Copy'}>
            <IconButton size="small" onClick={handleCopy} aria-label="Copy value">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
