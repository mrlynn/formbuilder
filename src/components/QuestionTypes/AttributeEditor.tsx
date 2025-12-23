'use client';

/**
 * Attribute Editor Component
 *
 * Dynamically renders the attribute editor for any question type.
 * Uses the attribute schemas from the registry to determine which
 * controls to show and how they behave.
 */

import React, { useMemo } from 'react';
import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Chip,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  DragIndicator,
  HelpOutline,
} from '@mui/icons-material';
import { Question, AttributeSchema, QuestionTypeId } from '@/types/questionTypes';
import { attributeSchemas, getQuestionTypeMetadata } from '@/lib/questionTypes/registry';

// ============================================
// Types
// ============================================

export interface AttributeEditorProps {
  /** The question being edited */
  question: Question;
  /** Callback when attributes change */
  onChange: (attributes: Record<string, any>) => void;
  /** Whether editor is disabled */
  disabled?: boolean;
}

interface AttributeGroupProps {
  group: string;
  label: string;
  schemas: AttributeSchema[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  disabled?: boolean;
  defaultExpanded?: boolean;
}

// ============================================
// Group Labels
// ============================================

const groupLabels: Record<string, string> = {
  basic: 'Basic Settings',
  appearance: 'Appearance',
  validation: 'Validation',
  behavior: 'Behavior',
  advanced: 'Advanced',
};

// ============================================
// Individual Attribute Controls
// ============================================

interface AttributeControlProps {
  schema: AttributeSchema;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  allValues: Record<string, any>;
}

function AttributeControl({
  schema,
  value,
  onChange,
  disabled,
  allValues,
}: AttributeControlProps) {
  // Check conditional visibility
  if (schema.showWhen) {
    const { attribute, operator, value: targetValue } = schema.showWhen;
    const compareValue = allValues[attribute];

    let shouldShow = false;
    switch (operator) {
      case 'equals':
        shouldShow = compareValue === targetValue;
        break;
      case 'notEquals':
        shouldShow = compareValue !== targetValue;
        break;
      case 'contains':
        shouldShow = Array.isArray(compareValue) && compareValue.includes(targetValue);
        break;
      case 'greaterThan':
        shouldShow = compareValue > targetValue;
        break;
      case 'lessThan':
        shouldShow = compareValue < targetValue;
        break;
    }

    if (!shouldShow) return null;
  }

  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  // Render based on control type
  switch (schema.controlType) {
    case 'text_input':
      return (
        <TextField
          fullWidth
          size="small"
          label={schema.label}
          value={value ?? schema.defaultValue ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          helperText={schema.description}
          inputProps={{
            maxLength: schema.validation?.maxLength,
          }}
        />
      );

    case 'number_input':
      return (
        <TextField
          fullWidth
          size="small"
          type="number"
          label={schema.label}
          value={value ?? schema.defaultValue ?? ''}
          onChange={(e) => handleChange(e.target.value === '' ? undefined : Number(e.target.value))}
          disabled={disabled}
          helperText={schema.description}
          inputProps={{
            min: schema.validation?.min,
            max: schema.validation?.max,
          }}
        />
      );

    case 'textarea':
      return (
        <TextField
          fullWidth
          size="small"
          multiline
          rows={3}
          label={schema.label}
          value={value ?? schema.defaultValue ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          helperText={schema.description}
        />
      );

    case 'toggle':
      return (
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value ?? schema.defaultValue)}
                onChange={(e) => handleChange(e.target.checked)}
                disabled={disabled}
                sx={{
                  '& .Mui-checked': {
                    color: '#00ED64',
                  },
                  '& .Mui-checked + .MuiSwitch-track': {
                    bgcolor: alpha('#00ED64', 0.5),
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body2">{schema.label}</Typography>
                {schema.description && (
                  <Typography variant="caption" color="text.secondary">
                    {schema.description}
                  </Typography>
                )}
              </Box>
            }
          />
        </Box>
      );

    case 'dropdown':
      return (
        <FormControl fullWidth size="small">
          <InputLabel>{schema.label}</InputLabel>
          <Select
            value={value ?? schema.defaultValue ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            label={schema.label}
            disabled={disabled}
          >
            {schema.options?.map((opt) => (
              <MenuItem key={String(opt.value)} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {schema.description && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {schema.description}
            </Typography>
          )}
        </FormControl>
      );

    case 'multi_select':
      const multiValue = Array.isArray(value) ? value : (schema.defaultValue || []);
      return (
        <FormControl fullWidth size="small">
          <InputLabel>{schema.label}</InputLabel>
          <Select
            multiple
            value={multiValue}
            onChange={(e) => handleChange(e.target.value)}
            label={schema.label}
            disabled={disabled}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((val) => {
                  const opt = schema.options?.find((o) => o.value === val);
                  return <Chip key={val} label={opt?.label || val} size="small" />;
                })}
              </Box>
            )}
          >
            {schema.options?.map((opt) => (
              <MenuItem key={String(opt.value)} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {schema.description && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {schema.description}
            </Typography>
          )}
        </FormControl>
      );

    case 'slider':
      return (
        <Box sx={{ px: 1 }}>
          <Typography variant="body2" gutterBottom>
            {schema.label}: {value ?? schema.defaultValue}
          </Typography>
          <Slider
            value={value ?? schema.defaultValue ?? 0}
            onChange={(_, newValue) => handleChange(newValue)}
            disabled={disabled}
            min={schema.validation?.min ?? 0}
            max={schema.validation?.max ?? 100}
            valueLabelDisplay="auto"
            sx={{
              color: '#00ED64',
            }}
          />
          {schema.description && (
            <Typography variant="caption" color="text.secondary">
              {schema.description}
            </Typography>
          )}
        </Box>
      );

    case 'color_picker':
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {schema.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component="input"
              type="color"
              value={value ?? schema.defaultValue ?? '#000000'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
              disabled={disabled}
              sx={{
                width: 48,
                height: 32,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                p: 0,
                '&::-webkit-color-swatch-wrapper': {
                  p: 0,
                },
                '&::-webkit-color-swatch': {
                  border: 'none',
                  borderRadius: 1,
                },
              }}
            />
            <TextField
              size="small"
              value={value ?? schema.defaultValue ?? '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              sx={{ flex: 1 }}
            />
          </Box>
          {schema.description && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {schema.description}
            </Typography>
          )}
        </Box>
      );

    case 'option_list_editor':
      return <OptionListEditor value={value} onChange={handleChange} disabled={disabled} />;

    default:
      return (
        <TextField
          fullWidth
          size="small"
          label={schema.label}
          value={String(value ?? schema.defaultValue ?? '')}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          helperText={schema.description}
        />
      );
  }
}

// ============================================
// Option List Editor (for choice questions)
// ============================================

interface OptionListEditorProps {
  value: Array<{ id: string; label: string; value: string }>;
  onChange: (value: any[]) => void;
  disabled?: boolean;
}

function OptionListEditor({ value, onChange, disabled }: OptionListEditorProps) {
  const options = Array.isArray(value) ? value : [];

  const addOption = () => {
    const newId = `opt_${Date.now()}`;
    onChange([
      ...options,
      { id: newId, label: `Option ${options.length + 1}`, value: `option_${options.length + 1}` },
    ]);
  };

  const updateOption = (index: number, field: string, newValue: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: newValue };
    // Auto-generate value from label if it's the label being changed
    if (field === 'label') {
      updated[index].value = newValue.toLowerCase().replace(/\s+/g, '_');
    }
    onChange(updated);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
        Options
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {options.map((option, index) => (
          <Box
            key={option.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              bgcolor: alpha('#000', 0.02),
              borderRadius: 1,
            }}
          >
            <DragIndicator
              sx={{ color: 'text.disabled', cursor: 'grab', fontSize: 18 }}
            />
            <TextField
              size="small"
              value={option.label}
              onChange={(e) => updateOption(index, 'label', e.target.value)}
              disabled={disabled}
              placeholder="Option label"
              sx={{ flex: 1 }}
            />
            <IconButton
              size="small"
              onClick={() => removeOption(index)}
              disabled={disabled || options.length <= 1}
              sx={{ color: 'text.secondary' }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
      <Box
        onClick={addOption}
        sx={{
          mt: 1,
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: disabled ? 'default' : 'pointer',
          color: '#00ED64',
          borderRadius: 1,
          border: '1px dashed',
          borderColor: alpha('#00ED64', 0.3),
          bgcolor: alpha('#00ED64', 0.02),
          '&:hover': {
            bgcolor: alpha('#00ED64', 0.05),
          },
        }}
      >
        <Add fontSize="small" />
        <Typography variant="body2">Add option</Typography>
      </Box>
    </Box>
  );
}

// ============================================
// Attribute Group Component
// ============================================

function AttributeGroup({
  group,
  label,
  schemas,
  values,
  onChange,
  disabled,
  defaultExpanded = false,
}: AttributeGroupProps) {
  if (schemas.length === 0) return null;

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{
        '&:before': { display: 'none' },
        bgcolor: 'transparent',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          px: 0,
          minHeight: 36,
          '& .MuiAccordionSummary-content': { my: 1 },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0, pt: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {schemas
            .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
            .map((schema) => (
              <AttributeControl
                key={schema.name}
                schema={schema}
                value={values[schema.name]}
                onChange={(val) => onChange(schema.name, val)}
                disabled={disabled}
                allValues={values}
              />
            ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

// ============================================
// Main Attribute Editor Component
// ============================================

export function AttributeEditor({
  question,
  onChange,
  disabled,
}: AttributeEditorProps) {
  const metadata = getQuestionTypeMetadata(question.type);
  const schemas = attributeSchemas[question.type] || [];
  const attributes = (question as any).attributes || {};

  // Group schemas by their group property
  const groupedSchemas = useMemo(() => {
    const groups: Record<string, AttributeSchema[]> = {
      basic: [],
      appearance: [],
      validation: [],
      behavior: [],
      advanced: [],
    };

    schemas.forEach((schema) => {
      const group = schema.group || 'basic';
      if (!groups[group]) groups[group] = [];
      groups[group].push(schema);
    });

    return groups;
  }, [schemas]);

  const handleAttributeChange = (name: string, value: any) => {
    onChange({
      ...attributes,
      [name]: value,
    });
  };

  if (schemas.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No configurable attributes for this question type.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {metadata.displayName} Settings
        </Typography>
        <Tooltip title={metadata.description}>
          <HelpOutline sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
        </Tooltip>
      </Box>

      {/* Groups */}
      {Object.entries(groupedSchemas).map(([group, groupSchemas]) => (
        <AttributeGroup
          key={group}
          group={group}
          label={groupLabels[group] || group}
          schemas={groupSchemas}
          values={attributes}
          onChange={handleAttributeChange}
          disabled={disabled}
          defaultExpanded={group === 'basic'}
        />
      ))}
    </Box>
  );
}

export default AttributeEditor;
