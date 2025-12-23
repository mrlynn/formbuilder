/**
 * AI Form Generator Dialog
 *
 * Dialog component for generating forms from natural language descriptions.
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Collapse,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Close as CloseIcon,
  Lightbulb as SuggestionIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAIFormGenerator } from '@/hooks/useAI';
import { FormConfiguration, FieldConfig } from '@/types/form';

// ============================================
// Types
// ============================================

interface AIFormGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (form: Partial<FormConfiguration>) => void;
  existingSchema?: Record<string, any>;
}

interface IndustryOption {
  value: string;
  label: string;
}

// ============================================
// Constants
// ============================================

const INDUSTRIES: IndustryOption[] = [
  { value: '', label: 'Any / General' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'education', label: 'Education' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'technology', label: 'Technology' },
  { value: 'real_estate', label: 'Real Estate' },
];

const EXAMPLE_PROMPTS = [
  'Customer feedback form with rating, comments, and follow-up email',
  'Event registration with name, email, dietary restrictions, and session selection',
  'Job application form with resume upload, experience, and references',
  'Product order form with quantity, shipping address, and payment info',
  'Employee onboarding form with personal details and emergency contact',
];

// ============================================
// Component
// ============================================

export default function AIFormGeneratorDialog({
  open,
  onClose,
  onGenerate,
  existingSchema,
}: AIFormGeneratorDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [industry, setIndustry] = useState('');
  const [audience, setAudience] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    data: generatedForm,
    loading,
    error,
    generateForm,
    reset,
    suggestions,
    confidence,
  } = useAIFormGenerator();

  // Handle form generation
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    await generateForm(
      prompt,
      {
        industry: industry || undefined,
        audience: audience || undefined,
        schema: existingSchema,
      },
      {
        includeValidation: true,
        includeConditionalLogic: true,
      }
    );
  }, [prompt, industry, audience, existingSchema, generateForm]);

  // Handle applying the generated form
  const handleApply = useCallback(() => {
    if (generatedForm) {
      onGenerate(generatedForm);
      handleClose();
    }
  }, [generatedForm, onGenerate]);

  // Handle closing the dialog
  const handleClose = useCallback(() => {
    reset();
    setPrompt('');
    setIndustry('');
    setAudience('');
    setShowAdvanced(false);
    onClose();
  }, [reset, onClose]);

  // Handle example prompt click
  const handleExampleClick = useCallback((example: string) => {
    setPrompt(example);
  }, []);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <AIIcon color="primary" />
            <Typography variant="h6">Generate Form with AI</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Main input section */}
        <Box mb={3}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Describe the form you want to create in plain language. Be specific about the fields,
            validation rules, and any conditional logic you need.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Describe your form"
            placeholder="e.g., Create a customer feedback form with a 1-5 star rating, optional comments field, and ask for email only if they want a follow-up response"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          {/* Example prompts */}
          <Box mb={2}>
            <Typography variant="caption" color="text.secondary">
              Try an example:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
              {EXAMPLE_PROMPTS.map((example, index) => (
                <Chip
                  key={index}
                  label={example.length > 40 ? example.substring(0, 40) + '...' : example}
                  size="small"
                  variant="outlined"
                  onClick={() => handleExampleClick(example)}
                  disabled={loading}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          {/* Advanced options */}
          <Accordion
            expanded={showAdvanced}
            onChange={() => setShowAdvanced(!showAdvanced)}
            elevation={0}
            sx={{ backgroundColor: 'transparent', '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" color="text.secondary">
                Advanced Options
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" gap={2}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Industry</InputLabel>
                  <Select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    label="Industry"
                    disabled={loading}
                  >
                    {INDUSTRIES.map((ind) => (
                      <MenuItem key={ind.value} value={ind.value}>
                        {ind.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  label="Target Audience"
                  placeholder="e.g., customers, employees"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  disabled={loading}
                  sx={{ flexGrow: 1 }}
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Loading state */}
        {loading && (
          <Box textAlign="center" py={4}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" mt={2}>
              Generating your form...
            </Typography>
          </Box>
        )}

        {/* Error state */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Generated form preview */}
        {generatedForm && !loading && (
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                Generated Form Preview
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="caption" color="text.secondary">
                  Confidence:
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={confidence * 100}
                  sx={{ width: 80, height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {Math.round(confidence * 100)}%
                </Typography>
              </Box>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {generatedForm.name}
              </Typography>
              {generatedForm.description && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {generatedForm.description}
                </Typography>
              )}

              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Fields ({generatedForm.fieldConfigs?.length || 0}):
              </Typography>
              <List dense disablePadding>
                {generatedForm.fieldConfigs?.map((field, index) => (
                  <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={field.label}
                      secondary={`${field.type}${field.required ? ' • Required' : ''}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  mb={1}
                >
                  <SuggestionIcon fontSize="small" />
                  Suggestions for improvement:
                </Typography>
                {suggestions.map((suggestion, index) => (
                  <Alert
                    key={index}
                    severity="info"
                    icon={<WarningIcon fontSize="small" />}
                    sx={{ mb: 1, py: 0 }}
                  >
                    <Typography variant="caption">{suggestion}</Typography>
                  </Alert>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {!generatedForm ? (
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <AIIcon />}
          >
            {loading ? 'Generating...' : 'Generate Form'}
          </Button>
        ) : (
          <>
            <Button onClick={reset} disabled={loading}>
              Try Again
            </Button>
            <Button variant="contained" onClick={handleApply} color="success">
              Apply to Builder
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
