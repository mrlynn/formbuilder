'use client';

import { useState } from 'react';
import { ValidationPatternGenerator } from './ValidationPatternGenerator';
import {
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Chip,
  IconButton,
  Button,
  alpha,
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  DragIndicator,
} from '@mui/icons-material';
import { FieldConfig } from '@/types/form';

interface QuestionTypeAttributeEditorProps {
  config: FieldConfig;
  onUpdate: (updates: Partial<FieldConfig>) => void;
}

// Helper to detect question type from field config
function getQuestionTypeId(config: FieldConfig): string | null {
  const type = config.type?.toLowerCase();

  // Check for special types based on validation or other indicators
  if (type === 'number') {
    // Check if it's a rating or scale based on validation
    if (config.validation?.min !== undefined && config.validation?.max !== undefined) {
      const range = (config.validation.max || 10) - (config.validation.min || 1);
      if (range <= 5) return 'rating';
      if (range <= 10) return 'scale';
    }
    return 'number';
  }

  if (type === 'string') {
    // Could be short text, long text, email, phone, etc.
    if (config.validation?.minLength && config.validation.minLength > 50) return 'long-text';
    return 'short-text';
  }

  if (type === 'boolean' || type === 'yes_no' || type === 'yes-no') return 'yes-no';
  if (type === 'date') return 'date';
  if (type === 'email') return 'email';
  if (type === 'url') return 'url';
  if (type === 'array') return 'checkboxes';
  if (type === 'nps') return 'nps';

  return type;
}

export function QuestionTypeAttributeEditor({
  config,
  onUpdate,
}: QuestionTypeAttributeEditorProps) {
  const [expanded, setExpanded] = useState(true);
  const questionType = getQuestionTypeId(config);

  // Helper to update validation
  const updateValidation = (key: string, value: any) => {
    onUpdate({
      validation: {
        ...config.validation,
        [key]: value,
      },
    });
  };

  // Render nothing if no specific attributes for this type
  if (!questionType) return null;

  // Render type-specific attributes
  const renderAttributes = () => {
    switch (questionType) {
      case 'scale':
      case 'rating':
        const minVal = config.validation?.min ?? 1;
        const maxVal = config.validation?.max ?? (questionType === 'rating' ? 5 : 10);
        const displayStyle = config.validation?.scaleDisplayStyle || 'buttons';

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {questionType === 'rating' ? 'Rating Settings' : 'Scale Settings'}
            </Typography>

            {/* Display Style Selector */}
            <FormControl fullWidth size="small">
              <InputLabel>Display Style</InputLabel>
              <Select
                value={displayStyle}
                label="Display Style"
                onChange={(e) => updateValidation('scaleDisplayStyle', e.target.value)}
              >
                <MenuItem value="buttons">Number Buttons</MenuItem>
                <MenuItem value="slider">Slider</MenuItem>
                <MenuItem value="radio">Radio Buttons</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                type="number"
                label="Minimum Value"
                value={minVal}
                onChange={(e) => updateValidation('min', Number(e.target.value))}
                inputProps={{ min: 0, max: 10 }}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                type="number"
                label="Maximum Value"
                value={maxVal}
                onChange={(e) => updateValidation('max', Number(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
                sx={{ flex: 1 }}
              />
            </Box>

            {/* Slider-specific options */}
            {displayStyle === 'slider' && (
              <>
                <TextField
                  size="small"
                  type="number"
                  label="Step"
                  value={config.validation?.step ?? 1}
                  onChange={(e) => updateValidation('step', Number(e.target.value) || 1)}
                  inputProps={{ min: 0.1, step: 0.1 }}
                  helperText="Increment between values"
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={config.validation?.showValue !== false}
                      onChange={(e) => updateValidation('showValue', e.target.checked)}
                    />
                  }
                  label={<Typography variant="body2">Show Current Value</Typography>}
                />
              </>
            )}

            {/* Labels for scale endpoints */}
            <TextField
              size="small"
              label="Low Label"
              placeholder="e.g., Not at all likely"
              value={config.validation?.lowLabel || ''}
              onChange={(e) => updateValidation('lowLabel', e.target.value)}
              fullWidth
            />
            <TextField
              size="small"
              label="High Label"
              placeholder="e.g., Extremely likely"
              value={config.validation?.highLabel || ''}
              onChange={(e) => updateValidation('highLabel', e.target.value)}
              fullWidth
            />

            {questionType === 'rating' && (
              <FormControl fullWidth size="small">
                <InputLabel>Rating Icon Style</InputLabel>
                <Select
                  value={config.validation?.ratingStyle || 'stars'}
                  label="Rating Icon Style"
                  onChange={(e) => updateValidation('ratingStyle', e.target.value)}
                >
                  <MenuItem value="stars">Stars</MenuItem>
                  <MenuItem value="hearts">Hearts</MenuItem>
                  <MenuItem value="thumbs">Thumbs</MenuItem>
                  <MenuItem value="emojis">Emojis</MenuItem>
                  <MenuItem value="numbers">Numbers</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Preview */}
            <Box sx={{ px: 1, py: 1, bgcolor: alpha('#00ED64', 0.03), borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                Preview ({displayStyle})
              </Typography>

              {displayStyle === 'slider' ? (
                <Box sx={{ px: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {config.validation?.lowLabel || minVal}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {config.validation?.highLabel || maxVal}
                    </Typography>
                  </Box>
                  <Slider
                    value={Math.round((minVal + maxVal) / 2)}
                    min={minVal}
                    max={maxVal}
                    step={config.validation?.step || 1}
                    marks
                    valueLabelDisplay="auto"
                    disabled
                    sx={{
                      color: '#00ED64',
                      '& .MuiSlider-thumb': {
                        bgcolor: '#00ED64',
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
                    }}
                  />
                </Box>
              ) : displayStyle === 'radio' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {Array.from({ length: Math.min(maxVal - minVal + 1, 5) }, (_, i) => minVal + i).map((val) => (
                    <Box key={val} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: val === Math.round((minVal + maxVal) / 2) ? '#00ED64' : 'divider',
                          bgcolor: val === Math.round((minVal + maxVal) / 2) ? '#00ED64' : 'transparent',
                        }}
                      />
                      <Typography variant="caption">{val}</Typography>
                    </Box>
                  ))}
                  {maxVal - minVal > 4 && (
                    <Typography variant="caption" color="text.secondary">... and more</Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i).map((val) => (
                    <Chip
                      key={val}
                      label={val}
                      size="small"
                      sx={{
                        bgcolor: alpha('#00ED64', 0.1),
                        color: '#00ED64',
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        );

      case 'number':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Number Settings
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                type="number"
                label="Minimum"
                value={config.validation?.min ?? ''}
                onChange={(e) => updateValidation('min', e.target.value ? Number(e.target.value) : undefined)}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                type="number"
                label="Maximum"
                value={config.validation?.max ?? ''}
                onChange={(e) => updateValidation('max', e.target.value ? Number(e.target.value) : undefined)}
                sx={{ flex: 1 }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={config.validation?.decimalsAllowed || false}
                  onChange={(e) => updateValidation('decimalsAllowed', e.target.checked)}
                />
              }
              label={<Typography variant="body2">Allow Decimals</Typography>}
            />
          </Box>
        );

      case 'short-text':
      case 'long-text':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Text Settings
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                type="number"
                label="Min Length"
                value={config.validation?.minLength ?? ''}
                onChange={(e) => updateValidation('minLength', e.target.value ? Number(e.target.value) : undefined)}
                inputProps={{ min: 0 }}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                type="number"
                label="Max Length"
                value={config.validation?.maxLength ?? ''}
                onChange={(e) => updateValidation('maxLength', e.target.value ? Number(e.target.value) : undefined)}
                inputProps={{ min: 1 }}
                sx={{ flex: 1 }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                size="small"
                label="Validation Pattern (Regex)"
                value={config.validation?.pattern ?? ''}
                onChange={(e) => updateValidation('pattern', e.target.value || undefined)}
                placeholder="e.g., ^[A-Z].*"
                helperText="Regular expression to validate input"
                fullWidth
              />
              <ValidationPatternGenerator
                field={config}
                onPatternGenerated={(pattern) => {
                  updateValidation('pattern', pattern);
                }}
              />
            </Box>
          </Box>
        );

      case 'date':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Date Settings
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                type="date"
                label="Earliest Date"
                value={config.validation?.minDate ?? ''}
                onChange={(e) => updateValidation('minDate', e.target.value || undefined)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                type="date"
                label="Latest Date"
                value={config.validation?.maxDate ?? ''}
                onChange={(e) => updateValidation('maxDate', e.target.value || undefined)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={config.validation?.allowPastDates !== false}
                  onChange={(e) => updateValidation('allowPastDates', e.target.checked)}
                />
              }
              label={<Typography variant="body2">Allow Past Dates</Typography>}
            />

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={config.validation?.allowFutureDates !== false}
                  onChange={(e) => updateValidation('allowFutureDates', e.target.checked)}
                />
              }
              label={<Typography variant="body2">Allow Future Dates</Typography>}
            />
          </Box>
        );

      case 'yes-no':
        const yesLabel = config.validation?.yesLabel || 'Yes';
        const noLabel = config.validation?.noLabel || 'No';
        const yesNoDisplayStyle = config.validation?.displayStyle || 'switch';

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Yes/No Settings
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Display Style</InputLabel>
              <Select
                value={yesNoDisplayStyle}
                label="Display Style"
                onChange={(e) => updateValidation('displayStyle', e.target.value)}
              >
                <MenuItem value="switch">Toggle Switch</MenuItem>
                <MenuItem value="buttons">Yes/No Buttons</MenuItem>
                <MenuItem value="checkbox">Checkbox</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                label="Yes Label"
                value={yesLabel}
                onChange={(e) => updateValidation('yesLabel', e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="No Label"
                value={noLabel}
                onChange={(e) => updateValidation('noLabel', e.target.value)}
                sx={{ flex: 1 }}
              />
            </Box>

            {/* Preview */}
            <Box sx={{ px: 1, py: 1.5, bgcolor: alpha('#00ED64', 0.03), borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                Preview ({yesNoDisplayStyle})
              </Typography>

              {yesNoDisplayStyle === 'switch' ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 20,
                      borderRadius: 10,
                      bgcolor: '#00ED64',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 2,
                        top: 2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: 'white',
                      }}
                    />
                  </Box>
                  <Typography variant="body2">{yesLabel}</Typography>
                </Box>
              ) : yesNoDisplayStyle === 'buttons' ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={yesLabel}
                    size="small"
                    sx={{
                      bgcolor: '#00ED64',
                      color: '#001E2B',
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    label={noLabel}
                    size="small"
                    sx={{
                      bgcolor: alpha('#00ED64', 0.1),
                      color: '#00ED64',
                      fontWeight: 500,
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      border: '2px solid #00ED64',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'white',
                    }}
                  >
                    <Box sx={{ width: 10, height: 10, bgcolor: '#00ED64', borderRadius: 0.5 }} />
                  </Box>
                  <Typography variant="body2">{yesLabel}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        );

      case 'nps':
        const npsColors = {
          detractor: '#ef4444',
          passive: '#f59e0b',
          promoter: '#22c55e',
        };
        const npsLowLabel = config.validation?.lowLabel || 'Not at all likely';
        const npsHighLabel = config.validation?.highLabel || 'Extremely likely';

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              NPS Settings
            </Typography>

            {/* Endpoint Labels */}
            <TextField
              size="small"
              label="Low Label (0)"
              placeholder="Not at all likely"
              value={npsLowLabel}
              onChange={(e) => updateValidation('lowLabel', e.target.value)}
              fullWidth
            />
            <TextField
              size="small"
              label="High Label (10)"
              placeholder="Extremely likely"
              value={npsHighLabel}
              onChange={(e) => updateValidation('highLabel', e.target.value)}
              fullWidth
            />

            {/* Preview */}
            <Box sx={{ px: 1, py: 1.5, bgcolor: alpha('#00ED64', 0.03), borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                Preview
              </Typography>

              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', mb: 1 }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                  const color = score <= 6 ? npsColors.detractor : score <= 8 ? npsColors.passive : npsColors.promoter;
                  return (
                    <Chip
                      key={score}
                      label={score}
                      size="small"
                      sx={{
                        minWidth: 28,
                        bgcolor: alpha(color, 0.15),
                        color: color,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  );
                })}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5 }}>
                <Typography variant="caption" sx={{ color: npsColors.detractor, fontWeight: 500 }}>
                  {npsLowLabel}
                </Typography>
                <Typography variant="caption" sx={{ color: npsColors.promoter, fontWeight: 500 }}>
                  {npsHighLabel}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 0.5 }}>
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
          </Box>
        );

      default:
        return null;
    }
  };

  const content = renderAttributes();

  if (!content) return null;

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        '&:before': { display: 'none' },
        borderRadius: '8px !important',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          minHeight: 48,
          '& .MuiAccordionSummary-content': { my: 1 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Type-Specific Settings
          </Typography>
          <Chip
            label={questionType}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              bgcolor: alpha('#00ED64', 0.1),
              color: '#00ED64',
            }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {content}
      </AccordionDetails>
    </Accordion>
  );
}
