'use client';

import { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  Typography,
  alpha,
  Chip
} from '@mui/material';
import { useFieldSuggestions } from '@/hooks/useFieldSuggestions';

interface FieldAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  helperText?: string;
  error?: boolean;
  allowCustom?: boolean; // Allow typing values that aren't in suggestions
  prefix?: string; // Prefix like "$" for field references
}

export function FieldAutocomplete({
  value,
  onChange,
  label,
  placeholder = 'Type field name...',
  fullWidth = true,
  size = 'small',
  helperText,
  error = false,
  allowCustom = true,
  prefix = ''
}: FieldAutocompleteProps) {
  const { fieldNames, isLoading, getSuggestions } = useFieldSuggestions();
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const suggestions = getSuggestions(inputValue.replace(/^\$/, '')); // Remove $ prefix for matching

  const handleChange = (newValue: string | null) => {
    if (!newValue) {
      setInputValue('');
      onChange('');
      return;
    }
    const cleanValue = newValue.replace(/^\$/, '');
    const finalValue = prefix ? `${prefix}${cleanValue}` : cleanValue;
    setInputValue(finalValue);
    onChange(finalValue);
  };

  const handleInputChange = (event: any, newInputValue: string) => {
    const cleanValue = newInputValue.replace(/^\$/, '');
    const displayValue = prefix ? cleanValue : newInputValue;
    setInputValue(displayValue);
    // Always allow typing custom values
    if (allowCustom) {
      const finalValue = prefix ? `${prefix}${cleanValue}` : newInputValue;
      onChange(finalValue);
    }
  };

  return (
    <Autocomplete
      freeSolo={allowCustom}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={suggestions}
      value={prefix ? inputValue.replace(/^\$/, '') : inputValue}
      onInputChange={handleInputChange}
      onChange={(_, newValue) => {
        if (typeof newValue === 'string') {
          handleChange(newValue);
        } else {
          handleChange(null);
        }
        setOpen(false);
      }}
      loading={isLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          fullWidth={fullWidth}
          size={size}
          helperText={helperText || (fieldNames.length > 0 ? `${fieldNames.length} fields available` : 'No field suggestions available')}
          error={error}
          InputProps={{
            ...params.InputProps,
            startAdornment: prefix ? (
              <Box
                component="span"
                sx={{
                  mr: 1,
                  color: 'text.secondary',
                  fontFamily: 'monospace',
                  fontWeight: 600
                }}
              >
                {prefix}
              </Box>
            ) : null,
            sx: {
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box
          component="li"
          {...props}
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            '&:hover': {
              bgcolor: alpha('#00ED64', 0.1)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                flex: 1
              }}
            >
              {prefix}{option}
            </Typography>
            <Chip
              label="field"
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                bgcolor: alpha('#00ED64', 0.1),
                color: '#00ED64'
              }}
            />
          </Box>
        </Box>
      )}
      getOptionLabel={(option) => {
        if (typeof option === 'string') {
          return option;
        }
        return '';
      }}
      filterOptions={(options, state) => {
        // Custom filtering is handled by getSuggestions
        return options;
      }}
      ListboxProps={{
        sx: {
          maxHeight: 300,
          '& .MuiAutocomplete-option': {
            py: 1
          }
        }
      }}
      sx={{
        '& .MuiAutocomplete-inputRoot': {
          fontFamily: 'monospace'
        }
      }}
    />
  );
}

