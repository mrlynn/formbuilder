'use client';

import { useState, useEffect } from 'react';
import { Box, TextField, Typography, Checkbox, FormControlLabel } from '@mui/material';
import { usePipeline } from '@/contexts/PipelineContext';
import { FieldAutocomplete } from '@/components/FieldAutocomplete/FieldAutocomplete';

interface UnwindConfigProps {
  nodeId: string;
}

export function UnwindConfig({ nodeId }: UnwindConfigProps) {
  const { nodes, dispatch } = usePipeline();
  const node = nodes.find((n) => n.id === nodeId);
  const config = node?.data.config || {};

  const [path, setPath] = useState<string>(config.path || '');
  const [preserveNullAndEmptyArrays, setPreserveNullAndEmptyArrays] = useState<boolean>(
    config.preserveNullAndEmptyArrays || false
  );
  const [includeArrayIndex, setIncludeArrayIndex] = useState<string>(
    config.includeArrayIndex || ''
  );

  useEffect(() => {
    const unwindConfig: Record<string, any> = {};
    if (path) {
      unwindConfig.path = path;
    }
    if (preserveNullAndEmptyArrays) {
      unwindConfig.preserveNullAndEmptyArrays = true;
    }
    if (includeArrayIndex) {
      unwindConfig.includeArrayIndex = includeArrayIndex;
    }

    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        nodeId,
        updates: { config: unwindConfig }
      }
    });
  }, [path, preserveNullAndEmptyArrays, includeArrayIndex, nodeId, dispatch]);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Unwind Configuration
      </Typography>

      <Box sx={{ mb: 2 }}>
        <FieldAutocomplete
          value={path.replace(/^\$/, '')}
          onChange={(value) => setPath(value.startsWith('$') ? value : `$${value}`)}
          label="Array Path"
          placeholder="Type field name..."
          size="small"
          fullWidth
          prefix="$"
          helperText="Field path to the array to unwind"
          allowCustom={true}
        />
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={preserveNullAndEmptyArrays}
            onChange={(e) => setPreserveNullAndEmptyArrays(e.target.checked)}
          />
        }
        label="Preserve null and empty arrays"
        sx={{ mb: 2 }}
      />

      <TextField
        label="Array Index Field (optional)"
        size="small"
        fullWidth
        value={includeArrayIndex}
        onChange={(e) => setIncludeArrayIndex(e.target.value)}
        placeholder="e.g., itemIndex"
        helperText="Field name to store the array index"
      />
    </Box>
  );
}

