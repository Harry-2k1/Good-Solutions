'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { CompanyType } from '@/types';

interface ContactForm {
  name: string;
  phoneNumbers: string;
  emails: string;
}

interface LinkForm {
  name: string;
  url: string;
  notes: string;
}

export interface CompanyFormData {
  _id: string;
  name: string;
  description?: string;
  companyType: CompanyType;
  contacts: Array<{ name: string; phoneNumbers: string[]; emails: string[] }>;
  links: Array<{ name: string; url: string; notes?: string }>;
}

const companyTypeLabels: Record<CompanyType, string> = {
  [CompanyType.PROPRIETORSHIP]: 'Proprietorship',
  [CompanyType.PARTNERSHIP]: 'Partnership',
  [CompanyType.PRIVATE_LIMITED]: 'Private Limited',
  [CompanyType.PUBLIC_LIMITED]: 'Public Limited',
  [CompanyType.LLP]: 'LLP',
  [CompanyType.TRUST]: 'Trust',
  [CompanyType.OTHER]: 'Other',
};

function toContactForms(contacts: CompanyFormData['contacts']): ContactForm[] {
  if (!contacts.length) return [{ name: '', phoneNumbers: '', emails: '' }];
  return contacts.map((c) => ({
    name: c.name,
    phoneNumbers: c.phoneNumbers?.join(', ') || '',
    emails: c.emails?.join(', ') || '',
  }));
}

function toLinkForms(links: CompanyFormData['links']): LinkForm[] {
  return links.map((l) => ({
    name: l.name,
    url: l.url,
    notes: l.notes || '',
  }));
}

interface EditCompanyPanelProps {
  company: CompanyFormData;
  onUpdated: (company: CompanyFormData) => void;
}

export default function EditCompanyPanel({ company, onUpdated }: EditCompanyPanelProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(company.name);
  const [description, setDescription] = useState(company.description || '');
  const [companyType, setCompanyType] = useState<CompanyType>(company.companyType);
  const [contacts, setContacts] = useState<ContactForm[]>(() => toContactForms(company.contacts));
  const [links, setLinks] = useState<LinkForm[]>(() => toLinkForms(company.links));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState(false);

  const resetForm = () => {
    setName(company.name);
    setDescription(company.description || '');
    setCompanyType(company.companyType);
    setContacts(toContactForms(company.contacts));
    setLinks(toLinkForms(company.links));
    setError('');
  };

  const handleCancel = () => {
    resetForm();
    setEditing(false);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);

    const payload = {
      name,
      description,
      companyType,
      contacts: contacts
        .filter((c) => c.name)
        .map((c) => ({
          name: c.name,
          phoneNumbers: c.phoneNumbers.split(',').map((p) => p.trim()).filter(Boolean),
          emails: c.emails.split(',').map((e) => e.trim()).filter(Boolean),
        })),
      links: links
        .filter((l) => l.name && l.url)
        .map((l) => ({ name: l.name, url: l.url, notes: l.notes || undefined })),
    };

    const res = await fetch(`/api/companies/${company._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || 'Failed to update company');
      return;
    }

    const updated = await res.json();
    onUpdated(updated);
    setEditing(false);
    setSnack(true);
  };

  if (!editing) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'flex-start' },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>Company Details</Typography>
              <Typography variant="body2" color="text.secondary">
                Name, type, description, contacts, and links
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditing(true)}
              sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}
            >
              Edit Details
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Edit Company Details</Typography>
          <Button size="small" startIcon={<CloseIcon />} onClick={handleCancel}>
            Cancel
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              label="Company Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>Company Type</InputLabel>
              <Select
                value={companyType}
                label="Company Type"
                onChange={(e) => setCompanyType(e.target.value as CompanyType)}
              >
                {Object.values(CompanyType).map((t) => (
                  <MenuItem key={t} value={t}>{companyTypeLabels[t]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
        </Grid>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Contacts</Typography>
        {contacts.map((contact, i) => (
          <Grid container spacing={2} key={i} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Contact Name"
                value={contact.name}
                onChange={(e) => {
                  const u = [...contacts];
                  u[i].name = e.target.value;
                  setContacts(u);
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Phone Numbers (comma-separated)"
                value={contact.phoneNumbers}
                onChange={(e) => {
                  const u = [...contacts];
                  u[i].phoneNumbers = e.target.value;
                  setContacts(u);
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Emails (comma-separated)"
                value={contact.emails}
                onChange={(e) => {
                  const u = [...contacts];
                  u[i].emails = e.target.value;
                  setContacts(u);
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
              {contacts.length > 1 && (
                <IconButton color="error" onClick={() => setContacts(contacts.filter((_, j) => j !== i))}>
                  <DeleteIcon />
                </IconButton>
              )}
            </Grid>
          </Grid>
        ))}
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setContacts([...contacts, { name: '', phoneNumbers: '', emails: '' }])}
          sx={{ mb: 3 }}
        >
          Add Contact
        </Button>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Links</Typography>
        {links.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No links added</Typography>
        ) : (
          links.map((link, i) => (
            <Grid container spacing={2} key={i} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Link Name"
                  value={link.name}
                  onChange={(e) => {
                    const u = [...links];
                    u[i].name = e.target.value;
                    setLinks(u);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="URL"
                  value={link.url}
                  onChange={(e) => {
                    const u = [...links];
                    u[i].url = e.target.value;
                    setLinks(u);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={link.notes}
                  onChange={(e) => {
                    const u = [...links];
                    u[i].notes = e.target.value;
                    setLinks(u);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton color="error" onClick={() => setLinks(links.filter((_, j) => j !== i))}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))
        )}
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setLinks([...links, { name: '', url: '', notes: '' }])}
          sx={{ mb: 2 }}
        >
          Add Link
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !name}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </CardContent>

      <Snackbar
        open={snack}
        autoHideDuration={3000}
        onClose={() => setSnack(false)}
        message="Company details updated"
      />
    </Card>
  );
}
