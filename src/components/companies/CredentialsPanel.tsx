'use client';

import {
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Snackbar,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState, useEffect, useCallback } from 'react';
import { PasswordField } from '@/components/common/PageElements';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { hasConfiguredData, formatDisplayDate, MASK_PLACEHOLDER, normalizeSectionData } from '@/lib/credentials-display';

interface CredentialSection {
  key: string;
  title: string;
  fields: Array<{
    name: string;
    label: string;
    type?: 'text' | 'password' | 'date';
    sensitive?: boolean;
  }>;
}

interface CredentialsPanelProps {
  companyId: string;
  apiPath: string;
  sections: CredentialSection[];
}

export default function CredentialsPanel({ companyId, apiPath, sections }: CredentialsPanelProps) {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<Record<string, Record<string, string>>>({});
  const [revealed, setRevealed] = useState(false);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(async (reveal = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/${apiPath}?reveal=${reveal}`);
      if (!res.ok) throw new Error('Failed to load data');
      const json = await res.json();
      setData(normalizeSectionData(json as Record<string, unknown>));
    } catch {
      setSnack({ open: true, message: 'Failed to load credentials', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [companyId, apiPath]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  const currentSection = sections[tab];
  const sectionKey = currentSection.key;
  const sectionData = data[sectionKey] || {};
  const isEditing = editMode[sectionKey] ?? false;
  const isConfigured = hasConfiguredData(sectionData);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/${apiPath}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: sectionKey, data: sectionData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      await fetchData(revealed);
      setEditMode((prev) => ({ ...prev, [sectionKey]: false }));
      setSnack({ open: true, message: 'Saved successfully', severity: 'success' });
    } catch (e) {
      setSnack({
        open: true,
        message: e instanceof Error ? e.message : 'Save failed',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleReveal = async () => {
    const next = !revealed;
    setRevealed(next);
    await fetchData(next);
  };

  const updateField = (field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [field]: value },
    }));
  };

  const renderViewValue = (field: CredentialSection['fields'][number]) => {
    const value = sectionData[field.name];
    if (value === undefined || value === null || value === '') return '—';
    if (field.type === 'date') return formatDisplayDate(value);
    if (field.sensitive || field.type === 'password') {
      return revealed ? value : MASK_PLACEHOLDER;
    }
    return value;
  };

  return (
    <Card>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
      >
        {sections.map((s) => {
          const configured = hasConfiguredData(data[s.key]);
          return (
            <Tab
              key={s.key}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {s.title}
                  {configured && (
                    <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                  )}
                </Box>
              }
            />
          );
        })}
      </Tabs>
      <CardContent>
        {loading ? (
          <Typography color="text.secondary">Loading saved details...</Typography>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">{currentSection.title}</Typography>
                {isConfigured ? (
                  <Chip label="Configured" size="small" color="success" variant="outlined" />
                ) : (
                  <Chip label="Not configured" size="small" variant="outlined" />
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                {isConfigured && (
                  <Button
                    size="small"
                    startIcon={revealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    onClick={toggleReveal}
                  >
                    {revealed ? 'Hide Secrets' : 'View Secrets'}
                  </Button>
                )}
                {!isEditing ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode((prev) => ({ ...prev, [sectionKey]: true }))}
                  >
                    {isConfigured ? 'Edit' : 'Add Details'}
                  </Button>
                ) : (
                  <Button size="small" onClick={() => setEditMode((prev) => ({ ...prev, [sectionKey]: false }))}>
                    Cancel
                  </Button>
                )}
              </Stack>
            </Box>

            {!isEditing && isConfigured && (
              <Box
                sx={{
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Grid container spacing={2}>
                  {currentSection.fields.map((field) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={field.name}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {field.label}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
                        {renderViewValue(field)}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {!isEditing && !isConfigured && (
              <Alert severity="info">
                No {currentSection.title.toLowerCase()} details added yet. Click &quot;Add Details&quot; to enter credentials.
              </Alert>
            )}

            {isEditing && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {currentSection.fields.map((field) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={field.name}>
                      {field.type === 'date' ? (
                        <DatePicker
                          label={field.label}
                          value={sectionData[field.name] ? dayjs(sectionData[field.name]) : null}
                          onChange={(val: Dayjs | null) =>
                            updateField(field.name, val ? val.toISOString() : '')
                          }
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      ) : field.sensitive || field.type === 'password' ? (
                        <PasswordField
                          label={field.label}
                          value={sectionData[field.name] || ''}
                          onChange={(v) => updateField(field.name, v)}
                          revealed={revealed}
                          showToggle={revealed}
                        />
                      ) : (
                        <TextField
                          fullWidth
                          label={field.label}
                          value={sectionData[field.name] || ''}
                          onChange={(e) => updateField(field.name, e.target.value)}
                        />
                      )}
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              </>
            )}
          </>
        )}
      </CardContent>
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
