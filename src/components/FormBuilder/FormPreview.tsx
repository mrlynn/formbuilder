'use client';

import { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  alpha,
  Divider,
  Collapse,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Slider,
  Radio,
  RadioGroup,
  Button
} from '@mui/material';
import {
  RestartAlt,
  CheckCircle,
  RadioButtonUnchecked,
  Preview
} from '@mui/icons-material';
import { FieldConfig, LayoutFieldType } from '@/types/form';
import { ArrayFieldInput } from './ArrayFieldInput';
import { NestedObjectField } from './NestedObjectField';
import { LookupFieldInput } from './LookupFieldInput';
import { RepeaterField } from './RepeaterField';
import { KeyValueArrayInput } from './KeyValueArrayInput';
import { TagsArrayInput } from './TagsArrayInput';
import { LayoutFieldRenderer } from './LayoutFieldRenderer';
import { EditableFieldWrapper } from './EditableFieldWrapper';
import { evaluateConditionalLogic } from '@/utils/conditionalLogic';
import { evaluateFormula } from '@/utils/computedFields';
import { HelpButton } from '@/components/Help';

// Layout field types that don't have data input
const LAYOUT_FIELD_TYPES: LayoutFieldType[] = ['section-header', 'description', 'divider', 'image', 'spacer'];

// Helper to check if a field is a layout field
const isLayoutField = (config: FieldConfig) => {
  if (config.layout) return true;
  const normalizedType = config.type?.toLowerCase().trim();
  return LAYOUT_FIELD_TYPES.some(lt => lt === normalizedType);
};

// Helper to detect if array is key-value pattern (Attribute Pattern)
function isKeyValueArray(arr: any[]): boolean {
  if (!arr || arr.length === 0) return false;

  // Check first few items to detect pattern
  const sampleItems = arr.slice(0, 3);
  return sampleItems.every(item => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return false;
    const keys = Object.keys(item);
    // Must have exactly 2 keys that look like key/value pairs
    if (keys.length !== 2) return false;
    const hasKeyField = keys.some(k =>
      k.toLowerCase() === 'key' ||
      k.toLowerCase() === 'name' ||
      k.toLowerCase() === 'attribute' ||
      k.toLowerCase() === 'property'
    );
    const hasValueField = keys.some(k =>
      k.toLowerCase() === 'value' ||
      k.toLowerCase() === 'val' ||
      k.toLowerCase() === 'data'
    );
    return hasKeyField && hasValueField;
  });
}

// Helper to detect if array is simple string array (for tags)
function isPrimitiveStringArray(arr: any[]): boolean {
  if (!arr || arr.length === 0) return true; // Empty arrays default to tags
  return arr.every(item => typeof item === 'string');
}

interface FormPreviewProps {
  fieldConfigs: FieldConfig[];
  formData: Record<string, any>;
  onFormDataChange: (path: string, value: any) => void;
  onResetForm?: () => void;
  allFieldConfigs?: FieldConfig[];
  onUpdateFieldConfig?: (path: string, updates: Partial<FieldConfig>) => void;
  onDeleteField?: (path: string) => void;
  onSelectField?: (path: string) => void;
  editableMode?: boolean;
}

export function FormPreview({
  fieldConfigs,
  formData,
  onFormDataChange,
  onResetForm,
  allFieldConfigs = fieldConfigs,
  onUpdateFieldConfig,
  onDeleteField,
  onSelectField,
  editableMode = true,
}: FormPreviewProps) {
  // Calculate form completion stats
  const formStats = useMemo(() => {
    // Get only data fields (not layout fields)
    const dataFields = fieldConfigs.filter(f => !isLayoutField(f));
    const requiredFields = dataFields.filter(f => f.required);

    // Count filled fields
    const getFieldValue = (path: string): any => {
      const keys = path.split('.');
      let value = formData;
      for (const key of keys) {
        if (value && typeof value === 'object') {
          value = value[key];
        } else {
          return undefined;
        }
      }
      return value;
    };

    const isFieldFilled = (config: FieldConfig): boolean => {
      // Computed fields are always "filled"
      if (config.computed) return true;

      const value = getFieldValue(config.path);
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === 'object' && Object.keys(value).length === 0) return false;
      return true;
    };

    const filledFields = dataFields.filter(isFieldFilled);
    const filledRequiredFields = requiredFields.filter(isFieldFilled);

    return {
      totalFields: dataFields.length,
      filledFields: filledFields.length,
      requiredFields: requiredFields.length,
      filledRequiredFields: filledRequiredFields.length,
      completionPercent: dataFields.length > 0
        ? Math.round((filledFields.length / dataFields.length) * 100)
        : 0,
      isComplete: requiredFields.length === filledRequiredFields.length
    };
  }, [fieldConfigs, formData]);

  const getFieldValue = (path: string): any => {
    const keys = path.split('.');
    let value = formData;
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return '';
      }
    }
    return value !== undefined ? value : '';
  };

  const renderField = (config: FieldConfig) => {
    // Handle layout fields (non-data display elements)
    if (isLayoutField(config)) {
      const layoutConfig = config.layout || { type: config.type as LayoutFieldType };
      return <LayoutFieldRenderer layout={layoutConfig} editable />;
    }

    const value = getFieldValue(config.path);

    // Handle computed fields - display as read-only
    if (config.computed) {
      const computedValue = evaluateFormula(config.computed.formula, formData, allFieldConfigs);
      const displayValue = computedValue !== null && computedValue !== undefined
        ? String(computedValue)
        : '';

      return (
        <TextField
          fullWidth
          label={config.label}
          value={displayValue}
          InputProps={{
            readOnly: true,
            sx: {
              bgcolor: alpha('#00ED64', 0.05),
              '& input': { color: '#00ED64', fontWeight: 500 }
            }
          }}
          helperText="Computed field (read-only)"
          size="small"
        />
      );
    }

    // Handle lookup fields (regardless of original type)
    if (config.lookup) {
      return (
        <LookupFieldInput
          config={config}
          value={value}
          onChange={(newValue) => onFormDataChange(config.path, newValue)}
          formData={formData}
        />
      );
    }

    switch (config.type) {
      case 'boolean':
      case 'yes-no':
      case 'yes_no': {
        const yesLabel = config.validation?.yesLabel || 'Yes';
        const noLabel = config.validation?.noLabel || 'No';
        const displayStyle = config.validation?.displayStyle || 'switch';

        // Switch style (default)
        if (displayStyle === 'switch') {
          return (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                {config.label}
                {config.required && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(value)}
                    onChange={(e) => onFormDataChange(config.path, e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00ED64',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00ED64',
                      },
                    }}
                  />
                }
                label={value ? yesLabel : noLabel}
                sx={{ ml: 0 }}
              />
            </Box>
          );
        }

        // Buttons style (Yes/No toggle buttons)
        if (displayStyle === 'buttons') {
          return (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                {config.label}
                {config.required && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={yesLabel}
                  onClick={() => onFormDataChange(config.path, true)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 500,
                    px: 2,
                    bgcolor: value === true ? '#00ED64' : alpha('#00ED64', 0.1),
                    color: value === true ? '#001E2B' : '#00ED64',
                    '&:hover': {
                      bgcolor: value === true ? '#00ED64' : alpha('#00ED64', 0.2),
                    },
                  }}
                />
                <Chip
                  label={noLabel}
                  onClick={() => onFormDataChange(config.path, false)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 500,
                    px: 2,
                    bgcolor: value === false ? '#00ED64' : alpha('#00ED64', 0.1),
                    color: value === false ? '#001E2B' : '#00ED64',
                    '&:hover': {
                      bgcolor: value === false ? '#00ED64' : alpha('#00ED64', 0.2),
                    },
                  }}
                />
              </Box>
            </Box>
          );
        }

        // Checkbox style - use a simple checkbox
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => onFormDataChange(config.path, e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#00ED64',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#00ED64',
                  },
                }}
              />
            }
            label={config.label}
          />
        );
      }

      case 'rating':
      case 'scale':
      case 'number': {
        const minVal = config.validation?.min;
        const maxVal = config.validation?.max;
        const displayStyle = config.validation?.scaleDisplayStyle;
        const step = config.validation?.step || 1;
        const showValue = config.validation?.showValue !== false;
        const lowLabel = config.validation?.lowLabel;
        const highLabel = config.validation?.highLabel;

        // Check if this is a scale/rating field (has min/max defined with reasonable range)
        const isScale = minVal !== undefined && maxVal !== undefined && (maxVal - minVal) <= 100;

        // Slider display style
        if (isScale && displayStyle === 'slider') {
          const currentValue = typeof value === 'number' ? value : minVal;
          return (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                {config.label}
                {config.required && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
              </Typography>
              <Box sx={{ px: 1 }}>
                {/* Labels for endpoints */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {lowLabel || minVal}
                  </Typography>
                  {showValue && (
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#00ED64' }}>
                      {currentValue}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {highLabel || maxVal}
                  </Typography>
                </Box>
                <Slider
                  value={currentValue}
                  min={minVal}
                  max={maxVal}
                  step={step}
                  marks
                  valueLabelDisplay={showValue ? 'auto' : 'off'}
                  onChange={(_, newValue) => onFormDataChange(config.path, newValue as number)}
                  sx={{
                    color: '#00ED64',
                    '& .MuiSlider-thumb': {
                      bgcolor: '#00ED64',
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: `0 0 0 8px ${alpha('#00ED64', 0.16)}`,
                      },
                    },
                    '& .MuiSlider-track': {
                      bgcolor: '#00ED64',
                    },
                    '& .MuiSlider-rail': {
                      bgcolor: alpha('#00ED64', 0.3),
                    },
                    '& .MuiSlider-mark': {
                      bgcolor: alpha('#00ED64', 0.5),
                    },
                    '& .MuiSlider-valueLabel': {
                      bgcolor: '#00ED64',
                      color: '#001E2B',
                    },
                  }}
                />
              </Box>
            </Box>
          );
        }

        // Radio buttons display style
        if (isScale && displayStyle === 'radio') {
          const options = Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i);
          return (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                {config.label}
                {config.required && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
              </Typography>
              {/* Labels for endpoints */}
              {(lowLabel || highLabel) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">{lowLabel}</Typography>
                  <Typography variant="caption" color="text.secondary">{highLabel}</Typography>
                </Box>
              )}
              <RadioGroup
                value={value ?? ''}
                onChange={(e) => onFormDataChange(config.path, Number(e.target.value))}
                sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1 }}
              >
                {options.map((opt) => (
                  <FormControlLabel
                    key={opt}
                    value={opt}
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: alpha('#00ED64', 0.5),
                          '&.Mui-checked': {
                            color: '#00ED64',
                          },
                        }}
                      />
                    }
                    label={opt}
                    sx={{
                      m: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                ))}
              </RadioGroup>
            </Box>
          );
        }

        // Number buttons display style (default for scales)
        if (isScale && (!displayStyle || displayStyle === 'buttons')) {
          const options = Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i);
          return (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                {config.label}
                {config.required && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
              </Typography>
              {/* Labels for endpoints */}
              {(lowLabel || highLabel) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">{lowLabel}</Typography>
                  <Typography variant="caption" color="text.secondary">{highLabel}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {options.map((opt) => (
                  <Button
                    key={opt}
                    variant={value === opt ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => onFormDataChange(config.path, opt)}
                    sx={{
                      minWidth: 40,
                      bgcolor: value === opt ? '#00ED64' : 'transparent',
                      color: value === opt ? '#001E2B' : 'text.primary',
                      borderColor: value === opt ? '#00ED64' : 'divider',
                      '&:hover': {
                        bgcolor: value === opt ? '#00CC55' : alpha('#00ED64', 0.1),
                        borderColor: '#00ED64',
                      },
                    }}
                  >
                    {opt}
                  </Button>
                ))}
              </Box>
            </Box>
          );
        }

        // Default number input
        return (
          <TextField
            fullWidth
            type="number"
            label={config.label}
            placeholder={config.placeholder}
            value={value || ''}
            onChange={(e) => {
              const numValue = e.target.value === '' ? '' : Number(e.target.value);
              onFormDataChange(config.path, numValue);
            }}
            required={config.required}
            inputProps={{
              min: config.validation?.min,
              max: config.validation?.max
            }}
          />
        );
      }

      case 'nps': {
        // NPS (Net Promoter Score) - 0-10 scale with color-coded segments
        const npsColors = {
          detractor: '#ef4444',  // Red (0-6)
          passive: '#f59e0b',    // Orange/Yellow (7-8)
          promoter: '#22c55e',   // Green (9-10)
        };
        const lowLabel = config.validation?.lowLabel || 'Not at all likely';
        const highLabel = config.validation?.highLabel || 'Extremely likely';
        const currentValue = typeof value === 'number' ? value : null;

        const getNPSColor = (score: number) => {
          if (score <= 6) return npsColors.detractor;
          if (score <= 8) return npsColors.passive;
          return npsColors.promoter;
        };

        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              {config.label}
              {config.required && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
            </Typography>
            {/* NPS Scale 0-10 */}
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', mb: 1 }}>
              {Array.from({ length: 11 }, (_, i) => i).map((score) => {
                const isSelected = currentValue === score;
                const scoreColor = getNPSColor(score);
                return (
                  <Button
                    key={score}
                    variant={isSelected ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => onFormDataChange(config.path, score)}
                    sx={{
                      minWidth: 36,
                      fontWeight: 600,
                      bgcolor: isSelected ? scoreColor : 'transparent',
                      color: isSelected ? '#fff' : scoreColor,
                      borderColor: isSelected ? scoreColor : alpha(scoreColor, 0.4),
                      '&:hover': {
                        bgcolor: isSelected ? scoreColor : alpha(scoreColor, 0.1),
                        borderColor: scoreColor,
                      },
                    }}
                  >
                    {score}
                  </Button>
                );
              })}
            </Box>
            {/* Endpoint labels */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
              <Typography variant="caption" sx={{ color: npsColors.detractor, fontWeight: 500 }}>
                {lowLabel}
              </Typography>
              <Typography variant="caption" sx={{ color: npsColors.promoter, fontWeight: 500 }}>
                {highLabel}
              </Typography>
            </Box>
            {/* Category labels */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, px: 0.5 }}>
              <Typography variant="caption" sx={{ color: npsColors.detractor, opacity: 0.7 }}>
                Detractors (0-6)
              </Typography>
              <Typography variant="caption" sx={{ color: npsColors.passive, opacity: 0.7 }}>
                Passives (7-8)
              </Typography>
              <Typography variant="caption" sx={{ color: npsColors.promoter, opacity: 0.7 }}>
                Promoters (9-10)
              </Typography>
            </Box>
          </Box>
        );
      }

      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            label={config.label}
            placeholder={config.placeholder}
            value={value || ''}
            onChange={(e) => onFormDataChange(config.path, e.target.value)}
            required={config.required}
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'email':
        return (
          <TextField
            fullWidth
            type="email"
            label={config.label}
            placeholder={config.placeholder}
            value={value || ''}
            onChange={(e) => onFormDataChange(config.path, e.target.value)}
            required={config.required}
          />
        );

      case 'url':
        return (
          <TextField
            fullWidth
            type="url"
            label={config.label}
            placeholder={config.placeholder}
            value={value || ''}
            onChange={(e) => onFormDataChange(config.path, e.target.value)}
            required={config.required}
          />
        );

      case 'array':
      case 'array-object': {
        const arrayValue = Array.isArray(value) ? value : [];

        // Use RepeaterField if repeater config is enabled
        if (config.repeater?.enabled) {
          return (
            <RepeaterField
              config={config}
              value={arrayValue}
              onChange={(newValue) => onFormDataChange(config.path, newValue)}
              itemSchema={config.repeater.itemSchema}
              minItems={config.repeater.minItems}
              maxItems={config.repeater.maxItems}
              allowDuplication={config.repeater.allowDuplication}
              collapsible={config.repeater.collapsible}
            />
          );
        }

        // Check for array pattern configuration
        const arrayPattern = config.arrayPattern?.pattern;

        // Key-Value pattern (Attribute Pattern)
        if (arrayPattern === 'key-value' || (config.type === 'array-object' && !arrayPattern && isKeyValueArray(arrayValue))) {
          return (
            <KeyValueArrayInput
              label={config.label}
              value={arrayValue}
              onChange={(newValue) => onFormDataChange(config.path, newValue)}
              config={config.arrayPattern}
            />
          );
        }

        // Tags pattern
        if (arrayPattern === 'tags' || (config.type === 'array' && !arrayPattern && isPrimitiveStringArray(arrayValue))) {
          return (
            <TagsArrayInput
              label={config.label}
              value={arrayValue as string[]}
              onChange={(newValue) => onFormDataChange(config.path, newValue)}
              config={config.arrayPattern}
              placeholder={config.placeholder}
            />
          );
        }

        // Default array input
        return (
          <ArrayFieldInput
            config={config}
            value={arrayValue}
            onChange={(newValue) => onFormDataChange(config.path, newValue)}
          />
        );
      }

      case 'object': {
        const objectValue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        return (
          <NestedObjectField
            config={config}
            value={objectValue}
            onChange={(newValue) => onFormDataChange(config.path, newValue)}
            allFieldConfigs={allFieldConfigs}
          />
        );
      }

      default:
        return (
          <TextField
            fullWidth
            label={config.label}
            placeholder={config.placeholder}
            value={value || ''}
            onChange={(e) => onFormDataChange(config.path, e.target.value)}
            required={config.required}
            multiline={config.type === 'string' && (value?.length || 0) > 50}
            rows={config.type === 'string' && (value?.length || 0) > 50 ? 4 : 1}
            inputProps={{
              maxLength: config.validation?.maxLength
            }}
          />
        );
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Enhanced Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Preview sx={{ fontSize: 20, color: '#00ED64' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Form Preview
            </Typography>
            <HelpButton topicId="form-builder" tooltip="Form Preview Help" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Field count chips */}
            {formStats.totalFields > 0 && (
              <>
                <Tooltip title={`${formStats.filledFields} of ${formStats.totalFields} questions answered`}>
                  <Chip
                    icon={formStats.filledFields > 0 ? <CheckCircle sx={{ fontSize: 14 }} /> : <RadioButtonUnchecked sx={{ fontSize: 14 }} />}
                    label={`${formStats.filledFields}/${formStats.totalFields}`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      bgcolor: formStats.filledFields > 0 ? alpha('#00ED64', 0.1) : alpha('#000', 0.05),
                      color: formStats.filledFields > 0 ? '#00ED64' : 'text.secondary',
                      '& .MuiChip-icon': {
                        color: formStats.filledFields > 0 ? '#00ED64' : 'text.disabled'
                      }
                    }}
                  />
                </Tooltip>
                {formStats.requiredFields > 0 && (
                  <Tooltip title={`${formStats.filledRequiredFields} of ${formStats.requiredFields} required questions answered`}>
                    <Chip
                      label={`${formStats.filledRequiredFields}/${formStats.requiredFields} req`}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        bgcolor: formStats.isComplete ? alpha('#00ED64', 0.1) : alpha('#ff9800', 0.1),
                        color: formStats.isComplete ? '#00ED64' : '#ff9800'
                      }}
                    />
                  </Tooltip>
                )}
              </>
            )}
            {/* Reset button */}
            {onResetForm && formStats.filledFields > 0 && (
              <Tooltip title="Reset form">
                <IconButton
                  size="small"
                  onClick={onResetForm}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'error.main',
                      bgcolor: alpha('#f44336', 0.1)
                    }
                  }}
                >
                  <RestartAlt sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Progress bar */}
        {formStats.totalFields > 0 && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {formStats.completionPercent}% complete
              </Typography>
              {formStats.isComplete && formStats.requiredFields > 0 && (
                <Chip
                  icon={<CheckCircle sx={{ fontSize: 12 }} />}
                  label="Ready to submit"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: alpha('#00ED64', 0.15),
                    color: '#00ED64',
                    '& .MuiChip-icon': { color: '#00ED64' }
                  }}
                />
              )}
            </Box>
            <LinearProgress
              variant="determinate"
              value={formStats.completionPercent}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: alpha('#00ED64', 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: formStats.isComplete ? '#00ED64' : '#2196f3',
                  borderRadius: 2
                }
              }}
            />
          </Box>
        )}

        {formStats.totalFields === 0 && (
          <Typography variant="caption" color="text.secondary">
            Add questions to see the form preview
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {fieldConfigs.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: alpha('#00ED64', 0.05),
              border: '1px solid',
              borderColor: alpha('#00ED64', 0.2)
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Add questions to see the form preview
            </Typography>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {fieldConfigs.map((config, index) => {
                const isVisible = evaluateConditionalLogic(
                  config.conditionalLogic,
                  formData
                );

                return (
                  <Collapse key={config.path} in={isVisible} unmountOnExit>
                    <Box>
                      <EditableFieldWrapper
                        config={config}
                        editable={editableMode && Boolean(onUpdateFieldConfig)}
                        onUpdateLabel={
                          onUpdateFieldConfig
                            ? (newLabel) => onUpdateFieldConfig(config.path, { label: newLabel })
                            : undefined
                        }
                        onDelete={
                          onDeleteField
                            ? () => onDeleteField(config.path)
                            : undefined
                        }
                        onOpenSettings={
                          onSelectField
                            ? () => onSelectField(config.path)
                            : undefined
                        }
                      >
                        {renderField(config)}
                      </EditableFieldWrapper>
                      {index < fieldConfigs.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  </Collapse>
                );
              })}
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

