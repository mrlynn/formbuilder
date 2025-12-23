'use client';

/**
 * Scale Question Renderer
 *
 * Renders a linear scale question with customizable:
 * - Min/max values
 * - Step increments
 * - Low/high/middle labels
 * - Display styles (buttons, slider, radio)
 * - Value labels
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Radio,
  RadioGroup,
  FormControlLabel,
  Slider,
  alpha,
  useTheme,
} from '@mui/material';
import { ScaleQuestion } from '@/types/questionTypes';
import { QuestionRendererProps, registerRenderer, withQuestionWrapper } from '../QuestionRenderer';

// ============================================
// Scale Renderer Component
// ============================================

function ScaleRendererBase({
  question,
  value,
  onChange,
  disabled,
  readOnly,
}: QuestionRendererProps<ScaleQuestion>) {
  const theme = useTheme();
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const {
    minValue = 1,
    maxValue = 10,
    step = 1,
    lowLabel = '',
    highLabel = '',
    middleLabel = '',
    showValueLabels = true,
    valueLabels = {},
    displayStyle = 'buttons',
  } = question.attributes;

  const currentValue = typeof value === 'number' ? value : null;

  // Generate scale values
  const scaleValues = useMemo(() => {
    const values: number[] = [];
    for (let i = minValue; i <= maxValue; i += step) {
      values.push(i);
    }
    return values;
  }, [minValue, maxValue, step]);

  const middleIndex = Math.floor(scaleValues.length / 2);

  const handleChange = (newValue: number) => {
    if (disabled || readOnly) return;
    onChange(newValue);
  };

  // Render button-style scale
  const renderButtonScale = () => {
    return (
      <Box sx={{ width: '100%' }}>
        {/* Scale buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 0.5,
            mb: 1,
          }}
        >
          {scaleValues.map((val, index) => {
            const isSelected = currentValue === val;
            const isHovered = hoverValue === val;

            return (
              <Button
                key={val}
                variant={isSelected ? 'contained' : 'outlined'}
                size="small"
                disabled={disabled}
                onClick={() => handleChange(val)}
                onMouseEnter={() => setHoverValue(val)}
                onMouseLeave={() => setHoverValue(null)}
                sx={{
                  minWidth: 40,
                  height: 40,
                  borderRadius: 1,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  bgcolor: isSelected
                    ? '#00ED64'
                    : isHovered
                      ? alpha('#00ED64', 0.1)
                      : 'transparent',
                  borderColor: isSelected || isHovered ? '#00ED64' : 'divider',
                  color: isSelected ? '#001E2B' : 'text.primary',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: isSelected ? '#00ED64' : alpha('#00ED64', 0.15),
                    borderColor: '#00ED64',
                  },
                  '&.Mui-disabled': {
                    bgcolor: isSelected ? alpha('#00ED64', 0.5) : 'transparent',
                    color: isSelected ? '#001E2B' : 'text.disabled',
                  },
                }}
              >
                {val}
              </Button>
            );
          })}
        </Box>

        {/* Labels */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            px: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              maxWidth: '30%',
              textAlign: 'left',
            }}
          >
            {lowLabel}
          </Typography>
          {middleLabel && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                maxWidth: '30%',
                textAlign: 'center',
              }}
            >
              {middleLabel}
            </Typography>
          )}
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              maxWidth: '30%',
              textAlign: 'right',
            }}
          >
            {highLabel}
          </Typography>
        </Box>

        {/* Value labels */}
        {showValueLabels && valueLabels && Object.keys(valueLabels).length > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 1,
            }}
          >
            {currentValue !== null && valueLabels[currentValue] && (
              <Typography
                variant="body2"
                sx={{
                  color: '#00ED64',
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                {valueLabels[currentValue]}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Render slider-style scale
  const renderSliderScale = () => {
    const marks = scaleValues.map((val) => ({
      value: val,
      label: showValueLabels ? String(val) : undefined,
    }));

    return (
      <Box sx={{ px: 2, py: 1 }}>
        <Slider
          value={currentValue ?? minValue}
          onChange={(_, newValue) => handleChange(newValue as number)}
          disabled={disabled || readOnly}
          min={minValue}
          max={maxValue}
          step={step}
          marks={marks}
          valueLabelDisplay="auto"
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
              bgcolor: alpha('#00ED64', 0.2),
            },
            '& .MuiSlider-mark': {
              bgcolor: alpha('#00ED64', 0.5),
            },
            '& .MuiSlider-markActive': {
              bgcolor: '#fff',
            },
            '& .MuiSlider-markLabel': {
              fontSize: '0.75rem',
              color: 'text.secondary',
            },
            '& .MuiSlider-valueLabel': {
              bgcolor: '#00ED64',
              color: '#001E2B',
            },
          }}
        />

        {/* Labels */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {lowLabel}
          </Typography>
          {middleLabel && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {middleLabel}
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {highLabel}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Render radio-style scale
  const renderRadioScale = () => {
    return (
      <Box>
        <RadioGroup
          value={currentValue?.toString() ?? ''}
          onChange={(e) => handleChange(Number(e.target.value))}
          sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}
        >
          {scaleValues.map((val) => (
            <FormControlLabel
              key={val}
              value={val.toString()}
              disabled={disabled || readOnly}
              control={
                <Radio
                  sx={{
                    color: 'text.secondary',
                    '&.Mui-checked': {
                      color: '#00ED64',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {val}
                </Typography>
              }
              sx={{
                m: 0,
                p: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: currentValue === val ? '#00ED64' : 'divider',
                bgcolor: currentValue === val ? alpha('#00ED64', 0.05) : 'transparent',
                '&:hover': {
                  bgcolor: alpha('#00ED64', 0.05),
                },
              }}
            />
          ))}
        </RadioGroup>

        {/* Labels */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: 1,
            px: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {lowLabel}
          </Typography>
          {middleLabel && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {middleLabel}
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {highLabel}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ py: 1 }}>
      {displayStyle === 'buttons' && renderButtonScale()}
      {displayStyle === 'slider' && renderSliderScale()}
      {displayStyle === 'radio' && renderRadioScale()}
    </Box>
  );
}

// Wrap with common question wrapper and register
const ScaleRenderer = withQuestionWrapper(ScaleRendererBase);
registerRenderer('scale', ScaleRenderer);

export { ScaleRenderer };
export default ScaleRenderer;
