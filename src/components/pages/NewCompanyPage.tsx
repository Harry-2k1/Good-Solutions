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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/common/PageElements';
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

const companyTypeLabels: Record<CompanyType, string> = {
  [CompanyType.PROPRIETORSHIP]: 'Proprietorship',
  [CompanyType.PARTNERSHIP]: 'Partnership',
  [CompanyType.PRIVATE_LIMITED]: 'Private Limited',
  [CompanyType.PUBLIC_LIMITED]: 'Public Limited',
  [CompanyType.LLP]: 'LLP',
  [CompanyType.TRUST]: 'Trust',
  [CompanyType.OTHER]: 'Other',
};

export default function NewCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType>(CompanyType.PRIVATE_LIMITED);
  const [contacts, setContacts] = useState<ContactForm[]>([{ name: '', phoneNumbers: '', emails: '' }]);
  const [links, setLinks] = useState<LinkForm[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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

    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || 'Failed to create company');
      return;
    }

    const company = await res.json();
    router.push(`/companies/${company._id}`);
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Button component={Link} href="/" startIcon={<ArrowBackIcon />} size="small">
          Back to Companies
        </Button>
      </Box>
      <PageHeader title="Add Company / Client" subtitle="Enter client details and contact information" />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Basic Information</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField fullWidth label="Company Name" value={name} onChange={(e) => setName(e.target.value)} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required>
                  <InputLabel>Company Type</InputLabel>
                  <Select value={companyType} label="Company Type" onChange={(e) => setCompanyType(e.target.value as CompanyType)}>
                    {Object.values(CompanyType).map((t) => (
                      <MenuItem key={t} value={t}>{companyTypeLabels[t]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Description" multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Contacts</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setContacts([...contacts, { name: '', phoneNumbers: '', emails: '' }])}>
                Add Contact
              </Button>
            </Box>
            {contacts.map((contact, i) => (
              <Grid container spacing={2} key={i} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="Contact Name" value={contact.name} onChange={(e) => { const u = [...contacts]; u[i].name = e.target.value; setContacts(u); }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField fullWidth label="Phone Numbers (comma-separated)" value={contact.phoneNumbers} onChange={(e) => { const u = [...contacts]; u[i].phoneNumbers = e.target.value; setContacts(u); }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="Emails (comma-separated)" value={contact.emails} onChange={(e) => { const u = [...contacts]; u[i].emails = e.target.value; setContacts(u); }} />
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
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Links</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setLinks([...links, { name: '', url: '', notes: '' }])}>
                Add Link
              </Button>
            </Box>
            {links.length === 0 ? (
              <Typography color="text.secondary" variant="body2">No links added yet</Typography>
            ) : (
              links.map((link, i) => (
                <Grid container spacing={2} key={i} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField fullWidth label="Link Name" value={link.name} onChange={(e) => { const u = [...links]; u[i].name = e.target.value; setLinks(u); }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth label="URL" value={link.url} onChange={(e) => { const u = [...links]; u[i].url = e.target.value; setLinks(u); }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth label="Notes" value={link.notes} onChange={(e) => { const u = [...links]; u[i].notes = e.target.value; setLinks(u); }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton color="error" onClick={() => setLinks(links.filter((_, j) => j !== i))}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" size="large" startIcon={<SaveIcon />} disabled={loading || !name}>
            {loading ? 'Creating...' : 'Create Company'}
          </Button>
        </Box>
      </Box>
    </>
  );
}
