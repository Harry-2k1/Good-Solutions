'use client';

import { Box, IconButton, Typography, Button, Tooltip, CircularProgress, Snackbar, Alert } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useState } from 'react';
import { MASK_PLACEHOLDER } from '@/lib/credentials-display';
import { copyToClipboard } from '@/lib/copy-to-clipboard';

interface FieldValueRowProps {
  label: string;
  value?: string;
  displayValue?: string;
  sensitive?: boolean;
  isLink?: boolean;
  revealed?: boolean;
  onToggleReveal?: () => void;
  copyable?: boolean;
  /** Fetch the real value for copy when the field is masked. */
  onResolveCopy?: () => Promise<string | undefined>;
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
  onResolveCopy,
}: FieldValueRowProps) {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');
  const hasValue = value !== undefined && value !== null && value !== '';
  const shown = displayValue ?? (hasValue ? value : '—');
  const showCopy = copyable && hasValue;

  const handleCopy = async () => {
    if (!showCopy) return;

    setCopying(true);
    try {
      let text: string | undefined;

      if (sensitive) {
        if (value && value !== MASK_PLACEHOLDER) {
          text = value;
        } else if (onResolveCopy) {
          text = await onResolveCopy();
        }
      } else {
        text = value;
      }

      if (!text || text === MASK_PLACEHOLDER) {
        setSnackMessage(`Could not copy ${label.toLowerCase()}`);
        setSnackSeverity('error');
        setSnackOpen(true);
        return;
      }

      const copiedOk = await copyToClipboard(text);
      if (!copiedOk) {
        setSnackMessage('Copy blocked by browser — use HTTPS or localhost');
        setSnackSeverity('error');
        setSnackOpen(true);
        return;
      }

      setCopied(true);
      setSnackMessage(`${label} copied successfully`);
      setSnackSeverity('success');
      setSnackOpen(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setSnackMessage(`Could not copy ${label.toLowerCase()}`);
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setCopying(false);
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
        {showCopy && (
          <Tooltip title={copied ? 'Copied!' : 'Copy'}>
            <IconButton
              size="small"
              onClick={handleCopy}
              disabled={copying}
              aria-label="Copy value"
            >
              {copying ? (
                <CircularProgress size={14} />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackSeverity} variant="filled" onClose={() => setSnackOpen(false)} sx={{ width: '100%' }}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
