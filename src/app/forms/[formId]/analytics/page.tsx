'use client';

import { AnalyticsTabs } from '@/components/FormAnalytics/AnalyticsTabs';
import { usePipeline } from '@/contexts/PipelineContext';
import { Box } from '@mui/material';
import { useParams } from 'next/navigation';

export default function FormAnalyticsPage() {
  const params = useParams();
  const formId = params.formId as string;
  const { connectionString } = usePipeline();

  return (
    <Box sx={{ height: '100vh', overflow: 'auto' }}>
      <AnalyticsTabs formId={formId} connectionString={connectionString || undefined} />
    </Box>
  );
}

