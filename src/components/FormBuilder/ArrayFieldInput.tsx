'use client';

import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  alpha
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { FieldConfig } from '@/types/form';

interface ArrayFieldInputProps {
  config: FieldConfig;
  value: any[];
  onChange: (value: any[]) => void;
}

export function ArrayFieldInput({ config, value, onChange }: ArrayFieldInputProps) {
  const arrayValue = Array.isArray(value) ? value : [];

  const handleAddItem = () => {
    if (config.type === 'array-object') {
      // For array of objects, add an empty object
      onChange([...arrayValue, {}]);
    } else {
      // For primitive arrays, add empty string
      onChange([...arrayValue, '']);
    }
  };

  const handleRemoveItem = (index: number) => {
    const newValue = arrayValue.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleItemChange = (index: number, itemValue: any) => {
    const newValue = [...arrayValue];
    newValue[index] = itemValue;
    onChange(newValue);
  };

  const handleNestedObjectChange = (index: number, fieldPath: string, fieldValue: any) => {
    const newValue = [...arrayValue];
    if (!newValue[index]) {
      newValue[index] = {};
    }
    
    // Set nested value in object
    const keys = fieldPath.split('.');
    let target = newValue[index];
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }
    target[keys[keys.length - 1]] = fieldValue;
    
    onChange(newValue);
  };

  if (config.type === 'array-object') {
    // Array of objects - render each object as a form
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {config.label}
          </Typography>
          <IconButton
            size="small"
            onClick={handleAddItem}
            sx={{
              bgcolor: alpha('#00ED64', 0.1),
              '&:hover': { bgcolor: alpha('#00ED64', 0.2) }
            }}
          >
            <Add fontSize="small" />
          </IconButton>
        </Box>

        {arrayValue.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              textAlign: 'center',
              bgcolor: alpha('#00ED64', 0.05),
              border: '1px dashed',
              borderColor: alpha('#00ED64', 0.3)
            }}
          >
            <Typography variant="caption" color="text.secondary">
              No items. Click the + button to add an item.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {arrayValue.map((item, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  position: 'relative'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Item {index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveItem(index)}
                    color="error"
                    sx={{ ml: 1 }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>

                {/* Render object fields as text inputs */}
                {item && typeof item === 'object' ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.keys(item).map((key) => (
                      <TextField
                        key={key}
                        size="small"
                        label={key}
                        value={item[key] || ''}
                        onChange={(e) => handleNestedObjectChange(index, key, e.target.value)}
                        fullWidth
                      />
                    ))}
                    <TextField
                      size="small"
                      label="Add new field"
                      placeholder="Field name"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const fieldName = input.value.trim();
                          if (fieldName) {
                            handleNestedObjectChange(index, fieldName, '');
                            input.value = '';
                          }
                        }
                      }}
                      fullWidth
                    />
                  </Box>
                ) : (
                  <TextField
                    size="small"
                    label="Object"
                    value={JSON.stringify(item || {})}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        handleItemChange(index, parsed);
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    fullWidth
                    multiline
                    rows={3}
                    helperText="Enter JSON object"
                  />
                )}
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // Primitive array (strings, numbers, etc.)
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {config.label}
        </Typography>
        <IconButton
          size="small"
          onClick={handleAddItem}
          sx={{
            bgcolor: alpha('#00ED64', 0.1),
            '&:hover': { bgcolor: alpha('#00ED64', 0.2) }
          }}
        >
          <Add fontSize="small" />
        </IconButton>
      </Box>

      {arrayValue.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            textAlign: 'center',
            bgcolor: alpha('#00ED64', 0.05),
            border: '1px dashed',
            borderColor: alpha('#00ED64', 0.3)
          }}
        >
          <Typography variant="caption" color="text.secondary">
            No items. Click the + button to add an item.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {arrayValue.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                value={item || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Try to parse as number if config suggests it
                  if (config.type === 'array' && config.validation) {
                    const numValue = Number(newValue);
                    if (!isNaN(numValue) && newValue !== '') {
                      handleItemChange(index, numValue);
                    } else {
                      handleItemChange(index, newValue);
                    }
                  } else {
                    handleItemChange(index, newValue);
                  }
                }}
                placeholder={`Item ${index + 1}`}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1,
                        px: 1,
                        py: 0.5,
                        bgcolor: alpha('#00ED64', 0.1),
                        borderRadius: 0.5,
                        fontSize: '0.75rem',
                        color: '#00ED64',
                        fontWeight: 600
                      }}
                    >
                      {index + 1}
                    </Box>
                  )
                }}
              />
              <IconButton
                size="small"
                onClick={() => handleRemoveItem(index)}
                color="error"
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

