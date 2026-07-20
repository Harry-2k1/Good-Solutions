'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Tab,
  Tabs,
  Typography,
  Grid,
  Link as MuiLink,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { LoadingState, ErrorAlert } from '@/components/common/PageElements';
import { AccountantModule, CompanyType } from '@/types';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import TasksPanel from '@/components/companies/TasksPanel';
import CredentialsPanel from '@/components/companies/CredentialsPanel';
import BankOperationsPanel from '@/components/companies/BankOperationsPanel';
import CompanySectionsSummary from '@/components/companies/CompanySectionsSummary';
import CompanyLoginDetailsPanel from '@/components/companies/CompanyLoginDetailsPanel';
import EditCompanyPanel from '@/components/companies/EditCompanyPanel';

const companyTypeLabels: Record<CompanyType, string> = {
  [CompanyType.PROPRIETORSHIP]: 'Proprietorship',
  [CompanyType.PARTNERSHIP]: 'Partnership',
  [CompanyType.PRIVATE_LIMITED]: 'Private Limited',
  [CompanyType.PUBLIC_LIMITED]: 'Public Limited',
  [CompanyType.LLP]: 'LLP',
  [CompanyType.TRUST]: 'Trust',
  [CompanyType.OTHER]: 'Other',
};

const linkField = { name: 'link', label: 'Portal Link', type: 'link' as const };

const gstSections = [
  {
    key: 'loginDetails',
    title: 'GST Login',
    fields: [
      linkField,
      { name: 'username', label: 'Username' },
      { name: 'password', label: 'Password', sensitive: true },
      { name: 'updatedAt', label: 'Updated At', type: 'date' as const, copyable: false },
      { name: 'expiredAt', label: 'Expired At', type: 'date' as const, copyable: false },
    ],
  },
  {
    key: 'ewayBill',
    title: 'E-Way Bill',
    fields: [linkField, { name: 'username', label: 'Username' }, { name: 'password', label: 'Password', sensitive: true }],
  },
  {
    key: 'eInvoiceBill',
    title: 'E-Invoice Bill',
    fields: [linkField, { name: 'username', label: 'Username' }, { name: 'password', label: 'Password', sensitive: true }],
  },
  {
    key: 'tallyEInvoice',
    title: 'Tally / E-Invoice',
    fields: [linkField, { name: 'username', label: 'Username' }, { name: 'password', label: 'Password', sensitive: true }],
  },
];

const incomeTaxSections = [
  {
    key: 'itFiling',
    title: 'IT Filing',
    fields: [linkField, { name: 'panId', label: 'PAN ID', sensitive: true }, { name: 'password', label: 'Password', sensitive: true }],
  },
  {
    key: 'tdsPayment',
    title: 'TDS Payment (E-Pay Tax)',
    fields: [linkField, { name: 'tanId', label: 'TAN ID', sensitive: true }, { name: 'password', label: 'Password', sensitive: true }],
  },
  {
    key: 'tdsTracers',
    title: 'TDS Tracers',
    fields: [linkField, { name: 'userId', label: 'User ID', sensitive: true }, { name: 'password', label: 'Password', sensitive: true }],
  },
  {
    key: 'bulkDownload',
    title: '26 Bulk Download',
    fields: [linkField, { name: 'userId', label: 'User ID', sensitive: true }, { name: 'password', label: 'Password', sensitive: true }],
  },
];

type TabKey = 'overview' | 'tasks' | 'gst' | 'income-tax' | 'bank' | 'login-details';

const TAB_CONFIG: Array<{ key: TabKey; label: string; module?: AccountantModule }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'gst', label: 'GST', module: AccountantModule.GST },
  { key: 'income-tax', label: 'Income Tax & TDS', module: AccountantModule.INCOME_TAX },
  { key: 'bank', label: 'Bank Operations', module: AccountantModule.BANK_OPERATIONS },
  { key: 'login-details', label: 'Login Details', module: AccountantModule.LOGIN_DETAILS },
];

interface CompanyDetail {
  _id: string;
  name: string;
  description?: string;
  companyType: CompanyType;
  contacts: Array<{ name: string; phoneNumbers: string[]; emails: string[] }>;
  links: Array<{ name: string; url: string; notes?: string }>;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;
  const { hasAccess, accessibleModules } = useModuleAccess();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabKey>('overview');

  const visibleTabs = useMemo(
    () => TAB_CONFIG.filter((t) => !t.module || hasAccess(t.module)),
    [hasAccess]
  );

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error('Company not found');
      setCompany(await res.json());
    } catch {
      setError('Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  useEffect(() => {
    if (!visibleTabs.some((t) => t.key === tab)) {
      setTab(visibleTabs[0]?.key ?? 'overview');
    }
  }, [visibleTabs, tab]);

  if (loading) return <LoadingState />;
  if (error || !company) return <ErrorAlert message={error || 'Company not found'} onRetry={fetchCompany} />;

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Button component={Link} href="/" startIcon={<ArrowBackIcon />} size="small">
          Back to Companies
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{company.name}</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
          <Chip label={companyTypeLabels[company.companyType]} size="small" color="primary" variant="outlined" />
          {company.description && (
            <Typography variant="body2" color="text.secondary">{company.description}</Typography>
          )}
        </Box>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as TabKey)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {visibleTabs.map((t) => <Tab key={t.key} value={t.key} label={t.label} />)}
      </Tabs>

      {tab === 'overview' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <EditCompanyPanel
              company={company}
              onUpdated={(updated) => setCompany(updated as CompanyDetail)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CompanySectionsSummary
              companyId={companyId}
              accessibleModules={accessibleModules}
              onNavigateTab={(tabKey) => setTab(tabKey as TabKey)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Contacts</Typography>
                {company.contacts.length === 0 ? (
                  <Typography color="text.secondary">No contacts</Typography>
                ) : (
                  company.contacts.map((c, i) => (
                    <Box key={i} sx={{ mb: 2, pb: 2, borderBottom: i < company.contacts.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                      <Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>
                      {c.phoneNumbers?.length > 0 && (
                        <Typography variant="body2" color="text.secondary">Phone: {c.phoneNumbers.join(', ')}</Typography>
                      )}
                      {c.emails?.length > 0 && (
                        <Typography variant="body2" color="text.secondary">Email: {c.emails.join(', ')}</Typography>
                      )}
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Links</Typography>
                {company.links.length === 0 ? (
                  <Typography color="text.secondary">No links</Typography>
                ) : (
                  company.links.map((l, i) => (
                    <Box key={i} sx={{ mb: 2 }}>
                      <MuiLink href={l.url} target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
                        {l.name} <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
                      </MuiLink>
                      {l.notes && <Typography variant="body2" color="text.secondary">{l.notes}</Typography>}
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 'tasks' && <TasksPanel companyId={companyId} />}
      {tab === 'gst' && (
        <CredentialsPanel
          companyId={companyId}
          apiPath="gst"
          sections={gstSections}
          canEdit={hasAccess(AccountantModule.GST)}
        />
      )}
      {tab === 'income-tax' && (
        <CredentialsPanel
          companyId={companyId}
          apiPath="income-tax"
          sections={incomeTaxSections}
          canEdit={hasAccess(AccountantModule.INCOME_TAX)}
        />
      )}
      {tab === 'bank' && (
        <BankOperationsPanel companyId={companyId} canEdit={hasAccess(AccountantModule.BANK_OPERATIONS)} />
      )}
      {tab === 'login-details' && (
        <CompanyLoginDetailsPanel companyId={companyId} canEdit={hasAccess(AccountantModule.LOGIN_DETAILS)} />
      )}
    </>
  );
}
