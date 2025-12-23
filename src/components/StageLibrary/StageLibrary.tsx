'use client';

import { Box, Typography, alpha } from '@mui/material';
import { StageCard } from './StageCard';
import { stageDefinitions, getStagesByCategory } from '@/lib/stageDefinitions';
import { StageDefinition } from '@/types/pipeline';

const categories: { label: string; value: StageDefinition['category'] }[] = [
  { label: 'Filter', value: 'filter' },
  { label: 'Transform', value: 'transform' },
  { label: 'Join', value: 'join' },
  { label: 'Shape', value: 'shape' }
];

export function StageLibrary() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {categories.map((category) => {
          const stages = getStagesByCategory(category.value);
          if (stages.length === 0) return null;

          return (
            <Box key={category.value} sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  mb: 1.5,
                  display: 'block',
                  px: 1
                }}
              >
                {category.label}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                {stages.map((stage) => (
                  <StageCard key={stage.type} stage={stage} />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

