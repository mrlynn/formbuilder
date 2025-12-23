'use client';

/**
 * Multiple Choice Question Renderer
 *
 * Renders a single-select multiple choice question with customizable:
 * - Options list
 * - Layout (vertical, horizontal, grid)
 * - Randomization
 * - "Other" option with text input
 * - Image support
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Paper,
  alpha,
  useTheme,
  Grid,
} from '@mui/material';
import { MultipleChoiceQuestion, ChoiceOption } from '@/types/questionTypes';
import { QuestionRendererProps, registerRenderer, withQuestionWrapper } from '../QuestionRenderer';

// ============================================
// Utility Functions
// ============================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// Multiple Choice Renderer Component
// ============================================

function MultipleChoiceRendererBase({
  question,
  value,
  onChange,
  disabled,
  readOnly,
}: QuestionRendererProps<MultipleChoiceQuestion>) {
  const theme = useTheme();
  const [otherText, setOtherText] = useState('');

  const {
    options = [],
    layout = 'vertical',
    columns = 2,
    randomize = false,
    allowOther = false,
    otherLabel = 'Other',
    showImages = false,
    imageSize = 'medium',
  } = question.attributes;

  // Current value handling
  const currentValue = typeof value === 'string' ? value : '';
  const isOtherSelected = currentValue.startsWith('__other__:');
  const otherValue = isOtherSelected ? currentValue.replace('__other__:', '') : '';

  // Randomize options if enabled (memoized to prevent re-shuffling on each render)
  const displayOptions = useMemo(() => {
    return randomize ? shuffleArray(options) : options;
  }, [options, randomize]);

  // Image size mapping
  const imageSizes = {
    small: 60,
    medium: 100,
    large: 150,
  };
  const imgSize = imageSizes[imageSize];

  const handleChange = (newValue: string) => {
    if (disabled || readOnly) return;
    onChange(newValue);
    if (!newValue.startsWith('__other__:')) {
      setOtherText('');
    }
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    onChange(`__other__:${text}`);
  };

  // Render a single option
  const renderOption = (option: ChoiceOption, isSelected: boolean) => {
    return (
      <Paper
        key={option.id}
        elevation={0}
        onClick={() => handleChange(option.value)}
        sx={{
          p: showImages ? 2 : 1.5,
          cursor: disabled || readOnly ? 'default' : 'pointer',
          border: '1px solid',
          borderColor: isSelected ? '#00ED64' : 'divider',
          bgcolor: isSelected ? alpha('#00ED64', 0.05) : 'transparent',
          borderRadius: 2,
          transition: 'all 0.15s ease',
          display: 'flex',
          flexDirection: showImages ? 'column' : 'row',
          alignItems: showImages ? 'center' : 'flex-start',
          gap: 1,
          '&:hover': {
            borderColor: disabled || readOnly ? 'divider' : '#00ED64',
            bgcolor: disabled || readOnly ? 'transparent' : alpha('#00ED64', 0.05),
          },
        }}
      >
        {/* Image */}
        {showImages && option.imageUrl && (
          <Box
            component="img"
            src={option.imageUrl}
            alt={option.label}
            sx={{
              width: imgSize,
              height: imgSize,
              objectFit: 'cover',
              borderRadius: 1,
            }}
          />
        )}

        {/* Radio and label */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
          <Radio
            checked={isSelected}
            disabled={disabled || readOnly}
            sx={{
              p: 0,
              color: 'text.secondary',
              '&.Mui-checked': {
                color: '#00ED64',
              },
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: isSelected ? 600 : 400,
                color: 'text.primary',
                textAlign: showImages ? 'center' : 'left',
              }}
            >
              {option.label}
            </Typography>
            {option.description && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: 'block',
                  mt: 0.25,
                  textAlign: showImages ? 'center' : 'left',
                }}
              >
                {option.description}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    );
  };

  // Render the "Other" option
  const renderOtherOption = () => {
    if (!allowOther) return null;

    return (
      <Paper
        elevation={0}
        onClick={() => handleChange(`__other__:${otherText}`)}
        sx={{
          p: 1.5,
          cursor: disabled || readOnly ? 'default' : 'pointer',
          border: '1px solid',
          borderColor: isOtherSelected ? '#00ED64' : 'divider',
          bgcolor: isOtherSelected ? alpha('#00ED64', 0.05) : 'transparent',
          borderRadius: 2,
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: disabled || readOnly ? 'divider' : '#00ED64',
            bgcolor: disabled || readOnly ? 'transparent' : alpha('#00ED64', 0.05),
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Radio
            checked={isOtherSelected}
            disabled={disabled || readOnly}
            sx={{
              p: 0,
              color: 'text.secondary',
              '&.Mui-checked': {
                color: '#00ED64',
              },
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: isOtherSelected ? 600 : 400, mb: 1 }}>
              {otherLabel}
            </Typography>
            {isOtherSelected && (
              <TextField
                size="small"
                fullWidth
                value={otherValue || otherText}
                onChange={(e) => handleOtherTextChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                disabled={disabled || readOnly}
                placeholder="Please specify..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#00ED64',
                    },
                  },
                }}
              />
            )}
          </Box>
        </Box>
      </Paper>
    );
  };

  // Layout rendering
  const renderVerticalLayout = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {displayOptions.map((option) => renderOption(option, currentValue === option.value))}
      {renderOtherOption()}
    </Box>
  );

  const renderHorizontalLayout = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {displayOptions.map((option) => (
        <Box key={option.id} sx={{ flex: showImages ? 'none' : '1 1 auto' }}>
          {renderOption(option, currentValue === option.value)}
        </Box>
      ))}
      {allowOther && <Box sx={{ flex: '1 1 auto' }}>{renderOtherOption()}</Box>}
    </Box>
  );

  const renderGridLayout = () => (
    <Grid container spacing={1}>
      {displayOptions.map((option) => (
        <Grid item xs={12} sm={12 / columns} key={option.id}>
          {renderOption(option, currentValue === option.value)}
        </Grid>
      ))}
      {allowOther && (
        <Grid item xs={12} sm={12 / columns}>
          {renderOtherOption()}
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box sx={{ py: 1 }}>
      {layout === 'vertical' && renderVerticalLayout()}
      {layout === 'horizontal' && renderHorizontalLayout()}
      {layout === 'grid' && renderGridLayout()}
    </Box>
  );
}

// Wrap with common question wrapper and register
const MultipleChoiceRenderer = withQuestionWrapper(MultipleChoiceRendererBase);
registerRenderer('multiple_choice', MultipleChoiceRenderer);

export { MultipleChoiceRenderer };
export default MultipleChoiceRenderer;
