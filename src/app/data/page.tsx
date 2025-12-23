'use client';

import { Box } from '@mui/material';
import { AppNavBar } from '@/components/Navigation/AppNavBar';
import { DataBrowser } from '@/components/DataBrowser/DataBrowser';

export default function DataPage() {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppNavBar />
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <DataBrowser />
      </Box>
    </Box>
  );
}
