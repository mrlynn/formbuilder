'use client';

import { ResponseList } from '@/components/FormResponses/ResponseList';
import { usePipeline } from '@/contexts/PipelineContext';
import { Box } from '@mui/material';
import { useParams } from 'next/navigation';

export default function FormResponsesPage() {
  const params = useParams();
  const formId = params.formId as string;
  const { connectionString } = usePipeline();

  return (
    <Box sx={{ height: '100vh', overflow: 'auto', p: 3 }}>
      <ResponseList formId={formId} connectionString={connectionString || undefined} />
    </Box>
  );
}

