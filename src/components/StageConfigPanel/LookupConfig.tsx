'use client';

import { useState, useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { usePipeline } from '@/contexts/PipelineContext';
import { FieldAutocomplete } from '@/components/FieldAutocomplete/FieldAutocomplete';

interface LookupConfigProps {
  nodeId: string;
}

export function LookupConfig({ nodeId }: LookupConfigProps) {
  const { nodes, dispatch } = usePipeline();
  const node = nodes.find((n) => n.id === nodeId);
  const config = node?.data.config || {};

  const [from, setFrom] = useState<string>(config.from || '');
  const [localField, setLocalField] = useState<string>(config.localField || '');
  const [foreignField, setForeignField] = useState<string>(config.foreignField || '');
  const [as, setAs] = useState<string>(config.as || 'joined');

  useEffect(() => {
    const lookupConfig: Record<string, string> = {};
    if (from) lookupConfig.from = from;
    if (localField) lookupConfig.localField = localField;
    if (foreignField) lookupConfig.foreignField = foreignField;
    if (as) lookupConfig.as = as;

    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        nodeId,
        updates: { config: lookupConfig }
      }
    });
  }, [from, localField, foreignField, as, nodeId, dispatch]);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Lookup Configuration
      </Typography>

      <TextField
        label="From Collection"
        size="small"
        fullWidth
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        sx={{ mb: 2 }}
        placeholder="e.g., products"
        helperText="Name of the collection to join with"
        required
      />

      <Box sx={{ mb: 2 }}>
        <FieldAutocomplete
          value={localField}
          onChange={(value) => setLocalField(value)}
          label="Local Field"
          placeholder="Type field name..."
          size="small"
          fullWidth
          helperText="Field from the input documents"
          allowCustom={true}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <FieldAutocomplete
          value={foreignField}
          onChange={(value) => setForeignField(value)}
          label="Foreign Field"
          placeholder="Type field name..."
          size="small"
          fullWidth
          helperText="Field from the documents in the 'from' collection"
          allowCustom={true}
        />
      </Box>

      <TextField
        label="As (Output Field)"
        size="small"
        fullWidth
        value={as}
        onChange={(e) => setAs(e.target.value)}
        placeholder="e.g., joined"
        helperText="Name of the new array field to add"
      />
    </Box>
  );
}

