'use client';

import { useState, useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { usePipeline } from '@/contexts/PipelineContext';

interface LimitSkipConfigProps {
  nodeId: string;
}

export function LimitSkipConfig({ nodeId }: LimitSkipConfigProps) {
  const { nodes, dispatch } = usePipeline();
  const node = nodes.find((n) => n.id === nodeId);
  const stageType = node?.data.stageType || '';
  const config = node?.data.config || {};

  const [value, setValue] = useState<string>(() => {
    if (stageType === '$limit') {
      return String(config.limit || 10);
    } else if (stageType === '$skip') {
      return String(config.skip || 0);
    }
    return '0';
  });

  useEffect(() => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      const updateKey = stageType === '$limit' ? 'limit' : 'skip';
      dispatch({
        type: 'UPDATE_NODE',
        payload: {
          nodeId,
          updates: {
            config: { [updateKey]: numValue }
          }
        }
      });
    }
  }, [value, nodeId, stageType, dispatch]);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        {stageType === '$limit' ? 'Limit' : 'Skip'} Configuration
      </Typography>
      <TextField
        label={stageType === '$limit' ? 'Limit' : 'Skip'}
        type="number"
        size="small"
        fullWidth
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputProps={{ min: 0 }}
        helperText={
          stageType === '$limit'
            ? 'Maximum number of documents to pass to the next stage'
            : 'Number of documents to skip'
        }
      />
    </Box>
  );
}

