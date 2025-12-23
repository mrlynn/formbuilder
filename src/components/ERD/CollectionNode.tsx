'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Paper, alpha } from '@mui/material';
import { Storage } from '@mui/icons-material';

interface CollectionNodeData {
  name: string;
  fields: string[];
  count: number;
}

export const CollectionNode = memo(({ data }: NodeProps<CollectionNodeData>) => {
  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: 250,
        maxWidth: 300,
        bgcolor: 'background.paper',
        border: '2px solid',
        borderColor: alpha('#00ED64', 0.5),
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          p: 1.5,
          bgcolor: alpha('#00ED64', 0.1),
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Storage sx={{ fontSize: 18, color: '#00ED64' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
          {data.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data.count.toLocaleString()}
        </Typography>
      </Box>
      <Box sx={{ p: 1.5, maxHeight: 300, overflow: 'auto' }}>
        {data.fields.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {data.fields.slice(0, 10).map((field) => (
              <Typography
                key={field}
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  px: 1,
                  py: 0.5,
                  bgcolor: alpha('#000', 0.03),
                  borderRadius: 0.5
                }}
              >
                {field}
              </Typography>
            ))}
            {data.fields.length > 10 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                +{data.fields.length - 10} more fields
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary">
            No fields detected
          </Typography>
        )}
      </Box>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </Paper>
  );
});

CollectionNode.displayName = 'CollectionNode';

