'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  alpha,
  ClickAwayListener,
} from '@mui/material';
import { Edit, Check, Close } from '@mui/icons-material';

interface InlineEditableLabelProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2';
  showEditIcon?: boolean;
}

export function InlineEditableLabel({
  value,
  onChange,
  placeholder = 'Enter label...',
  required = false,
  disabled = false,
  variant = 'body1',
  showEditIcon = true,
}: InlineEditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== value) {
      onChange(trimmedValue);
    } else {
      setEditValue(value); // Reset to original
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <ClickAwayListener onClickAway={handleSave}>
        <TextField
          inputRef={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          size="small"
          fullWidth
          autoComplete="off"
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
              '& fieldset': {
                borderColor: '#00ED64',
                borderWidth: 2,
              },
              '&:hover fieldset': {
                borderColor: '#00ED64',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00ED64',
              },
            },
            '& .MuiInputBase-input': {
              py: 0.75,
              px: 1,
              fontSize: variant === 'body2' ? '0.875rem' : variant === 'subtitle2' ? '0.875rem' : '1rem',
              fontWeight: 500,
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleSave}
                  sx={{ color: '#00ED64', p: 0.25 }}
                >
                  <Check sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleCancel}
                  sx={{ color: 'text.secondary', p: 0.25 }}
                >
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </ClickAwayListener>
    );
  }

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleStartEdit}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        cursor: disabled ? 'default' : 'pointer',
        borderRadius: 1,
        px: 0.5,
        py: 0.25,
        mx: -0.5,
        transition: 'all 0.15s ease',
        '&:hover': disabled ? {} : {
          bgcolor: alpha('#00ED64', 0.08),
        },
      }}
    >
      <Typography
        variant={variant}
        sx={{
          fontWeight: 500,
          color: value ? 'text.primary' : 'text.disabled',
        }}
      >
        {value || placeholder}
        {required && (
          <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
        )}
      </Typography>
      {showEditIcon && isHovered && !disabled && (
        <Tooltip title="Click to edit" placement="top">
          <Edit
            sx={{
              fontSize: 14,
              color: 'text.secondary',
              opacity: 0.6,
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
}
