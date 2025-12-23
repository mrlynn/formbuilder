'use client';

import { useState, useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { usePipeline } from '@/contexts/PipelineContext';

interface CountConfigProps {
  nodeId: string;
}

export function CountConfig({ nodeId }: CountConfigProps) {
  const { nodes, dispatch } = usePipeline();
  const node = nodes.find((n) => n.id === nodeId);
  const config = node?.data.config || {};

  const [countField, setCountField] = useState<string>(config.count || 'total');

  useEffect(() => {
    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        nodeId,
        updates: {
          config: { count: countField || 'total' }
        }
      }
    });
  }, [countField, nodeId, dispatch]);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Count Configuration
      </Typography>
      <TextField
        label="Count Field Name"
        size="small"
        fullWidth
        value={countField}
        onChange={(e) => setCountField(e.target.value)}
        placeholder="e.g., total"
        helperText="Name of the field that will contain the count"
      />
    </Box>
  );
}

