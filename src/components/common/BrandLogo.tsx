'use client';

import { Box, Typography } from '@mui/material';
import Image from 'next/image';

interface BrandLogoProps {
  variant?: 'full' | 'icon' | 'compact';
  size?: number;
}

export default function BrandLogo({ variant = 'full', size = 40 }: BrandLogoProps) {
  if (variant === 'icon') {
    return (
      <Image
        src="/icon.svg"
        alt="Good Solutions"
        width={size}
        height={size}
        priority
        style={{ borderRadius: 10 }}
      />
    );
  }

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Image src="/icon.svg" alt="Good Solutions" width={36} height={36} priority style={{ borderRadius: 8 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'primary.main' }}>
            GOOD SOLUTIONS
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            Admin Portal
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
      <Image src="/logo.svg" alt="Good Solutions" width={240} height={60} priority />
      <Typography variant="caption" color="text.secondary">
        Accountant Admin Portal
      </Typography>
    </Box>
  );
}
