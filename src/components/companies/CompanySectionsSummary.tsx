'use client';

import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
  Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useEffect, useState } from 'react';
import { alpha } from '@mui/material/styles';
import { hasConfiguredData } from '@/lib/credentials-display';
import { AccountantModule } from '@/types';

interface Props {
  companyId: string;
  accessibleModules: AccountantModule[];
  onNavigateTab: (tabKey: string) => void;
}

const sections = [
  { label: 'GST', tabKey: 'gst', api: 'gst', module: AccountantModule.GST },
  { label: 'Income Tax & TDS', tabKey: 'income-tax', api: 'income-tax', module: AccountantModule.INCOME_TAX },
  { label: 'Bank Operations', tabKey: 'bank', api: 'bank-operations', module: AccountantModule.BANK_OPERATIONS },
  { label: 'Login Details', tabKey: 'login-details', api: 'login-details', module: AccountantModule.LOGIN_DETAILS },
];

export default function CompanySectionsSummary({ companyId, accessibleModules, onNavigateTab }: Props) {
  const [status, setStatus] = useState<Record<string, boolean>>({});

  const visibleSections = sections.filter((s) => accessibleModules.includes(s.module));

  useEffect(() => {
    async function load() {
      const results: Record<string, boolean> = {};
      await Promise.all(
        visibleSections.map(async (s) => {
          try {
            const res = await fetch(`/api/companies/${companyId}/${s.api}`);
            if (!res.ok) return;
            const data = await res.json();
            if (Array.isArray(data)) {
              results[s.api] = data.length > 0;
            } else {
              results[s.api] = Object.values(data as Record<string, Record<string, unknown>>).some(
                (section) => hasConfiguredData(section)
              );
            }
          } catch {
            results[s.api] = false;
          }
        })
      );
      setStatus(results);
    }
    if (visibleSections.length > 0) load();
  }, [companyId, accessibleModules.join(',')]);

  if (visibleSections.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Saved Details Summary</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Quick view of configured sections for this company
        </Typography>
        <Grid container spacing={1.5}>
          {visibleSections.map((s) => {
            const configured = status[s.api];
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={s.api}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: { xs: 1, sm: 0 },
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: (theme) =>
                      configured
                        ? alpha(
                            theme.palette.success.main,
                            theme.palette.mode === 'dark' ? 0.14 : 0.08
                          )
                        : alpha(
                            theme.palette.action.disabled,
                            theme.palette.mode === 'dark' ? 0.12 : 0.06
                          ),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
                    {configured ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{s.label}</Typography>
                    <Chip
                      label={configured ? 'Added' : 'Empty'}
                      size="small"
                      color={configured ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                  <Button
                    size="small"
                    onClick={() => onNavigateTab(s.tabKey)}
                    sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
                  >
                    View
                  </Button>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
