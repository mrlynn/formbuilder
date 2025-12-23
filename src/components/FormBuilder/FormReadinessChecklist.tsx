'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Collapse,
  alpha,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Warning,
  ExpandMore,
  ExpandLess,
  Storage,
  ListAlt,
  Lock,
  Settings,
  Rocket,
} from '@mui/icons-material';
import { FormDataSource, FormAccessControl, FieldConfig } from '@/types/form';

interface FormReadinessChecklistProps {
  fieldConfigs: FieldConfig[];
  dataSource?: FormDataSource;
  accessControl?: FormAccessControl;
  isPublished?: boolean;
  onConfigureStorage: () => void;
  onConfigureAccess: () => void;
  onPublish: () => void;
  compact?: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'complete' | 'incomplete' | 'warning';
  action?: () => void;
  actionLabel?: string;
  icon: React.ReactNode;
}

export function FormReadinessChecklist({
  fieldConfigs,
  dataSource,
  accessControl,
  isPublished,
  onConfigureStorage,
  onConfigureAccess,
  onPublish,
  compact = false,
}: FormReadinessChecklistProps) {
  const [expanded, setExpanded] = useState(!compact);

  // Calculate readiness items
  const hasFields = fieldConfigs.filter(f => f.included).length > 0;
  const hasStorage = !!(dataSource?.vaultId && dataSource?.collection);
  const hasAccess = !!accessControl?.type;

  const items: ChecklistItem[] = [
    {
      id: 'fields',
      label: 'Form Fields',
      description: hasFields
        ? `${fieldConfigs.filter(f => f.included).length} questions configured`
        : 'Add at least one question to your form',
      status: hasFields ? 'complete' : 'incomplete',
      icon: <ListAlt />,
    },
    {
      id: 'storage',
      label: 'Data Storage',
      description: hasStorage
        ? `Saving to ${dataSource?.collection}`
        : 'Configure where form submissions are stored',
      status: hasStorage ? 'complete' : 'incomplete',
      action: onConfigureStorage,
      actionLabel: hasStorage ? 'Change' : 'Configure',
      icon: <Storage />,
    },
    {
      id: 'access',
      label: 'Access Control',
      description: hasAccess
        ? `${accessControl?.type === 'public' ? 'Public access' : accessControl?.type === 'authenticated' ? 'Login required' : 'Restricted access'}`
        : 'Optional: Restrict who can access the form',
      status: hasAccess ? 'complete' : 'warning',
      action: onConfigureAccess,
      actionLabel: hasAccess ? 'Change' : 'Set Up',
      icon: <Lock />,
    },
  ];

  const completedCount = items.filter(i => i.status === 'complete').length;
  const requiredComplete = items.filter(i => i.id !== 'access' && i.status === 'complete').length;
  const requiredTotal = items.filter(i => i.id !== 'access').length;
  const progress = (completedCount / items.length) * 100;
  const canPublish = requiredComplete === requiredTotal;

  // If already published, show minimal status
  if (isPublished) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          bgcolor: alpha('#00ED64', 0.1),
          borderRadius: 1,
          border: '1px solid',
          borderColor: alpha('#00ED64', 0.3),
        }}
      >
        <CheckCircle sx={{ color: '#00ED64', fontSize: 18 }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#00ED64' }}>
          Published
        </Typography>
        {hasStorage && (
          <Chip
            label={dataSource?.collection}
            size="small"
            sx={{ fontSize: 10, height: 18, ml: 0.5 }}
          />
        )}
      </Box>
    );
  }

  if (compact) {
    return (
      <Box>
        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
          sx={{
            textTransform: 'none',
            color: canPublish ? '#00ED64' : 'text.secondary',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {canPublish ? (
              <CheckCircle sx={{ fontSize: 16, color: '#00ED64' }} />
            ) : (
              <Warning sx={{ fontSize: 16, color: 'warning.main' }} />
            )}
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {canPublish ? 'Ready to publish' : `${requiredComplete}/${requiredTotal} required`}
            </Typography>
          </Box>
        </Button>

        <Collapse in={expanded}>
          <Paper
            elevation={0}
            sx={{
              mt: 1,
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <List dense disablePadding>
              {items.map((item) => (
                <ListItem
                  key={item.id}
                  disablePadding
                  sx={{ mb: 0.5 }}
                  secondaryAction={
                    item.action && (
                      <Button
                        size="small"
                        onClick={item.action}
                        sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                      >
                        {item.actionLabel}
                      </Button>
                    )
                  }
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    {item.status === 'complete' ? (
                      <CheckCircle sx={{ fontSize: 16, color: '#00ED64' }} />
                    ) : item.status === 'warning' ? (
                      <RadioButtonUnchecked sx={{ fontSize: 16, color: 'text.disabled' }} />
                    ) : (
                      <RadioButtonUnchecked sx={{ fontSize: 16, color: 'warning.main' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ variant: 'caption', fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>

            {canPublish && (
              <Button
                variant="contained"
                size="small"
                fullWidth
                startIcon={<Rocket />}
                onClick={onPublish}
                sx={{
                  mt: 1,
                  background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7b1fa2 0%, #ab47bc 100%)',
                  },
                }}
              >
                Publish Form
              </Button>
            )}
          </Paper>
        </Collapse>
      </Box>
    );
  }

  // Full view
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: canPublish ? alpha('#00ED64', 0.3) : 'divider',
        borderRadius: 2,
        bgcolor: canPublish ? alpha('#00ED64', 0.02) : 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings sx={{ color: canPublish ? '#00ED64' : 'text.secondary' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Form Readiness
          </Typography>
        </Box>
        <Chip
          label={`${completedCount}/${items.length} complete`}
          size="small"
          sx={{
            bgcolor: canPublish ? alpha('#00ED64', 0.1) : alpha('#ff9800', 0.1),
            color: canPublish ? '#00ED64' : '#ff9800',
            fontWeight: 600,
          }}
        />
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: alpha('#000', 0.1),
          mb: 2,
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            bgcolor: canPublish ? '#00ED64' : '#ff9800',
          },
        }}
      />

      <List disablePadding>
        {items.map((item, index) => (
          <ListItem
            key={item.id}
            disablePadding
            sx={{
              py: 1,
              borderBottom: index < items.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.status === 'complete' ? (
                <CheckCircle sx={{ color: '#00ED64' }} />
              ) : item.status === 'warning' ? (
                <RadioButtonUnchecked sx={{ color: 'text.disabled' }} />
              ) : (
                <Warning sx={{ color: 'warning.main' }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {item.icon}
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item.label}
                  </Typography>
                  {item.id === 'access' && (
                    <Chip label="Optional" size="small" sx={{ fontSize: 10, height: 18 }} />
                  )}
                </Box>
              }
              secondary={item.description}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            {item.action && (
              <Button
                size="small"
                variant={item.status === 'incomplete' ? 'contained' : 'outlined'}
                onClick={item.action}
                sx={
                  item.status === 'incomplete'
                    ? {
                        background: 'linear-gradient(135deg, #00ED64 0%, #4DFF9F 100%)',
                        color: '#001E2B',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #00CC55 0%, #3DFF8F 100%)',
                        },
                      }
                    : {}
                }
              >
                {item.actionLabel}
              </Button>
            )}
          </ListItem>
        ))}
      </List>

      {!canPublish && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: alpha('#ff9800', 0.1),
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Warning sx={{ color: '#ff9800', fontSize: 20 }} />
          <Typography variant="caption" color="text.secondary">
            Configure data storage to enable publishing. Form submissions need a place to be saved.
          </Typography>
        </Box>
      )}

      {canPublish && (
        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={<Rocket />}
          onClick={onPublish}
          sx={{
            mt: 2,
            py: 1.5,
            background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
            fontWeight: 600,
            fontSize: '1rem',
            '&:hover': {
              background: 'linear-gradient(135deg, #7b1fa2 0%, #ab47bc 100%)',
            },
          }}
        >
          Publish Form
        </Button>
      )}
    </Paper>
  );
}
