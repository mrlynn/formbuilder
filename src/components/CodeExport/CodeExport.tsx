'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Typography,
  Paper
} from '@mui/material';
import { ContentCopy, Code } from '@mui/icons-material';
import { usePipeline } from '@/contexts/PipelineContext';
import { serializeFromState } from '@/lib/pipelineSerializer';

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function CodeExport() {
  const pipelineState = usePipeline();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const mqlPipeline = useMemo(() => serializeFromState(pipelineState), [pipelineState]);

  const nodeJsSnippet = useMemo(
    () =>
      `const pipeline = ${formatJson(mqlPipeline)};\n\nconst cursor = db.collection('${
        pipelineState.collection || 'yourCollection'
      }').aggregate(pipeline);\nconst results = await cursor.toArray();`,
    [mqlPipeline, pipelineState.collection]
  );

  const shellSnippet = useMemo(
    () =>
      `const pipeline = ${formatJson(mqlPipeline)};\n\ndb.${
        pipelineState.collection || 'yourCollection'
      }.aggregate(pipeline);`,
    [mqlPipeline, pipelineState.collection]
  );

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard errors
    }
  };

  const codeByTab = [
    { label: 'Raw MQL', value: formatJson(mqlPipeline) },
    { label: 'Node.js', value: nodeJsSnippet },
    { label: 'mongosh', value: shellSnippet }
  ];

  const currentCode = codeByTab[tab]?.value || '';

  return (
    <>
      <Tooltip title="View pipeline code">
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<Code />}
          onClick={() => setOpen(true)}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            pointerEvents: 'auto'
          }}
        >
          View Pipeline
        </Button>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Export Aggregation Pipeline</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Tabs
            value={tab}
            onChange={(_e, value) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {codeByTab.map((t, index) => (
              <Tab key={t.label} label={t.label} value={index} />
            ))}
          </Tabs>
          <Box sx={{ position: 'relative' }}>
            <IconButton
              size="small"
              onClick={() => handleCopy(currentCode)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1
              }}
            >
              <ContentCopy fontSize="small" />
            </IconButton>
            <Paper
              sx={{
                m: 2,
                p: 2,
                bgcolor: 'background.default',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                maxHeight: 400,
                overflow: 'auto'
              }}
            >
              <Typography
                component="pre"
                sx={{
                  m: 0,
                  whiteSpace: 'pre',
                  fontFamily: 'monospace'
                }}
              >
                {currentCode}
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

