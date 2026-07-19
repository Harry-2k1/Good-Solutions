'use client';

import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader, LoadingState, EmptyState, ErrorAlert } from '@/components/common/PageElements';
import { CompanyType } from '@/types';

interface Company {
  _id: string;
  name: string;
  description?: string;
  companyType: CompanyType;
  contacts: Array<{ name: string }>;
  tasks: Array<{ status: string }>;
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

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/companies');
      if (!res.ok) throw new Error('Failed to load companies');
      setCompanies(await res.json());
    } catch {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingState message="Loading companies..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchCompanies} />;

  return (
    <>
      <PageHeader
        title="Companies & Clients"
        subtitle="Manage your client portfolio, tax filings, and credentials"
        action={
          <Button
            component={Link}
            href="/companies/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Company
          </Button>
        }
      />

      <TextField
        fullWidth
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, maxWidth: 400 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No companies found"
          description={search ? 'Try a different search term' : 'Get started by adding your first client'}
          action={
            !search ? (
              <Button component={Link} href="/companies/new" variant="contained" startIcon={<AddIcon />}>
                Add Company
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Grid container spacing={2}>
          {filtered.map((company) => {
            const openTasks = company.tasks?.filter((t) => t.status !== 'completed').length || 0;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={company._id}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardActionArea component={Link} href={`/companies/${company._id}`} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                          }}
                        >
                          <BusinessIcon />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                            {company.name}
                          </Typography>
                          <Chip
                            label={companyTypeLabels[company.companyType]}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Box>
                      {company.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 1.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {company.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {company.contacts?.length || 0} contacts
                        </Typography>
                        {openTasks > 0 && (
                          <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                            {openTasks} open tasks
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
}
