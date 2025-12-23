'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Collapse,
  TextField,
  Tooltip,
  alpha,
  Divider,
  Stack,
} from '@mui/material';
import {
  Lock,
  LockOpen,
  Security,
  Warning,
  Info,
  Shield,
  Search,
  SearchOff,
} from '@mui/icons-material';
import {
  FieldConfig,
  FieldEncryptionConfig,
  EncryptionAlgorithm,
  EncryptedQueryType,
  DataSensitivityLevel,
  ComplianceFramework,
} from '@/types/form';

interface FieldEncryptionSettingsProps {
  fieldConfig: FieldConfig;
  onChange: (encryption: FieldEncryptionConfig | undefined) => void;
  disabled?: boolean;
}

const SENSITIVITY_LEVELS: Array<{
  value: DataSensitivityLevel;
  label: string;
  description: string;
  color: string;
}> = [
  {
    value: 'public',
    label: 'Public',
    description: 'No encryption needed',
    color: '#4caf50',
  },
  {
    value: 'internal',
    label: 'Internal',
    description: 'Low sensitivity',
    color: '#8bc34a',
  },
  {
    value: 'confidential',
    label: 'Confidential',
    description: 'Medium sensitivity',
    color: '#ff9800',
  },
  {
    value: 'restricted',
    label: 'Restricted',
    description: 'High sensitivity (PII)',
    color: '#f44336',
  },
  {
    value: 'secret',
    label: 'Secret',
    description: 'Maximum sensitivity',
    color: '#9c27b0',
  },
];

const COMPLIANCE_FRAMEWORKS: Array<{
  value: ComplianceFramework;
  label: string;
  description: string;
}> = [
  { value: 'HIPAA', label: 'HIPAA', description: 'Healthcare data' },
  { value: 'PCI-DSS', label: 'PCI-DSS', description: 'Payment card data' },
  { value: 'GDPR', label: 'GDPR', description: 'EU personal data' },
  { value: 'SOC2', label: 'SOC 2', description: 'Service organization' },
  { value: 'CCPA', label: 'CCPA', description: 'California privacy' },
  { value: 'FERPA', label: 'FERPA', description: 'Educational records' },
];

const ALGORITHM_OPTIONS: Array<{
  value: EncryptionAlgorithm;
  label: string;
  description: string;
  querySupport: string;
}> = [
  {
    value: 'Indexed',
    label: 'Indexed (Recommended)',
    description: 'Supports equality queries on encrypted data',
    querySupport: 'Equality queries',
  },
  {
    value: 'Unindexed',
    label: 'Unindexed (Maximum Security)',
    description: 'No query support, highest security',
    querySupport: 'No queries',
  },
  {
    value: 'Range',
    label: 'Range (Preview)',
    description: 'Supports range queries (MongoDB 7.0+)',
    querySupport: 'Range queries',
  },
];

export function FieldEncryptionSettings({
  fieldConfig,
  onChange,
  disabled = false,
}: FieldEncryptionSettingsProps) {
  const encryption = fieldConfig.encryption;
  const isEnabled = encryption?.enabled ?? false;

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleEncryption = (enabled: boolean) => {
    if (enabled) {
      // Initialize with defaults
      onChange({
        enabled: true,
        algorithm: 'Indexed',
        queryType: 'equality',
        sensitivityLevel: 'confidential',
        contentionFactor: 4,
      });
    } else {
      onChange(undefined);
    }
  };

  const handleChange = (updates: Partial<FieldEncryptionConfig>) => {
    if (!encryption) return;
    onChange({ ...encryption, ...updates });
  };

  const handleComplianceToggle = (framework: ComplianceFramework) => {
    if (!encryption) return;
    const current = encryption.compliance || [];
    const updated = current.includes(framework)
      ? current.filter((f) => f !== framework)
      : [...current, framework];
    handleChange({ compliance: updated.length > 0 ? updated : undefined });
  };

  // Determine if field type supports range encryption
  const supportsRange = ['number', 'integer', 'decimal', 'currency', 'date', 'datetime'].includes(
    fieldConfig.type
  );

  return (
    <Box>
      {/* Header with toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEnabled ? (
            <Lock sx={{ color: '#9c27b0', fontSize: 20 }} />
          ) : (
            <LockOpen sx={{ color: 'text.secondary', fontSize: 20 }} />
          )}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Field Encryption
          </Typography>
          {isEnabled && (
            <Chip
              label="Enabled"
              size="small"
              sx={{
                bgcolor: alpha('#9c27b0', 0.1),
                color: '#9c27b0',
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          )}
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={isEnabled}
              onChange={(e) => handleToggleEncryption(e.target.checked)}
              disabled={disabled}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#9c27b0',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#9c27b0',
                },
              }}
            />
          }
          label=""
        />
      </Box>

      {/* Info alert when disabled */}
      {!isEnabled && (
        <Alert
          severity="info"
          icon={<Info fontSize="small" />}
          sx={{ mb: 2, py: 0.5 }}
        >
          <Typography variant="caption">
            Enable encryption for sensitive data like SSN, financial info, or health records.
            Uses MongoDB Queryable Encryption.
          </Typography>
        </Alert>
      )}

      {/* Encryption settings when enabled */}
      <Collapse in={isEnabled}>
        <Stack spacing={2}>
          {/* Sensitivity Level */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Sensitivity Level
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {SENSITIVITY_LEVELS.map((level) => (
                <Chip
                  key={level.value}
                  label={level.label}
                  size="small"
                  onClick={() => handleChange({ sensitivityLevel: level.value })}
                  sx={{
                    bgcolor:
                      encryption?.sensitivityLevel === level.value
                        ? alpha(level.color, 0.2)
                        : 'transparent',
                    color:
                      encryption?.sensitivityLevel === level.value
                        ? level.color
                        : 'text.secondary',
                    border: '1px solid',
                    borderColor:
                      encryption?.sensitivityLevel === level.value
                        ? level.color
                        : alpha('#000', 0.1),
                    fontWeight: encryption?.sensitivityLevel === level.value ? 600 : 400,
                    '&:hover': {
                      bgcolor: alpha(level.color, 0.1),
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Algorithm Selection */}
          <FormControl size="small" fullWidth>
            <InputLabel>Encryption Algorithm</InputLabel>
            <Select
              value={encryption?.algorithm || 'Indexed'}
              onChange={(e) => {
                const algorithm = e.target.value as EncryptionAlgorithm;
                let queryType: EncryptedQueryType = 'equality';
                if (algorithm === 'Unindexed') {
                  queryType = 'none';
                } else if (algorithm === 'Range') {
                  queryType = 'range';
                }
                handleChange({ algorithm, queryType });
              }}
              label="Encryption Algorithm"
            >
              {ALGORITHM_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  disabled={option.value === 'Range' && !supportsRange}
                >
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Query Support Indicator */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              borderRadius: 1,
              bgcolor:
                encryption?.queryType === 'none'
                  ? alpha('#f44336', 0.05)
                  : alpha('#4caf50', 0.05),
              border: '1px solid',
              borderColor:
                encryption?.queryType === 'none'
                  ? alpha('#f44336', 0.2)
                  : alpha('#4caf50', 0.2),
            }}
          >
            {encryption?.queryType === 'none' ? (
              <SearchOff sx={{ color: '#f44336', fontSize: 18 }} />
            ) : (
              <Search sx={{ color: '#4caf50', fontSize: 18 }} />
            )}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Query Support:{' '}
                {encryption?.queryType === 'none'
                  ? 'Disabled'
                  : encryption?.queryType === 'equality'
                  ? 'Equality Only'
                  : 'Range Queries'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {encryption?.queryType === 'none'
                  ? 'This field cannot be searched or filtered'
                  : encryption?.queryType === 'equality'
                  ? 'Can search for exact matches'
                  : 'Can search with greater than, less than, between'}
              </Typography>
            </Box>
          </Box>

          {/* Range Configuration (when Range algorithm selected) */}
          {encryption?.algorithm === 'Range' && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                label="Min Value"
                type={fieldConfig.type === 'date' ? 'date' : 'number'}
                value={encryption.rangeMin || ''}
                onChange={(e) => handleChange({ rangeMin: e.target.value })}
                fullWidth
                helperText="Minimum expected value"
              />
              <TextField
                size="small"
                label="Max Value"
                type={fieldConfig.type === 'date' ? 'date' : 'number'}
                value={encryption.rangeMax || ''}
                onChange={(e) => handleChange({ rangeMax: e.target.value })}
                fullWidth
                helperText="Maximum expected value"
              />
            </Box>
          )}

          <Divider />

          {/* Compliance Frameworks */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              <Shield sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              Compliance Frameworks (Optional)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {COMPLIANCE_FRAMEWORKS.map((framework) => {
                const isSelected = encryption?.compliance?.includes(framework.value);
                return (
                  <Tooltip key={framework.value} title={framework.description}>
                    <Chip
                      label={framework.label}
                      size="small"
                      onClick={() => handleComplianceToggle(framework.value)}
                      sx={{
                        bgcolor: isSelected ? alpha('#2196f3', 0.1) : 'transparent',
                        color: isSelected ? '#2196f3' : 'text.secondary',
                        border: '1px solid',
                        borderColor: isSelected ? '#2196f3' : alpha('#000', 0.1),
                        fontWeight: isSelected ? 600 : 400,
                        '&:hover': {
                          bgcolor: alpha('#2196f3', 0.1),
                        },
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>

          {/* Advanced Settings Toggle */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' },
              }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </Typography>
          </Box>

          <Collapse in={showAdvanced}>
            <Stack spacing={2}>
              {/* Contention Factor */}
              {encryption?.algorithm === 'Indexed' && (
                <FormControl size="small" fullWidth>
                  <InputLabel>Contention Factor</InputLabel>
                  <Select
                    value={encryption?.contentionFactor || 4}
                    onChange={(e) =>
                      handleChange({ contentionFactor: e.target.value as number })
                    }
                    label="Contention Factor"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <MenuItem key={n} value={n}>
                        {n} {n === 4 && '(Default)'}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Higher = better insert performance, lower query performance
                  </Typography>
                </FormControl>
              )}

              {/* Encryption Reason */}
              <TextField
                size="small"
                label="Encryption Reason (Audit)"
                value={encryption?.encryptionReason || ''}
                onChange={(e) => handleChange({ encryptionReason: e.target.value })}
                fullWidth
                multiline
                rows={2}
                placeholder="Document why this field requires encryption"
                helperText="For compliance and audit purposes"
              />

              {/* Custom Key Alt Name */}
              <TextField
                size="small"
                label="Key Alternative Name"
                value={encryption?.keyAltName || ''}
                onChange={(e) => handleChange({ keyAltName: e.target.value || undefined })}
                fullWidth
                placeholder="Leave empty for auto-generated"
                helperText="Custom identifier for the encryption key"
              />
            </Stack>
          </Collapse>

          {/* Warning for high sensitivity */}
          {(encryption?.sensitivityLevel === 'restricted' ||
            encryption?.sensitivityLevel === 'secret') && (
            <Alert severity="warning" icon={<Warning fontSize="small" />} sx={{ py: 0.5 }}>
              <Typography variant="caption">
                <strong>High Sensitivity Data:</strong> Ensure your organization has appropriate
                policies for handling this data type.
              </Typography>
            </Alert>
          )}
        </Stack>
      </Collapse>
    </Box>
  );
}
