'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Link,
  Divider,
  alpha,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ExpandMore,
  Security,
  Timer,
  Shield,
  CloudQueue,
} from '@mui/icons-material';
import { BotProtectionConfig, DraftSettings } from '@/types/form';

interface BotProtectionEditorProps {
  config?: BotProtectionConfig;
  onChange: (config: BotProtectionConfig | undefined) => void;
}

const DEFAULT_CONFIG: BotProtectionConfig = {
  enabled: false,
  honeypot: { enabled: true },
  timing: { enabled: true, minSubmitTime: 3, maxSubmitTime: 3600 },
};

export function BotProtectionEditor({ config, onChange }: BotProtectionEditorProps) {
  const [expanded, setExpanded] = useState<string | false>('honeypot');

  const currentConfig = config || DEFAULT_CONFIG;

  const handleToggleEnabled = (enabled: boolean) => {
    onChange(enabled ? { ...DEFAULT_CONFIG, enabled: true } : undefined);
  };

  const handleChange = (updates: Partial<BotProtectionConfig>) => {
    onChange({ ...currentConfig, ...updates });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Security sx={{ color: '#00ED64' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Bot Protection
        </Typography>
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={currentConfig.enabled}
            onChange={(e) => handleToggleEnabled(e.target.checked)}
            color="primary"
          />
        }
        label="Enable bot protection for public forms"
      />

      {currentConfig.enabled && (
        <Box sx={{ mt: 2 }}>
          {/* Honeypot */}
          <Accordion
            expanded={expanded === 'honeypot'}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? 'honeypot' : false)}
            sx={{ bgcolor: alpha('#00ED64', 0.02) }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield fontSize="small" sx={{ color: '#4caf50' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Honeypot Field
                </Typography>
                {currentConfig.honeypot?.enabled !== false && (
                  <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                    Active
                  </Typography>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Adds a hidden field that bots will fill but humans won&apos;t see.
                Catches most simple bots without any user friction.
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentConfig.honeypot?.enabled !== false}
                    onChange={(e) =>
                      handleChange({
                        honeypot: { ...currentConfig.honeypot, enabled: e.target.checked },
                      })
                    }
                    size="small"
                  />
                }
                label="Enable honeypot protection"
              />
            </AccordionDetails>
          </Accordion>

          {/* Timing */}
          <Accordion
            expanded={expanded === 'timing'}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? 'timing' : false)}
            sx={{ bgcolor: alpha('#2196f3', 0.02) }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timer fontSize="small" sx={{ color: '#2196f3' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Timing Validation
                </Typography>
                {currentConfig.timing?.enabled !== false && (
                  <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                    Active
                  </Typography>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Blocks submissions that happen too quickly (likely automated).
                Humans need at least a few seconds to read and fill a form.
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentConfig.timing?.enabled !== false}
                    onChange={(e) =>
                      handleChange({
                        timing: { ...currentConfig.timing, enabled: e.target.checked },
                      })
                    }
                    size="small"
                  />
                }
                label="Enable timing validation"
              />
              {currentConfig.timing?.enabled !== false && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Minimum time before submit: {currentConfig.timing?.minSubmitTime || 3}s
                  </Typography>
                  <Slider
                    value={currentConfig.timing?.minSubmitTime || 3}
                    onChange={(_, value) =>
                      handleChange({
                        timing: {
                          enabled: currentConfig.timing?.enabled ?? true,
                          ...currentConfig.timing,
                          minSubmitTime: value as number,
                        },
                      })
                    }
                    min={1}
                    max={15}
                    step={1}
                    marks={[
                      { value: 1, label: '1s' },
                      { value: 5, label: '5s' },
                      { value: 10, label: '10s' },
                      { value: 15, label: '15s' },
                    ]}
                    sx={{ mt: 1 }}
                  />
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Turnstile */}
          <Accordion
            expanded={expanded === 'turnstile'}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? 'turnstile' : false)}
            sx={{ bgcolor: alpha('#ff9800', 0.02) }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudQueue fontSize="small" sx={{ color: '#ff9800' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Cloudflare Turnstile
                </Typography>
                {currentConfig.turnstile?.enabled && (
                  <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                    Active
                  </Typography>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enterprise-grade bot protection using Cloudflare&apos;s privacy-focused
                CAPTCHA alternative. Free and doesn&apos;t require user interaction in most cases.
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                Get your free Turnstile keys at{' '}
                <Link
                  href="https://dash.cloudflare.com/?to=/:account/turnstile"
                  target="_blank"
                  rel="noopener"
                >
                  Cloudflare Dashboard
                </Link>
              </Alert>

              <FormControlLabel
                control={
                  <Switch
                    checked={currentConfig.turnstile?.enabled || false}
                    onChange={(e) =>
                      handleChange({
                        turnstile: {
                          ...currentConfig.turnstile,
                          enabled: e.target.checked,
                          siteKey: currentConfig.turnstile?.siteKey || '',
                        },
                      })
                    }
                    size="small"
                  />
                }
                label="Enable Turnstile verification"
              />

              {currentConfig.turnstile?.enabled && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Site Key"
                    value={currentConfig.turnstile?.siteKey || ''}
                    onChange={(e) =>
                      handleChange({
                        turnstile: { ...currentConfig.turnstile!, siteKey: e.target.value },
                      })
                    }
                    size="small"
                    fullWidth
                    placeholder="0x4AAAAAAAB..."
                    helperText="From Cloudflare Turnstile dashboard"
                  />

                  <FormControl size="small" fullWidth>
                    <InputLabel>Appearance</InputLabel>
                    <Select
                      value={currentConfig.turnstile?.appearance || 'always'}
                      label="Appearance"
                      onChange={(e) =>
                        handleChange({
                          turnstile: {
                            ...currentConfig.turnstile!,
                            appearance: e.target.value as 'always' | 'execute' | 'interaction-only',
                          },
                        })
                      }
                    >
                      <MenuItem value="always">Always visible</MenuItem>
                      <MenuItem value="execute">Hidden (execute on submit)</MenuItem>
                      <MenuItem value="interaction-only">Only when needed</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth>
                    <InputLabel>Theme</InputLabel>
                    <Select
                      value={currentConfig.turnstile?.theme || 'auto'}
                      label="Theme"
                      onChange={(e) =>
                        handleChange({
                          turnstile: {
                            ...currentConfig.turnstile!,
                            theme: e.target.value as 'light' | 'dark' | 'auto',
                          },
                        })
                      }
                    >
                      <MenuItem value="auto">Auto (match system)</MenuItem>
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Box>
  );
}

// ============================================
// Draft Settings Editor
// ============================================

interface DraftSettingsEditorProps {
  config?: DraftSettings;
  onChange: (config: DraftSettings | undefined) => void;
}

const DEFAULT_DRAFT_CONFIG: DraftSettings = {
  enabled: false,
  autoSaveInterval: 30,
  storageType: 'local',
  showRecoveryPrompt: true,
  draftTTL: 7,
  showSaveIndicator: true,
};

export function DraftSettingsEditor({ config, onChange }: DraftSettingsEditorProps) {
  const currentConfig = config || DEFAULT_DRAFT_CONFIG;

  const handleToggleEnabled = (enabled: boolean) => {
    onChange(enabled ? { ...DEFAULT_DRAFT_CONFIG, enabled: true } : undefined);
  };

  const handleChange = (updates: Partial<DraftSettings>) => {
    onChange({ ...currentConfig, ...updates });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Timer sx={{ color: '#9c27b0' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Auto-save & Drafts
        </Typography>
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={currentConfig.enabled}
            onChange={(e) => handleToggleEnabled(e.target.checked)}
            color="primary"
          />
        }
        label="Enable auto-save and draft recovery"
      />

      {currentConfig.enabled && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="success" sx={{ py: 0.5 }}>
            Users can resume incomplete forms. Captures partial submissions for analytics.
          </Alert>

          {/* Auto-save Interval */}
          <Box>
            <Typography variant="body2" gutterBottom>
              Auto-save every {currentConfig.autoSaveInterval} seconds
            </Typography>
            <Slider
              value={currentConfig.autoSaveInterval}
              onChange={(_, value) => handleChange({ autoSaveInterval: value as number })}
              min={10}
              max={120}
              step={10}
              marks={[
                { value: 10, label: '10s' },
                { value: 30, label: '30s' },
                { value: 60, label: '1m' },
                { value: 120, label: '2m' },
              ]}
            />
          </Box>

          <Divider />

          {/* Storage Type */}
          <FormControl size="small" fullWidth>
            <InputLabel>Storage Location</InputLabel>
            <Select
              value={currentConfig.storageType}
              label="Storage Location"
              onChange={(e) =>
                handleChange({ storageType: e.target.value as 'local' | 'server' | 'both' })
              }
            >
              <MenuItem value="local">Browser only (localStorage)</MenuItem>
              <MenuItem value="server">Server only (database)</MenuItem>
              <MenuItem value="both">Both (recommended)</MenuItem>
            </Select>
          </FormControl>

          {/* Draft TTL */}
          <FormControl size="small" fullWidth>
            <InputLabel>Keep drafts for</InputLabel>
            <Select
              value={currentConfig.draftTTL}
              label="Keep drafts for"
              onChange={(e) => handleChange({ draftTTL: e.target.value as number })}
            >
              <MenuItem value={1}>1 day</MenuItem>
              <MenuItem value={7}>7 days</MenuItem>
              <MenuItem value={14}>14 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
            </Select>
          </FormControl>

          <Divider />

          {/* Toggles */}
          <FormControlLabel
            control={
              <Switch
                checked={currentConfig.showRecoveryPrompt}
                onChange={(e) => handleChange({ showRecoveryPrompt: e.target.checked })}
                size="small"
              />
            }
            label="Show recovery prompt when returning to form"
          />

          <FormControlLabel
            control={
              <Switch
                checked={currentConfig.showSaveIndicator || false}
                onChange={(e) => handleChange({ showSaveIndicator: e.target.checked })}
                size="small"
              />
            }
            label='Show "Saved" indicator in form'
          />
        </Box>
      )}
    </Box>
  );
}

export default BotProtectionEditor;
