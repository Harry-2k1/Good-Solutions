'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useState, useEffect, useCallback, useRef } from 'react';
import { PasswordField } from '@/components/common/PageElements';
import { FieldValueRow } from '@/components/common/FieldValueRow';
import { MASK_PLACEHOLDER } from '@/lib/credentials-display';
import {
  fetchRevealedBankEntries,
  pickBankField,
} from '@/lib/fetch-revealed-credentials';

interface BankEntry {
  _id: string;
  bankName: string;
  link?: string;
  userId?: string;
  loginPassword?: string;
  transactionPassword?: string;
  otpUsername?: string;
  otpPhoneNumber?: string;
}

const SENSITIVE_FIELDS = new Set(['loginPassword', 'transactionPassword']);

interface BankOperationsPanelProps {
  companyId: string;
  canEdit?: boolean;
}

export default function BankOperationsPanel({ companyId, canEdit = true }: BankOperationsPanelProps) {
  const [entries, setEntries] = useState<BankEntry[]>([]);
  const [revealedEntries, setRevealedEntries] = useState<BankEntry[]>([]);
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<BankEntry | null>(null);
  const [editing, setEditing] = useState<BankEntry | null>(null);
  const [form, setForm] = useState({
    bankName: '',
    link: '',
    userId: '',
    loginPassword: '',
    transactionPassword: '',
    otpUsername: '',
    otpPhoneNumber: '',
  });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const revealedCacheRef = useRef<BankEntry[]>([]);

  const fetchEntries = useCallback(async (reveal = false) => {
    const res = await fetch(`/api/companies/${companyId}/bank-operations?reveal=${reveal}`);
    if (res.ok) {
      const data = await res.json();
      if (reveal) {
        setRevealedEntries(data);
        revealedCacheRef.current = data;
      } else {
        setEntries(data);
      }
      return data as BankEntry[];
    }
    return undefined;
  }, [companyId]);

  useEffect(() => {
    fetchEntries(false);
  }, [fetchEntries]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      bankName: '',
      link: '',
      userId: '',
      loginPassword: '',
      transactionPassword: '',
      otpUsername: '',
      otpPhoneNumber: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (entry: BankEntry) => {
    setEditing(entry);
    setForm({
      bankName: entry.bankName,
      link: entry.link || '',
      userId: entry.userId || '',
      loginPassword: entry.loginPassword || '',
      transactionPassword: entry.transactionPassword || '',
      otpUsername: entry.otpUsername || '',
      otpPhoneNumber: entry.otpPhoneNumber || '',
    });
    setDialogOpen(true);
    setViewEntry(null);
  };

  const openView = (entry: BankEntry) => {
    setViewEntry(entry);
    setRevealedFields(new Set());
  };

  const handleSave = async () => {
    const url = `/api/companies/${companyId}/bank-operations`;
    const res = await fetch(url, {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { entryId: editing._id, ...form } : form),
    });

    if (res.ok) {
      setDialogOpen(false);
      fetchEntries(false);
      if (revealedEntries.length > 0) fetchEntries(true);
      setSnack({ open: true, message: 'Saved successfully', severity: 'success' });
    } else {
      const err = await res.json();
      setSnack({ open: true, message: err.error || 'Failed', severity: 'error' });
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Delete this bank entry?')) return;
    await fetch(`/api/companies/${companyId}/bank-operations?entryId=${entryId}`, { method: 'DELETE' });
    setViewEntry(null);
    fetchEntries(false);
    if (revealedEntries.length > 0) fetchEntries(true);
  };

  const getViewEntry = () => {
    if (!viewEntry) return null;
    const revealed = revealedEntries.find((e) => e._id === viewEntry._id);
    return revealed ?? viewEntry;
  };

  const toggleFieldReveal = async (fieldKey: string) => {
    if (revealedFields.has(fieldKey)) {
      setRevealedFields((prev) => {
        const next = new Set(prev);
        next.delete(fieldKey);
        return next;
      });
      return;
    }

    if (revealedEntries.length === 0) {
      await fetchEntries(true);
    }

    setRevealedFields((prev) => new Set(prev).add(fieldKey));
  };

  const getFieldValue = (entry: BankEntry, field: keyof BankEntry) => {
    const revealed = revealedEntries.find((e) => e._id === entry._id);
    const fieldKey = `${entry._id}:${field}`;
    if (SENSITIVE_FIELDS.has(field) && revealedFields.has(fieldKey) && revealed) {
      return revealed[field] as string | undefined;
    }
    return entry[field] as string | undefined;
  };

  const resolveCopyValue = useCallback(
    async (entryId: string, field: keyof BankEntry) => {
      if (!SENSITIVE_FIELDS.has(field)) {
        return entries.find((e) => e._id === entryId)?.[field] as string | undefined;
      }

      const masked = entries.find((e) => e._id === entryId)?.[field] as string | undefined;
      if (!masked) return undefined;

      let revealedList = revealedCacheRef.current;
      if (!pickBankField(revealedList, entryId, field)) {
        revealedList = (await fetchRevealedBankEntries<BankEntry>(companyId)) ?? [];
        if (revealedList.length > 0) {
          revealedCacheRef.current = revealedList;
          setRevealedEntries(revealedList);
        }
      }

      return pickBankField(revealedList, entryId, field);
    },
    [companyId, entries]
  );

  const viewFields: Array<{
    key: keyof BankEntry;
    label: string;
    sensitive?: boolean;
    isLink?: boolean;
  }> = [
    { key: 'bankName', label: 'Bank Name' },
    { key: 'link', label: 'Portal Link', isLink: true },
    { key: 'userId', label: 'User ID' },
    { key: 'loginPassword', label: 'Login Password', sensitive: true },
    { key: 'transactionPassword', label: 'Transaction Password', sensitive: true },
    { key: 'otpUsername', label: 'OTP Username' },
    { key: 'otpPhoneNumber', label: 'OTP Phone Number' },
  ];

  const activeView = getViewEntry();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6">Bank Operations</Typography>
            <Typography variant="body2" color="text.secondary">
              {entries.length} bank {entries.length === 1 ? 'entry' : 'entries'} saved
            </Typography>
          </Box>
          {canEdit && (
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openCreate}>
              Add Bank
            </Button>
          )}
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bank Name</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Login Password</TableCell>
                <TableCell>OTP Phone</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" sx={{ py: 2 }}>No bank entries yet</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e) => (
                  <TableRow key={e._id} hover sx={{ cursor: 'pointer' }} onClick={() => openView(e)}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>{e.bankName}</Typography>
                    </TableCell>
                    <TableCell>{e.userId || '—'}</TableCell>
                    <TableCell>{e.loginPassword || '—'}</TableCell>
                    <TableCell>{e.otpPhoneNumber || '—'}</TableCell>
                    <TableCell align="right" onClick={(ev) => ev.stopPropagation()}>
                      <IconButton size="small" onClick={() => openView(e)} title="View details">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {canEdit && (
                        <>
                          <IconButton size="small" onClick={() => openEdit(e)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(e._id)}><DeleteIcon fontSize="small" /></IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      <Dialog open={Boolean(activeView)} onClose={() => setViewEntry(null)} maxWidth="sm" fullWidth>
        {activeView && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {activeView.bankName}
              <Chip label="Saved" size="small" color="success" variant="outlined" />
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {viewFields.map((field) => {
                  const fieldKey = `${activeView._id}:${field.key}`;
                  const value = getFieldValue(activeView, field.key);
                  const isRevealed = revealedFields.has(fieldKey);
                  let displayValue = value || undefined;
                  if (field.sensitive && value && !isRevealed) {
                    displayValue = MASK_PLACEHOLDER;
                  }
                  return (
                    <Grid size={{ xs: 12, sm: 6 }} key={field.key}>
                      <FieldValueRow
                        label={field.label}
                        value={value}
                        displayValue={displayValue}
                        sensitive={field.sensitive}
                        isLink={field.isLink}
                        revealed={isRevealed}
                        onToggleReveal={
                          field.sensitive
                            ? () => toggleFieldReveal(fieldKey)
                            : undefined
                        }
                        copyable={!field.isLink}
                        onResolveCopy={() => resolveCopyValue(activeView._id, field.key)}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewEntry(null)}>Close</Button>
              {canEdit && (
                <Button variant="contained" onClick={() => openEdit(activeView)}>Edit</Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Bank Entry' : 'Add Bank Entry'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Bank Name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Portal Link" type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="User ID" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <PasswordField label="Login Password" value={form.loginPassword} onChange={(v) => setForm({ ...form, loginPassword: v })} showToggle />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <PasswordField label="Transaction Password" value={form.transactionPassword} onChange={(v) => setForm({ ...form, transactionPassword: v })} showToggle />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="OTP Username" value={form.otpUsername} onChange={(e) => setForm({ ...form, otpUsername: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="OTP Phone Number" value={form.otpPhoneNumber} onChange={(e) => setForm({ ...form, otpPhoneNumber: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.bankName}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Card>
  );
}
