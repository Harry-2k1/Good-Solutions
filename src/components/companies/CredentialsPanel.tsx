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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState, useEffect, useCallback, useRef } from 'react';
import { PasswordField } from '@/components/common/PageElements';
import { FieldValueRow } from '@/components/common/FieldValueRow';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { hasConfiguredData, formatDisplayDate, MASK_PLACEHOLDER, normalizeSectionData } from '@/lib/credentials-display';
import {
  fetchRevealedCredentialSections,
  pickCredentialField,
} from '@/lib/fetch-revealed-credentials';
import { alpha } from '@mui/material/styles';

interface CredentialSection {
  key: string;
  title: string;
  fields: Array<{
    name: string;
    label: string;
    type?: 'text' | 'password' | 'date' | 'link';
    sensitive?: boolean;
    copyable?: boolean;
  }>;
}

interface CredentialsPanelProps {
  companyId: string;
  apiPath: string;
  sections: CredentialSection[];
  canEdit?: boolean;
}

export default function CredentialsPanel({
  companyId,
  apiPath,
  sections,
  canEdit = true,
}: CredentialsPanelProps) {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<Record<string, Record<string, string>>>({});
  const [revealedData, setRevealedData] = useState<Record<string, Record<string, string>>>({});
  const [revealedFields, setRevealedFields] = useState<Record<string, Set<string>>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const revealedCacheRef = useRef<Record<string, Record<string, string>>>({});

  const fetchData = useCallback(async (reveal = false, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/${apiPath}?reveal=${reveal}`);
      if (!res.ok) throw new Error('Failed to load data');
      const json = await res.json();
      const normalized = normalizeSectionData(json as Record<string, unknown>);
      if (reveal) {
        setRevealedData(normalized);
        revealedCacheRef.current = normalized;
        return normalized;
      }
      setData(normalized);
      return normalized;
    } catch {
      if (!silent) {
        setSnack({ open: true, message: 'Failed to load credentials', severity: 'error' });
      }
      return undefined;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [companyId, apiPath]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  const currentSection = sections[tab];
  const sectionKey = currentSection.key;
  const sectionData = data[sectionKey] || {};
  const revealedSectionData = revealedData[sectionKey] || {};
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
      await fetchData(false);
      if (Object.keys(revealedData).length > 0) {
        await fetchData(true);
      }
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

  const toggleFieldReveal = async (fieldName: string) => {
    const sectionRevealed = revealedFields[sectionKey] ?? new Set<string>();
    const isRevealed = sectionRevealed.has(fieldName);

    if (isRevealed) {
      const next = new Set(sectionRevealed);
      next.delete(fieldName);
      setRevealedFields((prev) => ({ ...prev, [sectionKey]: next }));
      return;
    }

    if (Object.keys(revealedData).length === 0) {
      await fetchData(true);
    }

    const next = new Set(sectionRevealed);
    next.add(fieldName);
    setRevealedFields((prev) => ({ ...prev, [sectionKey]: next }));
  };

  const updateField = (field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [field]: value },
    }));
  };

  const isFieldRevealed = (fieldName: string) =>
    (revealedFields[sectionKey] ?? new Set<string>()).has(fieldName);

  const getFieldValue = (field: CredentialSection['fields'][number]) => {
    const masked = sectionData[field.name];
    const revealed = revealedSectionData[field.name];
    const raw = isFieldRevealed(field.name) && revealed !== undefined ? revealed : masked;
    return raw;
  };

  const renderViewValue = (field: CredentialSection['fields'][number]) => {
    const value = getFieldValue(field);
    if (value === undefined || value === null || value === '') return undefined;
    if (field.type === 'date') return formatDisplayDate(value);
    if ((field.sensitive || field.type === 'password') && !isFieldRevealed(field.name)) {
      return MASK_PLACEHOLDER;
    }
    return value;
  };

  const isCopyable = (field: CredentialSection['fields'][number]) => {
    if (field.type === 'date' || field.type === 'link') return false;
    return field.copyable !== false;
  };

  const resolveCopyValue = useCallback(
    async (section: string, fieldName: string, isSecret: boolean) => {
      if (!isSecret) {
        return data[section]?.[fieldName] || undefined;
      }

      if (!data[section]?.[fieldName]) return undefined;

      let revealedSections = revealedCacheRef.current;
      if (!pickCredentialField(revealedSections, section, fieldName)) {
        revealedSections = (await fetchRevealedCredentialSections(companyId, apiPath)) ?? {};
        if (Object.keys(revealedSections).length > 0) {
          revealedCacheRef.current = revealedSections;
          setRevealedData(revealedSections);
        }
      }

      return pickCredentialField(revealedSections, section, fieldName);
    },
    [companyId, apiPath, data]
  );

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
              {canEdit && (
                <Stack direction="row" spacing={1}>
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
              )}
            </Box>

            {!isEditing && isConfigured && (
              <Box
                sx={{
                  borderRadius: 2,
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: (t) => (t.palette.mode === 'light' ? 'grey.50' : alpha(t.palette.primary.main, 0.06)),
                }}
              >
                <Grid container spacing={2}>
                  {currentSection.fields.map((field) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={field.name}>
                      <FieldValueRow
                        label={field.label}
                        value={getFieldValue(field)}
                        displayValue={renderViewValue(field)}
                        sensitive={field.sensitive || field.type === 'password'}
                        isLink={field.type === 'link'}
                        revealed={isFieldRevealed(field.name)}
                        onToggleReveal={
                          field.sensitive || field.type === 'password'
                            ? () => toggleFieldReveal(field.name)
                            : undefined
                        }
                        copyable={isCopyable(field)}
                        onResolveCopy={
                          isCopyable(field)
                            ? () =>
                                resolveCopyValue(
                                  sectionKey,
                                  field.name,
                                  Boolean(field.sensitive || field.type === 'password')
                                )
                            : undefined
                        }
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {!isEditing && !isConfigured && (
              <Alert severity="info">
                No {currentSection.title.toLowerCase()} details added yet.
                {canEdit ? ' Click "Add Details" to enter credentials.' : ''}
              </Alert>
            )}

            {isEditing && canEdit && (
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
                          showToggle
                        />
                      ) : (
                        <TextField
                          fullWidth
                          label={field.label}
                          type={field.type === 'link' ? 'url' : 'text'}
                          value={sectionData[field.name] || ''}
                          onChange={(e) => updateField(field.name, e.target.value)}
                          placeholder={field.type === 'link' ? 'https://' : undefined}
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
