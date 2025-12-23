'use client';

import { Card, CardContent, Box, Typography, alpha } from '@mui/material';
import { StageDefinition } from '@/types/pipeline';
import * as Icons from '@mui/icons-material';

interface StageCardProps {
  stage: StageDefinition;
}

export function StageCard({ stage }: StageCardProps) {
  const IconComponent = (Icons as any)[stage.icon] || Icons.Code;

  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', stage.type);
    event.dataTransfer.effectAllowed = 'move';
    // Add visual feedback
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (event: React.DragEvent) => {
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.opacity = '1';
    }
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sx={{
        cursor: 'grab',
        transition: 'all 0.2s ease',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        '&:hover': {
          borderColor: stage.color,
          bgcolor: alpha(stage.color, 0.08),
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 12px ${alpha(stage.color, 0.2)}`,
          cursor: 'grabbing'
        },
        '&:active': {
          cursor: 'grabbing',
          transform: 'translateY(0)'
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: alpha(stage.color, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <IconComponent
              sx={{
                color: stage.color,
                fontSize: 22
              }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 0.25
              }}
            >
              {stage.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {stage.type}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

