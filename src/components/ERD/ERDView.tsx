'use client';

import { Box, Paper, Typography, alpha } from '@mui/material';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { ConnectionPanel } from '@/components/ConnectionPanel/ConnectionPanel';
import { ERDCanvas } from './ERDCanvas';
import { usePipeline } from '@/contexts/PipelineContext';
import { useState, useEffect } from 'react';
import { HelpButton } from '@/components/Help/HelpButton';

interface CollectionInfo {
  name: string;
  fields: string[];
  count: number;
}

export function ERDView() {
  const { connectionString, databaseName } = usePipeline();
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

  // Fetch schema when database is selected
  useEffect(() => {
    if (connectionString && databaseName) {
      fetchSchema();
    } else {
      setCollections([]);
    }
  }, [connectionString, databaseName]);

  const fetchSchema = async () => {
    if (!connectionString || !databaseName) return;

    setIsLoadingSchema(true);
    try {
      const response = await fetch('/api/mongodb/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString,
          databaseName
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Failed to fetch schema:', error);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex' }}>
      <Allotment>
        {/* Connection Panel (left) */}
        <Allotment.Pane preferredSize={300} minSize={250} maxSize={400}>
          <Paper
            elevation={0}
            sx={{
              height: '100%',
              borderRight: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              borderRadius: 0
            }}
          >
            <Box
              sx={{
                p: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha('#00ED64', 0.05)
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #00ED64 0%, #4DFF9F 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 0.5
                  }}
                >
                  Entity Relationship Diagram
                </Typography>
                <HelpButton topicId="erd-viewer" tooltip="ERD Help" />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Database schema visualization
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <ConnectionPanel />
            </Box>
          </Paper>
        </Allotment.Pane>

        {/* ERD Canvas (right) */}
        <Allotment.Pane>
          <ERDCanvas collections={collections} isLoading={isLoadingSchema} />
        </Allotment.Pane>
      </Allotment>
    </Box>
  );
}

