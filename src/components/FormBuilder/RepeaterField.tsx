'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  alpha,
  Collapse,
  Divider,
  Button,
  Tooltip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add,
  Delete,
  ExpandMore,
  ExpandLess,
  DragIndicator,
  ContentCopy
} from '@mui/icons-material';
import { FieldConfig, RepeaterItemField } from '@/types/form';

interface RepeaterFieldProps {
  config: FieldConfig;
  value: any[];
  onChange: (value: any[]) => void;
  itemSchema?: RepeaterItemField[];
  minItems?: number;
  maxItems?: number;
  allowDuplication?: boolean;
  collapsible?: boolean;
}

export function RepeaterField({
  config,
  value,
  onChange,
  itemSchema = [],
  minItems = 0,
  maxItems = 100,
  allowDuplication = true,
  collapsible = true
}: RepeaterFieldProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const arrayValue = Array.isArray(value) ? value : [];

  // Create a default item based on schema
  const createDefaultItem = (): Record<string, any> => {
    const item: Record<string, any> = {};

    if (itemSchema.length > 0) {
      itemSchema.forEach((field) => {
        switch (field.type) {
          case 'boolean':
            item[field.name] = false;
            break;
          case 'number':
            item[field.name] = 0;
            break;
          default:
            item[field.name] = '';
        }
      });
    }

    return item;
  };

  const handleAddItem = () => {
    if (arrayValue.length >= maxItems) return;
    const newItem = createDefaultItem();
    onChange([...arrayValue, newItem]);
    // Expand the newly added item
    setExpandedItems((prev) => ({ ...prev, [arrayValue.length]: true }));
  };

  const handleRemoveItem = (index: number) => {
    if (arrayValue.length <= minItems) return;
    const newValue = arrayValue.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleDuplicateItem = (index: number) => {
    if (arrayValue.length >= maxItems || !allowDuplication) return;
    const duplicatedItem = JSON.parse(JSON.stringify(arrayValue[index]));
    const newValue = [...arrayValue];
    newValue.splice(index + 1, 0, duplicatedItem);
    onChange(newValue);
    setExpandedItems((prev) => ({ ...prev, [index + 1]: true }));
  };

  const handleFieldChange = (index: number, fieldName: string, fieldValue: any) => {
    const newValue = [...arrayValue];
    if (!newValue[index]) {
      newValue[index] = {};
    }
    newValue[index] = { ...newValue[index], [fieldName]: fieldValue };
    onChange(newValue);
  };

  const toggleExpanded = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderFieldInput = (
    field: RepeaterItemField,
    index: number,
    itemValue: Record<string, any>
  ) => {
    const fieldValue = itemValue[field.name];

    switch (field.type) {
      case 'boolean':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Switch
                size="small"
                checked={Boolean(fieldValue)}
                onChange={(e) => handleFieldChange(index, field.name, e.target.checked)}
              />
            }
            label={field.label}
          />
        );

      case 'number':
        return (
          <TextField
            key={field.name}
            size="small"
            type="number"
            label={field.label}
            value={fieldValue ?? ''}
            onChange={(e) => {
              const numValue = e.target.value === '' ? '' : Number(e.target.value);
              handleFieldChange(index, field.name, numValue);
            }}
            required={field.required}
            placeholder={field.placeholder}
            fullWidth
          />
        );

      case 'date':
        return (
          <TextField
            key={field.name}
            size="small"
            type="date"
            label={field.label}
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(index, field.name, e.target.value)}
            required={field.required}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        );

      case 'select':
        return (
          <FormControl key={field.name} size="small" fullWidth>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={fieldValue || ''}
              label={field.label}
              onChange={(e) => handleFieldChange(index, field.name, e.target.value)}
              required={field.required}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      default:
        return (
          <TextField
            key={field.name}
            size="small"
            label={field.label}
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(index, field.name, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            fullWidth
          />
        );
    }
  };

  const renderItem = (item: Record<string, any>, index: number) => {
    const isExpanded = expandedItems[index] !== false; // Default to expanded

    // Generate item summary for collapsed state
    const itemSummary = itemSchema.length > 0
      ? itemSchema
          .slice(0, 2)
          .map((f) => item[f.name])
          .filter(Boolean)
          .join(' - ') || `Item ${index + 1}`
      : `Item ${index + 1}`;

    return (
      <Paper
        key={index}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden'
        }}
      >
        {/* Item Header */}
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            bgcolor: alpha('#00ED64', 0.03),
            borderBottom: isExpanded ? '1px solid' : 'none',
            borderColor: 'divider',
            cursor: collapsible ? 'pointer' : 'default'
          }}
          onClick={() => collapsible && toggleExpanded(index)}
        >
          <DragIndicator
            fontSize="small"
            sx={{ mr: 1, color: 'text.disabled', cursor: 'grab' }}
          />

          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: alpha('#00ED64', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#00ED64'
            }}
          >
            {index + 1}
          </Box>

          <Typography
            variant="body2"
            sx={{
              flex: 1,
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {itemSummary}
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {allowDuplication && arrayValue.length < maxItems && (
              <Tooltip title="Duplicate item">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateItem(index);
                  }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {arrayValue.length > minItems && (
              <Tooltip title="Remove item">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(index);
                  }}
                  color="error"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {collapsible && (
              <IconButton size="small">
                {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Item Content */}
        <Collapse in={isExpanded}>
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {itemSchema.length > 0 ? (
              itemSchema.map((field) => renderFieldInput(field, index, item))
            ) : (
              // Fallback: render object keys as text fields
              <>
                {Object.keys(item).map((key) => (
                  <TextField
                    key={key}
                    size="small"
                    label={key}
                    value={item[key] ?? ''}
                    onChange={(e) => handleFieldChange(index, key, e.target.value)}
                    fullWidth
                  />
                ))}
                <TextField
                  size="small"
                  placeholder="Add new field (press Enter)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      const fieldName = input.value.trim();
                      if (fieldName && !item[fieldName]) {
                        handleFieldChange(index, fieldName, '');
                        input.value = '';
                      }
                    }
                  }}
                  fullWidth
                  sx={{ mt: 1 }}
                />
              </>
            )}
          </Box>
        </Collapse>
      </Paper>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {config.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {arrayValue.length} of {maxItems} items
            {minItems > 0 && ` (min: ${minItems})`}
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Add />}
          onClick={handleAddItem}
          disabled={arrayValue.length >= maxItems}
          sx={{
            borderColor: alpha('#00ED64', 0.5),
            color: '#00ED64',
            '&:hover': {
              borderColor: '#00ED64',
              bgcolor: alpha('#00ED64', 0.05)
            }
          }}
        >
          Add Item
        </Button>
      </Box>

      {/* Items */}
      {arrayValue.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            textAlign: 'center',
            bgcolor: alpha('#00ED64', 0.03),
            border: '2px dashed',
            borderColor: alpha('#00ED64', 0.2),
            borderRadius: 1
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            No items yet
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddItem}
            sx={{
              bgcolor: '#00ED64',
              '&:hover': { bgcolor: '#00CC55' }
            }}
          >
            Add First Item
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {arrayValue.map((item, index) => renderItem(item || {}, index))}
        </Box>
      )}
    </Box>
  );
}
