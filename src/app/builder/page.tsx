'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { FormBuilderView } from '@/components/MainTabs/FormBuilderView';
import { AppNavBar } from '@/components/Navigation/AppNavBar';

function BuilderContent() {
  const searchParams = useSearchParams();
  const formId = searchParams.get('formId');

  return (
    <Box sx={{ flex: 1, overflow: 'hidden' }}>
      <FormBuilderView initialFormId={formId || undefined} />
    </Box>
  );
}

export default function BuilderPage() {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <AppNavBar />
      <Suspense fallback={
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }>
        <BuilderContent />
      </Suspense>
    </Box>
  );
}
