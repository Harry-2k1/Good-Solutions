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
  Link as MuiLink,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useState, useEffect, useCallback } from 'react';

interface LoginDetail {
  _id: string;
  portalName: string;
  links?: string;
  description?: string;
}

export default function CompanyLoginDetailsPanel({ companyId }: { companyId: string }) {
  const [entries, setEntries] = useState<LoginDetail[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LoginDetail | null>(null);
  const [form, setForm] = useState({ portalName: '', links: '', description: '' });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchEntries = useCallback(async () => {
    const res = await fetch(`/api/companies/${companyId}/login-details`);
    if (res.ok) setEntries(await res.json());
  }, [companyId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const openCreate = () => {
    setEditing(null);
    setForm({ portalName: '', links: '', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (entry: LoginDetail) => {
    setEditing(entry);
    setForm({ portalName: entry.portalName, links: entry.links || '', description: entry.description || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const url = `/api/companies/${companyId}/login-details`;
    const res = await fetch(url, {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { entryId: editing._id, ...form } : form),
    });

    if (res.ok) {
      setDialogOpen(false);
      fetchEntries();
      setSnack({ open: true, message: 'Saved successfully', severity: 'success' });
    } else {
      const err = await res.json();
      setSnack({ open: true, message: err.error || 'Failed', severity: 'error' });
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/companies/${companyId}/login-details?entryId=${entryId}`, { method: 'DELETE' });
    fetchEntries();
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Company Login Details</Typography>
          <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openCreate}>
            Add Portal
          </Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Portal Name</TableCell>
                <TableCell>Links</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary" sx={{ py: 2 }}>No login details yet</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e) => (
                  <TableRow key={e._id} hover>
                    <TableCell>{e.portalName}</TableCell>
                    <TableCell>
                      {e.links ? (
                        <MuiLink href={e.links} target="_blank" rel="noopener">
                          {e.links} <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
                        </MuiLink>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{e.description || '—'}</TableCell>
                    <TableCell align="right">
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Portal' : 'Add Portal'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Portal Name" value={form.portalName} onChange={(e) => setForm({ ...form, portalName: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Links (URL)" value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Description / Notes" multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.portalName}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Card>
  );
}
