'use client';

import { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ResponseList } from '../FormResponses/ResponseList';
import { ExportDialog } from '../FormExports/ExportDialog';
import { Button } from '@mui/material';
import { Download } from '@mui/icons-material';
import { HelpButton } from '@/components/Help/HelpButton';

interface AnalyticsTabsProps {
  formId: string;
  connectionString?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function AnalyticsTabs({ formId, connectionString }: AnalyticsTabsProps) {
  const [value, setValue] = useState(0);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tabs value={value} onChange={handleChange}>
              <Tab label="Overview" />
              <Tab label="Responses" />
              <Tab label="Analytics" />
            </Tabs>
            <HelpButton topicId={value === 1 ? 'response-management' : 'form-analytics'} tooltip="Help" />
          </Box>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => setExportDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #00ED64 0%, #4DFF9F 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00CC55 0%, #3DFF8F 100%)',
              },
            }}
          >
            Export
          </Button>
        </Box>
      </Paper>

      <TabPanel value={value} index={0}>
        <AnalyticsDashboard formId={formId} connectionString={connectionString} />
      </TabPanel>

      <TabPanel value={value} index={1}>
        <ResponseList formId={formId} connectionString={connectionString} />
      </TabPanel>

      <TabPanel value={value} index={2}>
        <AnalyticsDashboard formId={formId} connectionString={connectionString} />
      </TabPanel>

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        formId={formId}
        connectionString={connectionString}
      />
    </Box>
  );
}

