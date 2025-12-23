'use client';

/**
 * NPS (Net Promoter Score) Question Renderer
 *
 * Renders a Net Promoter Score question with:
 * - 0-10 scale with buttons
 * - Color-coded segments (Detractors: 0-6, Passives: 7-8, Promoters: 9-10)
 * - Category labels
 * - Optional follow-up questions
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  alpha,
  Collapse,
  TextField,
} from '@mui/material';
import { NpsQuestion } from '@/types/questionTypes';
import { QuestionRendererProps, registerRenderer, withQuestionWrapper } from '../QuestionRenderer';

// NPS Colors following standard conventions
const NPS_COLORS = {
  detractor: '#ef4444',  // Red (0-6)
  passive: '#f59e0b',    // Orange/Yellow (7-8)
  promoter: '#22c55e',   // Green (9-10)
};

// Get NPS category for a score
function getNPSCategory(score: number | null): 'detractor' | 'passive' | 'promoter' | null {
  if (score === null || score === undefined) return null;
  if (score <= 6) return 'detractor';
  if (score <= 8) return 'passive';
  return 'promoter';
}

// Get color for a specific score
function getScoreColor(score: number, selectedScore: number | null, isHovered: boolean): string {
  const category = getNPSCategory(score);
  const isSelected = selectedScore === score;

  if (!category) return 'text.secondary';

  if (isSelected) {
    return NPS_COLORS[category];
  }

  if (isHovered) {
    return alpha(NPS_COLORS[category], 0.7);
  }

  return 'text.secondary';
}

// ============================================
// NPS Renderer Component
// ============================================

function NPSRendererBase({
  question,
  value,
  onChange,
  disabled,
  readOnly,
}: QuestionRendererProps<NpsQuestion>) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [followUpResponse, setFollowUpResponse] = useState<string>('');

  const {
    detractorLabel = 'Not at all likely',
    passiveLabel = '',
    promoterLabel = 'Extremely likely',
    showCategoryLabels = true,
    showExplanation = false,
    detractorFollowUp,
    promoterFollowUp,
    useColorCoding = true,
  } = question.attributes || {};

  const currentValue = typeof value === 'number' ? value : null;
  const currentCategory = getNPSCategory(currentValue);

  // Generate scale values 0-10
  const scaleValues = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => i);
  }, []);

  const handleChange = (newValue: number) => {
    if (disabled || readOnly) return;
    onChange(newValue);
    setFollowUpResponse(''); // Reset follow-up when score changes
  };

  // Determine if we should show a follow-up question
  const showFollowUp = useMemo(() => {
    if (currentValue === null) return false;
    if (currentCategory === 'detractor' && detractorFollowUp) return true;
    if (currentCategory === 'promoter' && promoterFollowUp) return true;
    return false;
  }, [currentValue, currentCategory, detractorFollowUp, promoterFollowUp]);

  const followUpQuestion = useMemo(() => {
    if (currentCategory === 'detractor') return detractorFollowUp;
    if (currentCategory === 'promoter') return promoterFollowUp;
    return null;
  }, [currentCategory, detractorFollowUp, promoterFollowUp]);

  return (
    <Box sx={{ py: 1 }}>
      {/* Score buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 0.5,
          mb: 1,
        }}
      >
        {scaleValues.map((score) => {
          const isSelected = currentValue === score;
          const isHovered = hoverValue === score;
          const category = getNPSCategory(score);
          const categoryColor = category ? NPS_COLORS[category] : '#9ca3af';

          return (
            <Button
              key={score}
              variant={isSelected ? 'contained' : 'outlined'}
              size="small"
              disabled={disabled}
              onClick={() => handleChange(score)}
              onMouseEnter={() => setHoverValue(score)}
              onMouseLeave={() => setHoverValue(null)}
              sx={{
                minWidth: { xs: 28, sm: 36, md: 40 },
                height: { xs: 36, sm: 40 },
                borderRadius: 1,
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                p: 0,
                bgcolor: isSelected
                  ? useColorCoding ? categoryColor : '#00ED64'
                  : isHovered && useColorCoding
                    ? alpha(categoryColor, 0.1)
                    : 'transparent',
                borderColor: isSelected || isHovered
                  ? useColorCoding ? categoryColor : '#00ED64'
                  : 'divider',
                color: isSelected
                  ? '#fff'
                  : isHovered && useColorCoding
                    ? categoryColor
                    : 'text.primary',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: isSelected
                    ? useColorCoding ? categoryColor : '#00ED64'
                    : useColorCoding
                      ? alpha(categoryColor, 0.15)
                      : alpha('#00ED64', 0.15),
                  borderColor: useColorCoding ? categoryColor : '#00ED64',
                },
                '&.Mui-disabled': {
                  bgcolor: isSelected
                    ? alpha(useColorCoding ? categoryColor : '#00ED64', 0.5)
                    : 'transparent',
                  color: isSelected ? '#fff' : 'text.disabled',
                },
              }}
            >
              {score}
            </Button>
          );
        })}
      </Box>

      {/* Endpoint labels */}
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
            color: useColorCoding ? NPS_COLORS.detractor : 'text.secondary',
            maxWidth: '35%',
            textAlign: 'left',
            fontWeight: 500,
          }}
        >
          {detractorLabel}
        </Typography>
        {passiveLabel && (
          <Typography
            variant="caption"
            sx={{
              color: useColorCoding ? NPS_COLORS.passive : 'text.secondary',
              maxWidth: '30%',
              textAlign: 'center',
            }}
          >
            {passiveLabel}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{
            color: useColorCoding ? NPS_COLORS.promoter : 'text.secondary',
            maxWidth: '35%',
            textAlign: 'right',
            fontWeight: 500,
          }}
        >
          {promoterLabel}
        </Typography>
      </Box>

      {/* Category labels */}
      {showCategoryLabels && useColorCoding && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: 2,
            px: 0.5,
          }}
        >
          <Box
            sx={{
              flex: '0 0 63.6%', // 7/11 of the scale
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: NPS_COLORS.detractor,
                fontWeight: 500,
                opacity: currentCategory === 'detractor' ? 1 : 0.5,
              }}
            >
              Detractors (0-6)
            </Typography>
          </Box>
          <Box
            sx={{
              flex: '0 0 18.2%', // 2/11 of the scale
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: NPS_COLORS.passive,
                fontWeight: 500,
                opacity: currentCategory === 'passive' ? 1 : 0.5,
              }}
            >
              Passives (7-8)
            </Typography>
          </Box>
          <Box
            sx={{
              flex: '0 0 18.2%', // 2/11 of the scale
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: NPS_COLORS.promoter,
                fontWeight: 500,
                opacity: currentCategory === 'promoter' ? 1 : 0.5,
              }}
            >
              Promoters (9-10)
            </Typography>
          </Box>
        </Box>
      )}

      {/* Selected category indicator */}
      {currentValue !== null && showExplanation && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor: alpha(
              currentCategory === 'detractor'
                ? NPS_COLORS.detractor
                : currentCategory === 'passive'
                  ? NPS_COLORS.passive
                  : NPS_COLORS.promoter,
              0.1
            ),
            border: '1px solid',
            borderColor: alpha(
              currentCategory === 'detractor'
                ? NPS_COLORS.detractor
                : currentCategory === 'passive'
                  ? NPS_COLORS.passive
                  : NPS_COLORS.promoter,
              0.3
            ),
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: currentCategory === 'detractor'
                ? NPS_COLORS.detractor
                : currentCategory === 'passive'
                  ? NPS_COLORS.passive
                  : NPS_COLORS.promoter,
            }}
          >
            {currentCategory === 'detractor' && 'Thank you for your feedback. We\'d love to understand how we can improve.'}
            {currentCategory === 'passive' && 'Thank you for your response. We appreciate your feedback.'}
            {currentCategory === 'promoter' && 'Thank you! We\'re glad you\'re having a great experience.'}
          </Typography>
        </Box>
      )}

      {/* Follow-up question */}
      <Collapse in={showFollowUp}>
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, mb: 1 }}
          >
            {followUpQuestion}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={followUpResponse}
            onChange={(e) => setFollowUpResponse(e.target.value)}
            disabled={disabled || readOnly}
            placeholder="Your feedback helps us improve..."
            size="small"
          />
        </Box>
      </Collapse>
    </Box>
  );
}

// Wrap with common question wrapper and register
const NPSRenderer = withQuestionWrapper(NPSRendererBase);
registerRenderer('nps', NPSRenderer);

export { NPSRenderer };
export default NPSRenderer;
