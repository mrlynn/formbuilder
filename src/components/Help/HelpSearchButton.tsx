'use client';

import { Button, Tooltip, alpha, Box, Typography } from '@mui/material';
import { Search, KeyboardCommandKey } from '@mui/icons-material';
import { useHelp } from '@/contexts/HelpContext';

interface HelpSearchButtonProps {
  variant?: 'icon' | 'full' | 'compact';
}

export function HelpSearchButton({ variant = 'compact' }: HelpSearchButtonProps) {
  const { openSearch } = useHelp();

  if (variant === 'icon') {
    return (
      <Tooltip title="Search Help (⌘/)">
        <Button
          size="small"
          onClick={openSearch}
          sx={{
            minWidth: 36,
            width: 36,
            height: 36,
            borderRadius: 1,
            color: 'text.secondary',
            '&:hover': {
              bgcolor: alpha('#00ED64', 0.1),
              color: '#00ED64',
            },
          }}
        >
          <Search fontSize="small" />
        </Button>
      </Tooltip>
    );
  }

  if (variant === 'full') {
    return (
      <Button
        variant="outlined"
        onClick={openSearch}
        startIcon={<Search />}
        sx={{
          borderColor: 'divider',
          color: 'text.secondary',
          textTransform: 'none',
          justifyContent: 'flex-start',
          px: 2,
          py: 1,
          borderRadius: 2,
          minWidth: 200,
          '&:hover': {
            borderColor: '#00ED64',
            bgcolor: alpha('#00ED64', 0.05),
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            Search help...
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              px: 0.75,
              py: 0.25,
              bgcolor: alpha('#000', 0.05),
              borderRadius: 0.5,
              fontSize: '0.7rem',
              color: 'text.disabled',
            }}
          >
            <KeyboardCommandKey sx={{ fontSize: 12 }} />
            /
          </Box>
        </Box>
      </Button>
    );
  }

  // compact variant (default)
  return (
    <Tooltip title="Search Help Topics">
      <Button
        size="small"
        onClick={openSearch}
        startIcon={<Search fontSize="small" />}
        sx={{
          color: 'text.secondary',
          textTransform: 'none',
          fontSize: '0.8rem',
          '&:hover': {
            bgcolor: alpha('#00ED64', 0.1),
            color: '#00ED64',
          },
        }}
      >
        Help
        <Box
          component="kbd"
          sx={{
            ml: 1,
            px: 0.5,
            py: 0.125,
            bgcolor: alpha('#000', 0.05),
            borderRadius: 0.5,
            fontSize: '0.65rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.25,
          }}
        >
          <KeyboardCommandKey sx={{ fontSize: 10 }} />
          /
        </Box>
      </Button>
    </Tooltip>
  );
}
