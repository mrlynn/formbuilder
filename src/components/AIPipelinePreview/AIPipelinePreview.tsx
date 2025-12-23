'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  alpha,
  Chip,
  IconButton
} from '@mui/material';
import { Check, Close, AutoAwesome } from '@mui/icons-material';
import { SerializedStage } from '@/lib/pipelineSerializer';
import { getStageDefinition } from '@/lib/stageDefinitions';

interface AIPipelinePreviewProps {
  open: boolean;
  stages: SerializedStage[];
  explanation?: string;
  onApprove: () => void;
  onCancel: () => void;
}

export function AIPipelinePreview({
  open,
  stages,
  explanation,
  onApprove,
  onCancel
}: AIPipelinePreviewProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          border: `1px solid ${alpha('#00ED64', 0.3)}`,
          boxShadow: `0 12px 48px ${alpha('#000', 0.5)}`
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome sx={{ color: '#00ED64' }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(135deg, #00ED64 0%, #4DFF9F 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Preview Generated Pipeline
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {explanation && (
          <Paper
            sx={{
              p: 2,
              mb: 3,
              bgcolor: alpha('#00ED64', 0.1),
              border: `1px solid ${alpha('#00ED64', 0.3)}`
            }}
          >
            <Typography variant="body2" color="text.primary">
              {explanation}
            </Typography>
          </Paper>
        )}

        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Pipeline Stages ({stages.length})
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {stages.map((stage, index) => {
            const stageType = Object.keys(stage)[0];
            const config = stage[stageType];
            const definition = getStageDefinition(stageType);

            return (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alpha(definition?.color || '#00ED64', 0.05)
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    label={stageType}
                    size="small"
                    sx={{
                      bgcolor: alpha(definition?.color || '#00ED64', 0.2),
                      color: definition?.color || '#00ED64',
                      fontWeight: 600,
                      fontFamily: 'monospace'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {definition?.name || stageType}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    overflow: 'auto',
                    maxHeight: 100
                  }}
                >
                  {JSON.stringify(config, null, 2)}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onCancel}
          startIcon={<Close />}
          sx={{ color: 'text.secondary' }}
        >
          Cancel
        </Button>
        <Button
          onClick={onApprove}
          variant="contained"
          startIcon={<Check />}
          sx={{
            bgcolor: '#00ED64',
            color: '#000',
            fontWeight: 600,
            '&:hover': {
              bgcolor: '#00B84A'
            }
          }}
        >
          Apply to Canvas
        </Button>
      </DialogActions>
    </Dialog>
  );
}

