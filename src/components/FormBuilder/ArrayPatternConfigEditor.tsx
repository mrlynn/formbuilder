'use client';

import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Collapse,
  Paper,
  alpha,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { DataArray, Label, VpnKey, Category } from '@mui/icons-material';
import { ArrayPatternConfig, ArrayPattern } from '@/types/form';

interface ArrayPatternConfigEditorProps {
  config?: ArrayPatternConfig;
  onChange: (config: ArrayPatternConfig | undefined) => void;
  sampleValue?: any[];  // Sample data to help auto-detect pattern
}

const patternOptions: { value: ArrayPattern; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'primitive',
    label: 'Simple List',
    description: 'Basic array of values (strings, numbers)',
    icon: <DataArray fontSize="small" />
  },
  {
    value: 'tags',
    label: 'Tags / Chips',
    description: 'Render as interactive tag chips',
    icon: <Label fontSize="small" />
  },
  {
    value: 'key-value',
    label: 'Key-Value Pairs',
    description: 'Attribute pattern - array of {key, value} objects',
    icon: <VpnKey fontSize="small" />
  },
  {
    value: 'custom-objects',
    label: 'Custom Objects',
    description: 'Array of objects with defined schema',
    icon: <Category fontSize="small" />
  }
];

export function ArrayPatternConfigEditor({
  config,
  onChange,
  sampleValue
}: ArrayPatternConfigEditorProps) {
  const currentPattern = config?.pattern || 'primitive';

  // Auto-detect pattern from sample data
  const detectPattern = (): ArrayPattern => {
    if (!sampleValue || !Array.isArray(sampleValue) || sampleValue.length === 0) {
      return 'primitive';
    }

    const firstItem = sampleValue[0];

    // Check if it's primitive
    if (typeof firstItem !== 'object' || firstItem === null) {
      return typeof firstItem === 'string' ? 'tags' : 'primitive';
    }

    // Check for key-value pattern
    const keys = Object.keys(firstItem);
    if (keys.length === 2) {
      const hasKeyField = keys.some(k => k.toLowerCase() === 'key' || k.toLowerCase() === 'name' || k.toLowerCase() === 'attribute');
      const hasValueField = keys.some(k => k.toLowerCase() === 'value' || k.toLowerCase() === 'val');
      if (hasKeyField && hasValueField) {
        return 'key-value';
      }
    }

    return 'custom-objects';
  };

  const handlePatternChange = (pattern: ArrayPattern) => {
    if (pattern === 'primitive') {
      onChange(undefined);
    } else {
      onChange({
        ...config,
        pattern
      });
    }
  };

  const detectedPattern = detectPattern();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <DataArray fontSize="small" sx={{ color: '#9c27b0' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Array Display Pattern
        </Typography>
        {detectedPattern !== 'primitive' && detectedPattern !== currentPattern && (
          <Chip
            label={`Detected: ${patternOptions.find(p => p.value === detectedPattern)?.label}`}
            size="small"
            onClick={() => handlePatternChange(detectedPattern)}
            sx={{
              cursor: 'pointer',
              bgcolor: alpha('#ff9800', 0.1),
              color: '#ff9800',
              fontSize: '0.65rem',
              height: 20
            }}
          />
        )}
      </Box>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Display Pattern</InputLabel>
        <Select
          value={currentPattern}
          label="Display Pattern"
          onChange={(e) => handlePatternChange(e.target.value as ArrayPattern)}
        >
          {patternOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {option.icon}
                <Box>
                  <Typography variant="body2">{option.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.description}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Key-Value Pattern Configuration */}
      <Collapse in={currentPattern === 'key-value'}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: alpha('#9c27b0', 0.03),
            border: '1px solid',
            borderColor: alpha('#9c27b0', 0.2),
            borderRadius: 1
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#9c27b0', display: 'block', mb: 2 }}>
            Key-Value Configuration
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              label="Key Field Name"
              value={config?.keyField || 'key'}
              onChange={(e) => onChange({ ...config, pattern: 'key-value', keyField: e.target.value })}
              helperText="Field name in object"
              fullWidth
            />
            <TextField
              size="small"
              label="Value Field Name"
              value={config?.valueField || 'value'}
              onChange={(e) => onChange({ ...config, pattern: 'key-value', valueField: e.target.value })}
              helperText="Field name in object"
              fullWidth
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              label="Key Column Label"
              value={config?.keyLabel || 'Key'}
              onChange={(e) => onChange({ ...config, pattern: 'key-value', keyLabel: e.target.value })}
              helperText="Display in header"
              fullWidth
            />
            <TextField
              size="small"
              label="Value Column Label"
              value={config?.valueLabel || 'Value'}
              onChange={(e) => onChange({ ...config, pattern: 'key-value', valueLabel: e.target.value })}
              helperText="Display in header"
              fullWidth
            />
          </Box>

          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>Value Type</InputLabel>
            <Select
              value={config?.valueType || 'mixed'}
              label="Value Type"
              onChange={(e) => onChange({ ...config, pattern: 'key-value', valueType: e.target.value as any })}
            >
              <MenuItem value="mixed">Mixed (Auto-detect)</MenuItem>
              <MenuItem value="string">String</MenuItem>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="boolean">Boolean</MenuItem>
            </Select>
          </FormControl>
        </Paper>
      </Collapse>

      {/* Tags Pattern Configuration */}
      <Collapse in={currentPattern === 'tags'}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: alpha('#00ED64', 0.03),
            border: '1px solid',
            borderColor: alpha('#00ED64', 0.2),
            borderRadius: 1
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#00844a', display: 'block', mb: 2 }}>
            Tags Configuration
          </Typography>

          <TextField
            size="small"
            label="Suggested Tags"
            placeholder="tag1, tag2, tag3"
            value={config?.suggestions?.join(', ') || ''}
            onChange={(e) => {
              const suggestions = e.target.value
                .split(',')
                .map(s => s.trim())
                .filter(s => s);
              onChange({ ...config, pattern: 'tags', suggestions });
            }}
            helperText="Comma-separated list of suggestions"
            fullWidth
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={config?.allowCustom !== false}
                onChange={(e) => onChange({ ...config, pattern: 'tags', allowCustom: e.target.checked })}
                size="small"
              />
            }
            label={
              <Typography variant="body2">Allow custom tags</Typography>
            }
          />
        </Paper>
      </Collapse>
    </Box>
  );
}
