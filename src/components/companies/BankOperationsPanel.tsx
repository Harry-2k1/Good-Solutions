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
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useState, useEffect, useCallback } from 'react';
import { PasswordField } from '@/components/common/PageElements';
import { MASK_PLACEHOLDER } from '@/lib/credentials-display';

interface BankEntry {
  _id: string;
  bankName: string;
  userId?: string;
  loginPassword?: string;
  transactionPassword?: string;
  otpUsername?: string;
  otpPhoneNumber?: string;
}

export default function BankOperationsPanel({ companyId }: { companyId: string }) {
  const [entries, setEntries] = useState<BankEntry[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<BankEntry | null>(null);
  const [editing, setEditing] = useState<BankEntry | null>(null);
  const [form, setForm] = useState({
    bankName: '',
    userId: '',
    loginPassword: '',
    transactionPassword: '',
    otpUsername: '',
    otpPhoneNumber: '',
  });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchEntries = useCallback(async (reveal = false) => {
    const res = await fetch(`/api/companies/${companyId}/bank-operations?reveal=${reveal}`);
    if (res.ok) setEntries(await res.json());
  }, [companyId]);

  useEffect(() => {
    fetchEntries(false);
  }, [fetchEntries]);

  const toggleReveal = async () => {
    const next = !revealed;
    setRevealed(next);
    await fetchEntries(next);
    if (viewEntry) {
      const res = await fetch(`/api/companies/${companyId}/bank-operations?reveal=${next}`);
      if (res.ok) {
        const list = await res.json();
        const updated = list.find((e: BankEntry) => e._id === viewEntry._id);
        if (updated) setViewEntry(updated);
      }
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ bankName: '', userId: '', loginPassword: '', transactionPassword: '', otpUsername: '', otpPhoneNumber: '' });
    setDialogOpen(true);
  };

  const openEdit = (entry: BankEntry) => {
    setEditing(entry);
    setForm({
      bankName: entry.bankName,
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
      fetchEntries(revealed);
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
    fetchEntries(revealed);
  };

  const displaySecret = (value?: string) => {
    if (!value) return '—';
    return revealed ? value : MASK_PLACEHOLDER;
  };

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
          <Box>
            {entries.length > 0 && (
              <Button
                size="small"
                startIcon={revealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
                onClick={toggleReveal}
                sx={{ mr: 1 }}
              >
                {revealed ? 'Hide Secrets' : 'View Secrets'}
              </Button>
            )}
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openCreate}>
              Add Bank
            </Button>
          </Box>
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
                    <TableCell>{displaySecret(e.loginPassword)}</TableCell>
                    <TableCell>{e.otpPhoneNumber || '—'}</TableCell>
                    <TableCell align="right" onClick={(ev) => ev.stopPropagation()}>
                      <IconButton size="small" onClick={() => openView(e)} title="View details">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => openEdit(e)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(e._id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      <Dialog open={Boolean(viewEntry)} onClose={() => setViewEntry(null)} maxWidth="sm" fullWidth>
        {viewEntry && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {viewEntry.bankName}
              <Chip label="Saved" size="small" color="success" variant="outlined" />
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {[
                  { label: 'Bank Name', value: viewEntry.bankName },
                  { label: 'User ID', value: viewEntry.userId },
                  { label: 'Login Password', value: displaySecret(viewEntry.loginPassword) },
                  { label: 'Transaction Password', value: displaySecret(viewEntry.transactionPassword) },
                  { label: 'OTP Username', value: viewEntry.otpUsername },
                  { label: 'OTP Phone Number', value: viewEntry.otpPhoneNumber },
                ].map((row) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={row.label}>
                    <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
                      {row.value || '—'}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewEntry(null)}>Close</Button>
              <Button onClick={toggleReveal}>{revealed ? 'Hide Secrets' : 'View Secrets'}</Button>
              <Button variant="contained" onClick={() => openEdit(viewEntry)}>Edit</Button>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="User ID" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <PasswordField label="Login Password" value={form.loginPassword} onChange={(v) => setForm({ ...form, loginPassword: v })} revealed={revealed} showToggle={revealed} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <PasswordField label="Transaction Password" value={form.transactionPassword} onChange={(v) => setForm({ ...form, transactionPassword: v })} revealed={revealed} showToggle={revealed} />
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
