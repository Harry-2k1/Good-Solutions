'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
import StorageIcon from '@mui/icons-material/Storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorAlert, LoadingState, PageHeader } from '@/components/common/PageElements';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import type { EnvVarValue } from '@/lib/app-env';

interface SuperAdminInfo {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface MongoStatus {
  connected: boolean;
  readyState: string;
  pingMs: number | null;
  host: string | null;
  port: number | null;
  database: string | null;
  error: string | null;
}

interface EnvResponse {
  variables: EnvVarValue[];
  mongodb: MongoStatus;
  superAdmin: SuperAdminInfo | null;
}

const MASK = '••••••••';

export default function EnvPage() {
  const [data, setData] = useState<EnvResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchEnv = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/system/env');
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to load environment values');
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load environment values');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnv();
  }, [fetchEnv]);

  const grouped = useMemo(() => {
    const groups = new Map<string, EnvVarValue[]>();
    for (const variable of data?.variables ?? []) {
      const list = groups.get(variable.group) ?? [];
      list.push(variable);
      groups.set(variable.group, list);
    }
    return groups;
  }, [data]);

  const envPasswordSet = Boolean(
    data?.variables.find((item) => item.key === 'SUPER_ADMIN_PASSWORD')?.isSet
  );

  const copyValue = async (label: string, value: string) => {
    const copiedOk = await copyToClipboard(value);
    setSnack({
      open: true,
      message: copiedOk ? `${label} copied` : 'Copy blocked by browser — use HTTPS or localhost',
      severity: copiedOk ? 'success' : 'error',
    });
  };

  const overridePassword = async (useEnvPassword: boolean) => {
    setFormError('');

    if (!useEnvPassword) {
      if (newPassword !== confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
      if (newPassword.length < 8) {
        setFormError('Password must be at least 8 characters');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/system/super-admin-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          useEnvPassword ? { useEnvPassword: true } : { newPassword }
        ),
      });
      const payload = await res.json();
      if (!res.ok) {
        setFormError(payload.error || 'Failed to override password');
        return;
      }

      setNewPassword('');
      setConfirmPassword('');
      setSnack({
        open: true,
        message: payload.message || 'Super admin password updated',
        severity: 'success',
      });
    } catch {
      setFormError('Failed to override password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading environment..." />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={fetchEnv} />;
  }

  return (
    <>
      <PageHeader
        title="Environment"
        subtitle="Runtime environment values, MongoDB status, and super admin password override"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon color={data?.mongodb.connected ? 'success' : 'error'} />
              <Typography variant="h6">MongoDB</Typography>
            </Box>
            <Chip
              label={data?.mongodb.connected ? 'Connected' : 'Disconnected'}
              color={data?.mongodb.connected ? 'success' : 'error'}
            />
          </Box>
          {data?.mongodb.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {data.mongodb.error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Ready state
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {data?.mongodb.readyState ?? '—'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Host
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {data?.mongodb.host ?? '—'}
                {data?.mongodb.port ? `:${data.mongodb.port}` : ''}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Database
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {data?.mongodb.database ?? '—'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Ping
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {data?.mongodb.pingMs != null ? `${data.mongodb.pingMs} ms` : '—'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Override super admin password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {data?.superAdmin
              ? `This updates the password for ${data.superAdmin.name} (${data.superAdmin.email}).`
              : 'No super admin user was found in this organization.'}
          </Typography>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="New Password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                helperText="Minimum 8 characters"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNew(!showNew)} edge="end">
                          {showNew ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<LockResetIcon />}
              disabled={saving || !data?.superAdmin}
              onClick={() => overridePassword(false)}
            >
              {saving ? 'Updating...' : 'Override Password'}
            </Button>
            <Button
              variant="outlined"
              disabled={saving || !data?.superAdmin || !envPasswordSet}
              onClick={() => overridePassword(true)}
            >
              Apply SUPER_ADMIN_PASSWORD from env
            </Button>
          </Box>
        </CardContent>
      </Card>

      {Array.from(grouped.entries()).map(([group, variables]) => (
        <Card key={group} sx={{ mb: 3 }}>
          <CardContent sx={{ pb: 1 }}>
            <Typography variant="h6">{group}</Typography>
          </CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Variable</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {variables.map((variable) => {
                  const isRevealed = revealed[variable.key] ?? false;
                  const displayValue = !variable.isSet
                    ? '—'
                    : variable.sensitive && !isRevealed
                      ? MASK
                      : variable.value;
                  return (
                    <TableRow key={variable.key} hover>
                      <TableCell sx={{ verticalAlign: 'top', minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {variable.key}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {variable.description}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {displayValue}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={variable.isSet ? 'Set' : 'Not set'}
                          color={variable.isSet ? 'success' : 'default'}
                          variant={variable.isSet ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {variable.sensitive && variable.isSet && (
                          <Tooltip title={isRevealed ? 'Hide' : 'Reveal'}>
                            <IconButton
                              size="small"
                              onClick={() =>
                                setRevealed((current) => ({
                                  ...current,
                                  [variable.key]: !isRevealed,
                                }))
                              }
                              aria-label={isRevealed ? `Hide ${variable.key}` : `Reveal ${variable.key}`}
                            >
                              {isRevealed ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        )}
                        {variable.isSet && variable.value && (
                          <Tooltip title="Copy">
                            <IconButton
                              size="small"
                              onClick={() => copyValue(variable.key, variable.value!)}
                              aria-label={`Copy ${variable.key}`}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ))}

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((current) => ({ ...current, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
