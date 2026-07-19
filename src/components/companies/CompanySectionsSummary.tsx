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
import { hasConfiguredData } from '@/lib/credentials-display';

interface Props {
  companyId: string;
  onNavigateTab: (index: number) => void;
}

const sections = [
  { label: 'GST', tab: 2, api: 'gst' },
  { label: 'Income Tax & TDS', tab: 3, api: 'income-tax' },
  { label: 'Bank Operations', tab: 4, api: 'bank-operations' },
  { label: 'Login Details', tab: 5, api: 'login-details' },
];

export default function CompanySectionsSummary({ companyId, onNavigateTab }: Props) {
  const [status, setStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const results: Record<string, boolean> = {};
      await Promise.all(
        sections.map(async (s) => {
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
    load();
  }, [companyId]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Saved Details Summary</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Quick view of configured sections for this company
        </Typography>
        <Grid container spacing={1.5}>
          {sections.map((s) => {
            const configured = status[s.api];
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={s.api}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: configured ? 'success.50' : 'grey.50',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  <Button size="small" onClick={() => onNavigateTab(s.tab)}>
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
