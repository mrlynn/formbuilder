'use client';

import { IconButton, Tooltip, alpha, SxProps, Theme } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { HelpTopicId } from '@/types/help';
import { useHelp } from '@/contexts/HelpContext';

interface HelpButtonProps {
  topicId: HelpTopicId;
  size?: 'small' | 'medium';
  tooltip?: string;
  sx?: SxProps<Theme>;
}

export function HelpButton({ topicId, size = 'small', tooltip, sx }: HelpButtonProps) {
  const { openHelp } = useHelp();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openHelp(topicId);
  };

  const ariaLabel = tooltip || `Help for ${topicId.replace(/-/g, ' ')}`;

  return (
    <Tooltip title={tooltip || 'Help'}>
      <IconButton
        size={size}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        sx={{
          color: 'text.secondary',
          '&:hover': {
            color: '#00ED64',
            bgcolor: alpha('#00ED64', 0.1),
          },
          '&:focus-visible': {
            outline: '2px solid #00ED64',
            outlineOffset: 2,
          },
          ...sx,
        }}
      >
        <HelpOutline fontSize={size} aria-hidden="true" />
      </IconButton>
    </Tooltip>
  );
}
