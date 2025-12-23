'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  IconButton,
  Collapse,
  Paper,
  alpha,
  Button,
  Chip
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Repeat,
  Add,
  Delete,
  Check
} from '@mui/icons-material';
import { FieldConfig, RepeaterConfig, RepeaterItemField } from '@/types/form';

interface RepeaterConfigEditorProps {
  config: FieldConfig;
  onUpdate: (repeaterConfig: RepeaterConfig | undefined) => void;
}

export function RepeaterConfigEditor({
  config,
  onUpdate
}: RepeaterConfigEditorProps) {
  const [expanded, setExpanded] = useState(false);

  // Only show for array types
  if (config.type !== 'array' && config.type !== 'array-object') {
    return null;
  }

  const repeaterConfig: RepeaterConfig = (config as any).repeater || {
    enabled: false,
    minItems: 0,
    maxItems: 100,
    itemSchema: [],
    allowDuplication: true,
    collapsible: true
  };

  const hasRepeater = repeaterConfig.enabled;

  const handleUpdate = (updates: Partial<RepeaterConfig>) => {
    onUpdate({ ...repeaterConfig, ...updates });
  };

  const handleToggle = () => {
    if (hasRepeater) {
      onUpdate(undefined);
    } else {
      onUpdate({ ...repeaterConfig, enabled: true });
    }
  };

  const addSchemaField = () => {
    const newField: RepeaterItemField = {
      name: `field${repeaterConfig.itemSchema.length + 1}`,
      type: 'string',
      label: `Field ${repeaterConfig.itemSchema.length + 1}`
    };
    handleUpdate({
      itemSchema: [...repeaterConfig.itemSchema, newField]
    });
  };

  const updateSchemaField = (index: number, updates: Partial<RepeaterItemField>) => {
    const newSchema = [...repeaterConfig.itemSchema];
    newSchema[index] = { ...newSchema[index], ...updates };
    handleUpdate({ itemSchema: newSchema });
  };

  const removeSchemaField = (index: number) => {
    const newSchema = repeaterConfig.itemSchema.filter((_, i) => i !== index);
    handleUpdate({ itemSchema: newSchema });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          py: 0.5
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Repeat fontSize="small" sx={{ color: hasRepeater ? '#00ED64' : 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Repeater Settings
          </Typography>
          {hasRepeater && (
            <Chip
              label={`${repeaterConfig.itemSchema.length} fields`}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.6rem',
                bgcolor: alpha('#00ED64', 0.1),
                color: '#00ED64'
              }}
            />
          )}
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Paper
          elevation={0}
          sx={{
            mt: 1,
            p: 2,
            bgcolor: alpha('#00ED64', 0.03),
            border: '1px solid',
            borderColor: alpha('#00ED64', 0.15),
            borderRadius: 1
          }}
        >
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={hasRepeater}
                onChange={handleToggle}
              />
            }
            label={
              <Typography variant="caption">
                Enable repeater with schema
              </Typography>
            }
            sx={{ mb: 2 }}
          />

          {hasRepeater && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Min/Max Items */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  size="small"
                  type="number"
                  label="Min Items"
                  value={repeaterConfig.minItems}
                  onChange={(e) => handleUpdate({ minItems: Number(e.target.value) || 0 })}
                  inputProps={{ min: 0 }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Max Items"
                  value={repeaterConfig.maxItems}
                  onChange={(e) => handleUpdate({ maxItems: Number(e.target.value) || 100 })}
                  inputProps={{ min: 1 }}
                  sx={{ flex: 1 }}
                />
              </Box>

              {/* Options */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={repeaterConfig.allowDuplication}
                      onChange={(e) => handleUpdate({ allowDuplication: e.target.checked })}
                    />
                  }
                  label={<Typography variant="caption">Allow Duplicate</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={repeaterConfig.collapsible}
                      onChange={(e) => handleUpdate({ collapsible: e.target.checked })}
                    />
                  }
                  label={<Typography variant="caption">Collapsible Items</Typography>}
                />
              </Box>

              {/* Item Schema */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Item Schema
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={addSchemaField}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Add Field
                  </Button>
                </Box>

                {repeaterConfig.itemSchema.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No schema defined. Items will use dynamic fields.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {repeaterConfig.itemSchema.map((field, index) => (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper'
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <TextField
                            size="small"
                            label="Field Name"
                            value={field.name}
                            onChange={(e) => updateSchemaField(index, { name: e.target.value })}
                            sx={{ flex: 1 }}
                            inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
                          />
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                              value={field.type}
                              label="Type"
                              onChange={(e) =>
                                updateSchemaField(index, {
                                  type: e.target.value as RepeaterItemField['type']
                                })
                              }
                            >
                              <MenuItem value="string">Text</MenuItem>
                              <MenuItem value="number">Number</MenuItem>
                              <MenuItem value="boolean">Boolean</MenuItem>
                              <MenuItem value="date">Date</MenuItem>
                              <MenuItem value="select">Select</MenuItem>
                            </Select>
                          </FormControl>
                          <IconButton
                            size="small"
                            onClick={() => removeSchemaField(index)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            size="small"
                            label="Label"
                            value={field.label}
                            onChange={(e) => updateSchemaField(index, { label: e.target.value })}
                            sx={{ flex: 1 }}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={field.required || false}
                                onChange={(e) =>
                                  updateSchemaField(index, { required: e.target.checked })
                                }
                              />
                            }
                            label={<Typography variant="caption">Required</Typography>}
                          />
                        </Box>

                        {field.type === 'select' && (
                          <TextField
                            size="small"
                            label="Options (comma-separated)"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) =>
                              updateSchemaField(index, {
                                options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                              })
                            }
                            fullWidth
                            sx={{ mt: 1 }}
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
}
