'use client';

/**
 * Rating Question Renderer
 *
 * Renders a rating question with customizable:
 * - Icon types (stars, hearts, thumbs, emojis, numbers)
 * - Maximum rating
 * - Half ratings
 * - Colors and sizes
 * - Labels for each value
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Star,
  StarBorder,
  StarHalf,
  Favorite,
  FavoriteBorder,
  ThumbUp,
  ThumbUpOutlined,
} from '@mui/icons-material';
import { RatingQuestion } from '@/types/questionTypes';
import { QuestionRendererProps, registerRenderer, withQuestionWrapper } from '../QuestionRenderer';

// ============================================
// Icon Sets
// ============================================

const iconSets = {
  star: {
    filled: Star,
    empty: StarBorder,
    half: StarHalf,
  },
  heart: {
    filled: Favorite,
    empty: FavoriteBorder,
    half: Favorite, // No half heart, use filled with opacity
  },
  thumb: {
    filled: ThumbUp,
    empty: ThumbUpOutlined,
    half: ThumbUp,
  },
};

const emojiSets = ['😢', '😕', '😐', '🙂', '😄', '🤩', '🥳', '😍', '🌟', '💯'];

const sizeMap = {
  small: 24,
  medium: 32,
  large: 48,
};

// ============================================
// Rating Renderer Component
// ============================================

function RatingRendererBase({
  question,
  value,
  onChange,
  disabled,
  readOnly,
}: QuestionRendererProps<RatingQuestion>) {
  const theme = useTheme();
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const {
    maxRating = 5,
    iconType = 'star',
    iconSize = 'medium',
    allowHalf = false,
    showLabels = false,
    labels = {},
    showHoverPreview = true,
    activeColor = '#FFD700',
    inactiveColor = '#E0E0E0',
  } = question.attributes;

  const currentValue = typeof value === 'number' ? value : 0;
  const displayValue = showHoverPreview && hoverValue !== null ? hoverValue : currentValue;
  const size = sizeMap[iconSize];

  // Generate rating items
  const ratingItems = useMemo(() => {
    const items: number[] = [];
    for (let i = 1; i <= maxRating; i++) {
      items.push(i);
    }
    return items;
  }, [maxRating]);

  const handleClick = (rating: number, isHalf: boolean = false) => {
    if (disabled || readOnly) return;
    const newValue = isHalf && allowHalf ? rating - 0.5 : rating;
    onChange(newValue === currentValue ? 0 : newValue);
  };

  const handleMouseEnter = (rating: number, isHalf: boolean = false) => {
    if (disabled || readOnly || !showHoverPreview) return;
    setHoverValue(isHalf && allowHalf ? rating - 0.5 : rating);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  // Render icon-based rating (star, heart, thumb)
  const renderIconRating = () => {
    const IconSet = iconSets[iconType as keyof typeof iconSets] || iconSets.star;
    const FilledIcon = IconSet.filled;
    const EmptyIcon = IconSet.empty;
    const HalfIcon = IconSet.half;

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
        onMouseLeave={handleMouseLeave}
      >
        {ratingItems.map((rating) => {
          const isFilled = displayValue >= rating;
          const isHalfFilled = allowHalf && displayValue === rating - 0.5;

          return (
            <Box
              key={rating}
              sx={{
                position: 'relative',
                cursor: disabled || readOnly ? 'default' : 'pointer',
              }}
            >
              {/* Half rating click area */}
              {allowHalf && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '50%',
                    height: '100%',
                    zIndex: 1,
                  }}
                  onClick={() => handleClick(rating, true)}
                  onMouseEnter={() => handleMouseEnter(rating, true)}
                />
              )}

              {/* Full rating click area */}
              <Box
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  width: allowHalf ? '50%' : '100%',
                  height: '100%',
                  zIndex: 1,
                }}
                onClick={() => handleClick(rating)}
                onMouseEnter={() => handleMouseEnter(rating)}
              />

              {/* Icon */}
              <Box
                sx={{
                  transition: 'transform 0.1s ease, color 0.15s ease',
                  transform: hoverValue === rating || hoverValue === rating - 0.5 ? 'scale(1.2)' : 'scale(1)',
                  display: 'flex',
                }}
              >
                {isHalfFilled ? (
                  <Box sx={{ position: 'relative', display: 'flex' }}>
                    <EmptyIcon sx={{ fontSize: size, color: inactiveColor }} />
                    <Box
                      sx={{
                        position: 'absolute',
                        overflow: 'hidden',
                        width: '50%',
                      }}
                    >
                      <FilledIcon sx={{ fontSize: size, color: activeColor }} />
                    </Box>
                  </Box>
                ) : isFilled ? (
                  <FilledIcon sx={{ fontSize: size, color: activeColor }} />
                ) : (
                  <EmptyIcon sx={{ fontSize: size, color: inactiveColor }} />
                )}
              </Box>
            </Box>
          );
        })}

        {/* Value display */}
        <Typography
          variant="body2"
          sx={{
            ml: 1,
            color: 'text.secondary',
            minWidth: 40,
            fontWeight: 500,
          }}
        >
          {displayValue > 0 ? `${displayValue}/${maxRating}` : ''}
        </Typography>
      </Box>
    );
  };

  // Render emoji rating
  const renderEmojiRating = () => {
    const emojis = emojiSets.slice(0, maxRating);

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
        onMouseLeave={handleMouseLeave}
      >
        {emojis.map((emoji, index) => {
          const rating = index + 1;
          const isSelected = displayValue >= rating;

          return (
            <Tooltip
              key={rating}
              title={labels[rating] || `${rating} of ${maxRating}`}
              placement="top"
            >
              <Box
                onClick={() => handleClick(rating)}
                onMouseEnter={() => handleMouseEnter(rating)}
                sx={{
                  fontSize: size,
                  cursor: disabled || readOnly ? 'default' : 'pointer',
                  opacity: isSelected ? 1 : 0.3,
                  transform: hoverValue === rating ? 'scale(1.3)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  filter: isSelected ? 'none' : 'grayscale(100%)',
                  '&:hover': {
                    opacity: 1,
                    filter: 'none',
                  },
                }}
              >
                {emoji}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    );
  };

  // Render number rating
  const renderNumberRating = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
        onMouseLeave={handleMouseLeave}
      >
        {ratingItems.map((rating) => {
          const isSelected = displayValue >= rating;

          return (
            <Tooltip
              key={rating}
              title={labels[rating] || ''}
              placement="top"
              disableHoverListener={!labels[rating]}
            >
              <Box
                onClick={() => handleClick(rating)}
                onMouseEnter={() => handleMouseEnter(rating)}
                sx={{
                  width: size,
                  height: size,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: isSelected ? activeColor : alpha(inactiveColor, 0.2),
                  color: isSelected ? '#000' : 'text.secondary',
                  fontWeight: 600,
                  fontSize: size * 0.4,
                  cursor: disabled || readOnly ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  transform: hoverValue === rating ? 'scale(1.15)' : 'scale(1)',
                  '&:hover': {
                    bgcolor: isSelected ? activeColor : alpha(activeColor, 0.3),
                  },
                }}
              >
                {rating}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ py: 1 }}>
      {iconType === 'emoji' && renderEmojiRating()}
      {iconType === 'number' && renderNumberRating()}
      {['star', 'heart', 'thumb'].includes(iconType) && renderIconRating()}

      {/* Labels */}
      {showLabels && labels && Object.keys(labels).length > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: 1,
            px: 0.5,
          }}
        >
          {ratingItems.map((rating) => (
            <Typography
              key={rating}
              variant="caption"
              sx={{
                color: displayValue === rating ? activeColor : 'text.secondary',
                textAlign: 'center',
                flex: 1,
                fontSize: '0.65rem',
              }}
            >
              {labels[rating] || ''}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}

// Wrap with common question wrapper and register
const RatingRenderer = withQuestionWrapper(RatingRendererBase);
registerRenderer('rating', RatingRenderer);

export { RatingRenderer };
export default RatingRenderer;
