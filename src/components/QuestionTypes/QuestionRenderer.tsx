'use client';

/**
 * Question Renderer Component
 *
 * Uses a registry/factory pattern to dynamically render questions based on their type.
 * This approach makes it easy to add new question types without modifying core logic.
 *
 * Architecture:
 * - QuestionRenderer: Main component that looks up the correct renderer
 * - QuestionRendererRegistry: Maps question types to their renderer components
 * - Individual renderers: Type-specific components (RatingRenderer, ScaleRenderer, etc.)
 */

import React, { useMemo } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { Question, QuestionTypeId } from '@/types/questionTypes';

// ============================================
// Types
// ============================================

export interface QuestionRendererProps<T extends Question = Question> {
  /** The question to render */
  question: T;
  /** Current value */
  value: any;
  /** Change handler */
  onChange: (value: any) => void;
  /** Validation error message */
  error?: string;
  /** Whether the field has been touched */
  touched?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether to show in read-only mode */
  readOnly?: boolean;
  /** Additional class name */
  className?: string;
}

export interface QuestionRendererComponent<T extends Question = Question> {
  (props: QuestionRendererProps<T>): React.ReactElement | null;
}

// ============================================
// Renderer Registry
// ============================================

const rendererRegistry = new Map<QuestionTypeId, QuestionRendererComponent<any>>();

/**
 * Register a renderer for a question type
 */
export function registerRenderer<T extends Question>(
  type: QuestionTypeId,
  renderer: QuestionRendererComponent<T>
): void {
  rendererRegistry.set(type, renderer);
}

/**
 * Get the renderer for a question type
 */
export function getRenderer(type: QuestionTypeId): QuestionRendererComponent | undefined {
  return rendererRegistry.get(type);
}

/**
 * Check if a renderer is registered for a type
 */
export function hasRenderer(type: QuestionTypeId): boolean {
  return rendererRegistry.has(type);
}

// ============================================
// Main Question Renderer
// ============================================

export function QuestionRenderer({
  question,
  value,
  onChange,
  error,
  touched,
  disabled,
  readOnly,
  className,
}: QuestionRendererProps) {
  const Renderer = useMemo(() => getRenderer(question.type), [question.type]);

  if (!Renderer) {
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: alpha('#ff9800', 0.1),
          borderRadius: 1,
          border: '1px dashed',
          borderColor: alpha('#ff9800', 0.3),
        }}
      >
        <Typography variant="body2" color="warning.main">
          No renderer available for question type: {question.type}
        </Typography>
      </Box>
    );
  }

  return (
    <Renderer
      question={question}
      value={value}
      onChange={onChange}
      error={error}
      touched={touched}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
    />
  );
}

// ============================================
// HOC for creating type-safe renderers
// ============================================

/**
 * Higher-order component that wraps a renderer with type safety
 * and common functionality (label, error display, etc.)
 */
export function withQuestionWrapper<T extends Question>(
  WrappedRenderer: React.ComponentType<QuestionRendererProps<T>>
): QuestionRendererComponent<T> {
  return function WrappedQuestionRenderer(props: QuestionRendererProps<T>) {
    const { question, error, touched } = props;
    const showError = touched && error;

    return (
      <Box className={props.className}>
        {/* Label */}
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            component="label"
            variant="body2"
            sx={{ fontWeight: 500, color: 'text.primary' }}
          >
            {question.label}
            {question.required && (
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                *
              </Typography>
            )}
          </Typography>
        </Box>

        {/* Description */}
        {question.description && (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', mb: 1 }}
          >
            {question.description}
          </Typography>
        )}

        {/* Renderer */}
        <WrappedRenderer {...props} />

        {/* Error */}
        {showError && (
          <Typography
            variant="caption"
            sx={{ color: 'error.main', display: 'block', mt: 0.5 }}
          >
            {error}
          </Typography>
        )}
      </Box>
    );
  };
}

// ============================================
// Utility hook for question state
// ============================================

export function useQuestionState<T>(
  initialValue: T,
  onChange?: (value: T) => void
) {
  const [value, setValue] = React.useState<T>(initialValue);
  const [touched, setTouched] = React.useState(false);

  const handleChange = React.useCallback(
    (newValue: T) => {
      setValue(newValue);
      onChange?.(newValue);
    },
    [onChange]
  );

  const handleBlur = React.useCallback(() => {
    setTouched(true);
  }, []);

  return {
    value,
    touched,
    onChange: handleChange,
    onBlur: handleBlur,
    setValue,
    setTouched,
  };
}

export default QuestionRenderer;
