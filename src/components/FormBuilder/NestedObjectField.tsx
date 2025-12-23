'use client';

import {
  Box,
  TextField,
  Typography,
  Paper,
  Collapse,
  IconButton,
  alpha,
  Switch,
  FormControlLabel
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useState } from 'react';
import { FieldConfig } from '@/types/form';

interface NestedObjectFieldProps {
  config: FieldConfig;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  allFieldConfigs: FieldConfig[];
}

export function NestedObjectField({ 
  config, 
  value, 
  onChange, 
  allFieldConfigs 
}: NestedObjectFieldProps) {
  const [expanded, setExpanded] = useState(true);
  const objectValue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};

  // Find nested field configs for this object
  const nestedConfigs = allFieldConfigs.filter(
    (fc) => fc.path.startsWith(`${config.path}.`) && !fc.path.includes('[]')
  );

  const handleFieldChange = (fieldPath: string, fieldValue: any) => {
    // Remove the parent path prefix to get just the field name
    const fieldName = fieldPath.replace(`${config.path}.`, '');
    const newValue = { ...objectValue, [fieldName]: fieldValue };
    onChange(newValue);
  };

  const handleAddField = (fieldName: string) => {
    if (fieldName.trim()) {
      const newValue = { ...objectValue, [fieldName.trim()]: '' };
      onChange(newValue);
    }
  };

  const handleRemoveField = (fieldName: string) => {
    const newValue = { ...objectValue };
    delete newValue[fieldName];
    onChange(newValue);
  };

  // Get the value for a nested field
  const getNestedValue = (fieldPath: string): any => {
    const fieldName = fieldPath.replace(`${config.path}.`, '');
    return objectValue[fieldName] !== undefined ? objectValue[fieldName] : '';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          bgcolor: alpha('#00ED64', 0.05),
          '&:hover': {
            bgcolor: alpha('#00ED64', 0.1)
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {config.label}
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nestedConfigs.length > 0 ? (
            nestedConfigs.map((nestedConfig) => {
              const nestedValue = getNestedValue(nestedConfig.path);
              
              // Render based on nested field type
              if (nestedConfig.type === 'boolean') {
                return (
                  <FormControlLabel
                    key={nestedConfig.path}
                    control={
                      <Switch
                        checked={Boolean(nestedValue)}
                        onChange={(e) => handleFieldChange(nestedConfig.path, e.target.checked)}
                        size="small"
                      />
                    }
                    label={nestedConfig.label}
                  />
                );
              }

              if (nestedConfig.type === 'number') {
                return (
                  <TextField
                    key={nestedConfig.path}
                    size="small"
                    type="number"
                    label={nestedConfig.label}
                    value={nestedValue || ''}
                    onChange={(e) => {
                      const numValue = e.target.value === '' ? '' : Number(e.target.value);
                      handleFieldChange(nestedConfig.path, numValue);
                    }}
                    fullWidth
                  />
                );
              }

              return (
                <TextField
                  key={nestedConfig.path}
                  size="small"
                  label={nestedConfig.label}
                  placeholder={nestedConfig.placeholder}
                  value={nestedValue || ''}
                  onChange={(e) => handleFieldChange(nestedConfig.path, e.target.value)}
                  fullWidth
                />
              );
            })
          ) : (
            <Typography variant="caption" color="text.secondary">
              No nested fields configured. Add fields manually below.
            </Typography>
          )}

          {/* Manual field addition */}
          <Box sx={{ mt: 1, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Add custom field:
            </Typography>
            {Object.keys(objectValue).map((key) => (
              <Box key={key} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="Field name"
                  value={key}
                  disabled
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Value"
                  value={objectValue[key] || ''}
                  onChange={(e) => handleFieldChange(`${config.path}.${key}`, e.target.value)}
                  sx={{ flex: 2 }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleRemoveField(key)}
                  color="error"
                >
                  ×
                </IconButton>
              </Box>
            ))}
            <TextField
              size="small"
              placeholder="New field name"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  handleAddField(input.value);
                  input.value = '';
                }
              }}
              fullWidth
            />
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}

