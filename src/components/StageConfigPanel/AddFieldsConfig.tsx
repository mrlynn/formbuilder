'use client';

import { Box, Typography } from '@mui/material';
import { usePipeline } from '@/contexts/PipelineContext';

interface AddFieldsConfigProps {
  nodeId: string;
}

export function AddFieldsConfig({ nodeId }: AddFieldsConfigProps) {
  const { nodes } = usePipeline();
  const node = nodes.find((n) => n.id === nodeId);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Add Fields Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Add Fields configuration form coming soon. For now, edit the JSON directly in the node.
      </Typography>
    </Box>
  );
}

