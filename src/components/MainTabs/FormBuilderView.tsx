'use client';

import { useState } from 'react';
import { Box, Paper, Typography, alpha, IconButton, Tooltip, Drawer } from '@mui/material';
import { Storage, ChevronRight, Close } from '@mui/icons-material';
import { ConnectionPanel } from '@/components/ConnectionPanel/ConnectionPanel';
import { usePipeline } from '@/contexts/PipelineContext';
import { FormBuilder } from '@/components/FormBuilder/FormBuilder';

interface FormBuilderViewProps {
  initialFormId?: string;
}

export function FormBuilderView({ initialFormId }: FormBuilderViewProps) {
  const { connectionString, databaseName, collection } = usePipeline();
  const [connectionDrawerOpen, setConnectionDrawerOpen] = useState(false);

  const hasConnection = Boolean(connectionString && databaseName && collection);

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
      {/* Slim Connection Sidebar - always visible */}
      <Paper
        elevation={0}
        sx={{
          width: 48,
          height: '100%',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 1,
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
        <Tooltip title={hasConnection ? `Connected: ${databaseName}.${collection}` : 'Connect to MongoDB'} placement="right">
          <IconButton
            onClick={() => setConnectionDrawerOpen(true)}
            sx={{
              width: 36,
              height: 36,
              bgcolor: hasConnection ? alpha('#00ED64', 0.1) : 'transparent',
              color: hasConnection ? '#00ED64' : 'text.secondary',
              '&:hover': {
                bgcolor: hasConnection ? alpha('#00ED64', 0.2) : alpha('#fff', 0.05),
              },
            }}
          >
            <Storage sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        {hasConnection && (
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: '#00ED64',
              mt: 0.5,
            }}
          />
        )}
      </Paper>

      {/* Main Form Builder Area - takes remaining space */}
      <Box sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
        <FormBuilder initialFormId={initialFormId} />
      </Box>

      {/* Connection Drawer - slides in from left */}
      <Drawer
        anchor="left"
        open={connectionDrawerOpen}
        onClose={() => setConnectionDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 340,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          }
        }}
        // Don't block interaction with main content
        ModalProps={{
          keepMounted: true,
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: hasConnection ? alpha('#00ED64', 0.05) : 'transparent',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Storage sx={{ color: hasConnection ? '#00ED64' : 'text.secondary', fontSize: 20 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                MongoDB Connection
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {hasConnection ? `${databaseName}.${collection}` : 'Import fields from your database'}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setConnectionDrawerOpen(false)}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Connection Panel Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <ConnectionPanel />
        </Box>
      </Drawer>
    </Box>
  );
}

