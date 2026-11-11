'use client';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function ResponsiveDialog(props: DialogProps) {
  const isMobile = useIsMobile();
  return <Dialog fullScreen={isMobile} {...props} />;
}
