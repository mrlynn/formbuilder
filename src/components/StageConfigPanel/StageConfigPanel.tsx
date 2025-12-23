'use client';

import { Box, Typography, Paper, alpha, Button, IconButton, Divider } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { usePipeline } from '@/contexts/PipelineContext';
import { getStageDefinition } from '@/lib/stageDefinitions';
import { MatchConfig } from './MatchConfig';
import { GroupConfig } from './GroupConfig';
import { ProjectConfig } from './ProjectConfig';
import { SortConfig } from './SortConfig';
import { LimitSkipConfig } from './LimitSkipConfig';
import { UnwindConfig } from './UnwindConfig';
import { LookupConfig } from './LookupConfig';
import { AddFieldsConfig } from './AddFieldsConfig';
import { CountConfig } from './CountConfig';

export function StageConfigPanel() {
  const { nodes, selectedNodeId, dispatch } = usePipeline();

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          p: 3
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Select a stage node to configure it
        </Typography>
      </Box>
    );
  }

  const definition = getStageDefinition(selectedNode.data.stageType);
  if (!definition) return null;

  const renderConfigForm = () => {
    switch (selectedNode.data.stageType) {
      case '$match':
        return <MatchConfig nodeId={selectedNode.id} />;
      case '$group':
        return <GroupConfig nodeId={selectedNode.id} />;
      case '$project':
        return <ProjectConfig nodeId={selectedNode.id} />;
      case '$sort':
        return <SortConfig nodeId={selectedNode.id} />;
      case '$limit':
      case '$skip':
        return <LimitSkipConfig nodeId={selectedNode.id} />;
      case '$unwind':
        return <UnwindConfig nodeId={selectedNode.id} />;
      case '$lookup':
        return <LookupConfig nodeId={selectedNode.id} />;
      case '$addFields':
        return <AddFieldsConfig nodeId={selectedNode.id} />;
      case '$count':
        return <CountConfig nodeId={selectedNode.id} />;
      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Configuration form for {selectedNode.data.stageType} coming soon
          </Typography>
        );
    }
  };

  const handleDelete = () => {
    if (selectedNodeId) {
      dispatch({ type: 'DELETE_NODE', payload: { nodeId: selectedNodeId } });
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: alpha(definition.color, 0.1),
            border: '1px solid',
            borderColor: alpha(definition.color, 0.3),
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {definition.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {selectedNode.data.stageType}
            </Typography>
            {definition.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {definition.description}
              </Typography>
            )}
          </Box>
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{
              color: 'error.main',
              '&:hover': {
                bgcolor: alpha('#f85149', 0.1)
              }
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Paper>

        {selectedNode.data.error && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: alpha('#f85149', 0.1),
              border: '1px solid',
              borderColor: 'error.main'
            }}
          >
            <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
              Error
            </Typography>
            <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
              {selectedNode.data.error}
            </Typography>
          </Paper>
        )}

        {renderConfigForm()}
      </Box>
    </Box>
  );
}
