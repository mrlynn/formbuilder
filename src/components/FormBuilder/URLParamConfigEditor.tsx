'use client';

import { useState } from 'react';
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
  Paper,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore,
  ContentCopy,
  HelpOutline,
  LinkOff,
} from '@mui/icons-material';
import { URLParamConfig } from '@/types/form';

interface URLParamConfigEditorProps {
  config: URLParamConfig;
  fieldPath: string;
  formSlug?: string;
  onChange: (config: URLParamConfig) => void;
}

export function URLParamConfigEditor({
  config,
  fieldPath,
  formSlug,
  onChange,
}: URLParamConfigEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleChange = (key: keyof URLParamConfig, value: any) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const handleValidationChange = (key: string, value: any) => {
    onChange({
      ...config,
      validation: {
        ...config.validation,
        [key]: value,
      },
    });
  };

  // Generate example URL
  const exampleUrl = formSlug
    ? `https://yoursite.com/f/${formSlug}?${config.paramName || 'param'}=example_value`
    : `?${config.paramName || 'param'}=example_value`;

  const copyExampleUrl = () => {
    navigator.clipboard.writeText(exampleUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info" icon={<LinkOff />} sx={{ mb: 1 }}>
        This field captures values from URL query parameters. Use it to pre-fill forms with data passed via links.
      </Alert>

      {/* Parameter Name */}
      <TextField
        fullWidth
        label="Parameter Name"
        value={config.paramName || ''}
        onChange={(e) => handleChange('paramName', e.target.value)}
        placeholder="e.g., ref, source, campaign_id"
        helperText="The query parameter name to read from the URL"
        size="small"
        required
      />

      {/* Data Type */}
      <FormControl fullWidth size="small">
        <InputLabel>Data Type</InputLabel>
        <Select
          value={config.dataType || 'string'}
          label="Data Type"
          onChange={(e) => handleChange('dataType', e.target.value)}
        >
          <MenuItem value="string">String (text)</MenuItem>
          <MenuItem value="number">Number</MenuItem>
          <MenuItem value="boolean">Boolean (true/false)</MenuItem>
          <MenuItem value="json">JSON (parsed object)</MenuItem>
        </Select>
      </FormControl>

      {/* Default Value */}
      <TextField
        fullWidth
        label="Default Value"
        value={config.defaultValue ?? ''}
        onChange={(e) => handleChange('defaultValue', e.target.value)}
        placeholder="Value to use if parameter is missing"
        helperText="Used when the URL parameter is not present"
        size="small"
      />

      {/* Transform */}
      <FormControl fullWidth size="small">
        <InputLabel>Transform</InputLabel>
        <Select
          value={config.transform || 'none'}
          label="Transform"
          onChange={(e) => handleChange('transform', e.target.value)}
        >
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="uppercase">Uppercase</MenuItem>
          <MenuItem value="lowercase">Lowercase</MenuItem>
          <MenuItem value="trim">Trim whitespace</MenuItem>
        </Select>
      </FormControl>

      {/* Display Options */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: alpha('#00ED64', 0.03),
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Display Options
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={config.hidden || false}
              onChange={(e) => handleChange('hidden', e.target.checked)}
              size="small"
            />
          }
          label={
            <Box>
              <Typography variant="body2">Hidden Field</Typography>
              <Typography variant="caption" color="text.secondary">
                Capture value without showing to user
              </Typography>
            </Box>
          }
          sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={config.readonly || false}
              onChange={(e) => handleChange('readonly', e.target.checked)}
              size="small"
              disabled={config.hidden}
            />
          }
          label={
            <Box>
              <Typography variant="body2">Read-only</Typography>
              <Typography variant="caption" color="text.secondary">
                User can see but not modify the value
              </Typography>
            </Box>
          }
          sx={{ display: 'flex', alignItems: 'flex-start' }}
        />
      </Paper>

      {/* Validation */}
      <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">Validation (Optional)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.validation?.required || false}
                  onChange={(e) => handleValidationChange('required', e.target.checked)}
                  size="small"
                />
              }
              label="Require parameter to be present"
            />

            <TextField
              fullWidth
              label="Allowed Values"
              value={config.validation?.allowedValues?.join(', ') || ''}
              onChange={(e) => {
                const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                handleValidationChange('allowedValues', values.length > 0 ? values : undefined);
              }}
              placeholder="value1, value2, value3"
              helperText="Comma-separated list of allowed values"
              size="small"
            />

            <TextField
              fullWidth
              label="Validation Pattern"
              value={config.validation?.pattern || ''}
              onChange={(e) => handleValidationChange('pattern', e.target.value || undefined)}
              placeholder="^[a-zA-Z0-9]+$"
              helperText="Regular expression to validate the value"
              size="small"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Example URL */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Example URL
          </Typography>
          <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
            <IconButton size="small" onClick={copyExampleUrl}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'background.paper',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
            color: 'text.secondary',
          }}
        >
          {exampleUrl}
        </Box>
        {config.paramName && (
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label={`Field: ${fieldPath}`}
              sx={{ bgcolor: alpha('#00ED64', 0.1), color: '#00ED64' }}
            />
            <Chip
              size="small"
              label={`Param: ${config.paramName}`}
              sx={{ bgcolor: alpha('#2196f3', 0.1), color: '#2196f3' }}
            />
            <Chip
              size="small"
              label={`Type: ${config.dataType || 'string'}`}
              variant="outlined"
            />
          </Box>
        )}
      </Paper>

      {/* Help Text */}
      <Alert severity="success" icon={<HelpOutline />}>
        <Typography variant="body2">
          <strong>How it works:</strong> When someone opens your form with{' '}
          <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: 2 }}>
            ?{config.paramName || 'param'}=value
          </code>{' '}
          in the URL, this field will automatically be filled with that value.
        </Typography>
      </Alert>
    </Box>
  );
}
