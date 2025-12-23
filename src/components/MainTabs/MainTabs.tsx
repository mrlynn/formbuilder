'use client';

import { Box } from '@mui/material';
import { FormBuilderView } from './FormBuilderView';
import { AppNavBar } from '@/components/Navigation';

// Hidden imports - kept for future multi-tool support
// import { useState, useEffect } from 'react';
// import { ERDView } from '@/components/ERD/ERDView';
// import { PipelineBuilder } from './PipelineBuilder';
// const TAB_COUNT = 3;

/**
 * MainTabs - Original multi-tool interface (now simplified)
 *
 * This component is kept for backwards compatibility but now renders
 * only the FormBuilderView for a focused forms experience.
 *
 * To re-enable the full multi-tool interface with ERD and Pipeline tabs,
 * uncomment the hidden imports above and the tab switching logic below.
 */
export function MainTabs() {
  // Hidden tab state - kept for future use
  // const [tabValue, setTabValue] = useState(2);
  // useEffect(() => { ... keyboard shortcuts ... }, []);

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar - simplified for forms-only */}
      <AppNavBar />

      {/* Content Area - Forms only */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Hidden tools - uncomment to restore multi-tool interface
        {tabValue === 0 && <ERDView />}
        {tabValue === 1 && <PipelineBuilder />}
        {tabValue === 2 && <FormBuilderView />}
        */}
        <FormBuilderView />
      </Box>
    </Box>
  );
}
