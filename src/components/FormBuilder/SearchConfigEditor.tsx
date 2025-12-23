'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Paper,
  alpha,
  Divider,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Alert,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  Info,
  TableChart,
  ViewModule,
  ViewList,
  Visibility,
  Edit,
  Delete,
  Download,
} from '@mui/icons-material';
import {
  SearchConfig,
  SearchFieldConfig,
  SearchOperator,
  SearchResultsConfig,
  FieldConfig,
  FormType,
} from '@/types/form';

// Operator labels and descriptions
const OPERATOR_INFO: Record<SearchOperator, { label: string; description: string; forTypes: string[] }> = {
  equals: { label: 'Equals', description: 'Exact match', forTypes: ['string', 'number', 'boolean', 'date', 'email'] },
  notEquals: { label: 'Not Equals', description: 'Does not match', forTypes: ['string', 'number', 'boolean', 'date'] },
  contains: { label: 'Contains', description: 'Text contains value', forTypes: ['string', 'email', 'url'] },
  startsWith: { label: 'Starts With', description: 'Text starts with value', forTypes: ['string', 'email'] },
  endsWith: { label: 'Ends With', description: 'Text ends with value', forTypes: ['string', 'email'] },
  greaterThan: { label: 'Greater Than', description: 'Value is greater than', forTypes: ['number', 'date'] },
  lessThan: { label: 'Less Than', description: 'Value is less than', forTypes: ['number', 'date'] },
  greaterOrEqual: { label: 'Greater or Equal', description: 'Value is greater than or equal', forTypes: ['number', 'date'] },
  lessOrEqual: { label: 'Less or Equal', description: 'Value is less than or equal', forTypes: ['number', 'date'] },
  between: { label: 'Between', description: 'Value is in range', forTypes: ['number', 'date'] },
  in: { label: 'In List', description: 'Value is one of', forTypes: ['string', 'number'] },
  notIn: { label: 'Not In List', description: 'Value is not one of', forTypes: ['string', 'number'] },
  exists: { label: 'Exists', description: 'Field has a value', forTypes: ['string', 'number', 'boolean', 'date', 'array', 'object'] },
  regex: { label: 'Regex', description: 'Regular expression match', forTypes: ['string'] },
};

// Get default operators for a field type
function getDefaultOperatorsForType(fieldType: string): SearchOperator[] {
  const type = fieldType.toLowerCase();
  if (type === 'string' || type === 'email' || type === 'url') {
    return ['contains', 'equals', 'startsWith'];
  }
  if (type === 'number') {
    return ['equals', 'greaterThan', 'lessThan', 'between'];
  }
  if (type === 'boolean') {
    return ['equals'];
  }
  if (type === 'date') {
    return ['equals', 'greaterThan', 'lessThan', 'between'];
  }
  if (type === 'array') {
    return ['contains', 'exists'];
  }
  return ['equals', 'exists'];
}

// Get available operators for a field type
function getAvailableOperatorsForType(fieldType: string): SearchOperator[] {
  return (Object.entries(OPERATOR_INFO) as [SearchOperator, typeof OPERATOR_INFO[SearchOperator]][])
    .filter(([_, info]) => info.forTypes.includes(fieldType.toLowerCase()) || info.forTypes.includes('string'))
    .map(([op]) => op);
}

interface SearchConfigEditorProps {
  formType: FormType;
  onFormTypeChange: (type: FormType) => void;
  config?: SearchConfig;
  onChange: (config: SearchConfig | undefined) => void;
  fieldConfigs: FieldConfig[];
}

export function SearchConfigEditor({
  formType,
  onFormTypeChange,
  config,
  onChange,
  fieldConfigs,
}: SearchConfigEditorProps) {
  const [expandedField, setExpandedField] = useState<string | false>(false);

  // Initialize default config if needed
  const initializeConfig = (): SearchConfig => {
    const fields: Record<string, SearchFieldConfig> = {};
    fieldConfigs.forEach((field, index) => {
      if (field.included && field.type !== 'section-header' && field.type !== 'divider') {
        fields[field.path] = {
          enabled: true,
          operators: getDefaultOperatorsForType(field.type),
          defaultOperator: getDefaultOperatorsForType(field.type)[0] || 'equals',
          showInResults: index < 5, // Show first 5 fields in results by default
          resultOrder: index,
        };
      }
    });

    return {
      enabled: true,
      fields,
      results: {
        layout: 'table',
        pageSize: 25,
        pageSizeOptions: [10, 25, 50, 100],
        showPagination: true,
        allowView: true,
        allowEdit: true,
        allowDelete: false,
        allowExport: true,
        allowSorting: true,
        allowSelection: true,
        allowBulkActions: false,
      },
    };
  };

  const handleEnableSearch = (enabled: boolean) => {
    if (enabled && !config) {
      onChange(initializeConfig());
    } else if (config) {
      onChange({ ...config, enabled });
    }
  };

  const handleFieldConfigChange = (fieldPath: string, updates: Partial<SearchFieldConfig>) => {
    if (!config) return;
    onChange({
      ...config,
      fields: {
        ...config.fields,
        [fieldPath]: {
          ...config.fields[fieldPath],
          ...updates,
        },
      },
    });
  };

  const handleResultsConfigChange = (updates: Partial<SearchResultsConfig>) => {
    if (!config) return;
    onChange({
      ...config,
      results: {
        ...config.results,
        ...updates,
      },
    });
  };

  const isSearchEnabled = formType === 'search' || formType === 'both';
  const searchableFields = fieldConfigs.filter(
    f => f.included && f.type !== 'section-header' && f.type !== 'divider' && f.type !== 'spacer'
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Form Type Selection */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Form Type
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            { value: 'data-entry', label: 'Data Entry', desc: 'Insert new documents' },
            { value: 'search', label: 'Search Only', desc: 'Search existing data' },
            { value: 'both', label: 'Both', desc: 'Create and search' },
          ].map((option) => (
            <Paper
              key={option.value}
              elevation={0}
              onClick={() => {
                onFormTypeChange(option.value as FormType);
                if (option.value === 'search' || option.value === 'both') {
                  if (!config) {
                    onChange(initializeConfig());
                  } else {
                    onChange({ ...config, enabled: true });
                  }
                }
              }}
              sx={{
                flex: 1,
                minWidth: 120,
                p: 1.5,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: formType === option.value ? '#00ED64' : 'divider',
                bgcolor: formType === option.value ? alpha('#00ED64', 0.05) : 'transparent',
                borderRadius: 2,
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: alpha('#00ED64', 0.5),
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {option.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.desc}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      {/* Search Configuration - only show if search enabled */}
      {isSearchEnabled && (
        <>
          {/* Info Alert */}
          <Alert severity="info" icon={<Info />}>
            Configure which fields users can search by and how results are displayed.
            When published, users will see a search form to find documents in your collection.
          </Alert>

          {/* Searchable Fields */}
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Search sx={{ color: '#00ED64' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Searchable Fields
                </Typography>
                <Chip
                  label={`${Object.values(config?.fields || {}).filter(f => f.enabled).length} of ${searchableFields.length}`}
                  size="small"
                  sx={{ fontSize: 11, height: 20 }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Select which fields users can filter by
              </Typography>
            </Box>

            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {searchableFields.map((field) => {
                const fieldConfig = config?.fields[field.path];
                const isEnabled = fieldConfig?.enabled ?? false;

                return (
                  <Accordion
                    key={field.path}
                    expanded={expandedField === field.path}
                    onChange={(_, isExpanded) => setExpandedField(isExpanded ? field.path : false)}
                    disableGutters
                    elevation={0}
                    sx={{
                      '&:before': { display: 'none' },
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{ px: 2, minHeight: 48 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <Switch
                          size="small"
                          checked={isEnabled}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (!config) {
                              const newConfig = initializeConfig();
                              newConfig.fields[field.path].enabled = e.target.checked;
                              onChange(newConfig);
                            } else {
                              handleFieldConfigChange(field.path, { enabled: e.target.checked });
                            }
                          }}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#00ED64',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              bgcolor: '#00ED64',
                            },
                          }}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {field.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {field.path} • {field.type}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2, pb: 2, bgcolor: alpha('#000', 0.02) }}>
                      {isEnabled && fieldConfig && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* Operators */}
                          <FormControl size="small" fullWidth>
                            <InputLabel>Search Operators</InputLabel>
                            <Select
                              multiple
                              value={fieldConfig.operators || []}
                              onChange={(e) => {
                                const value = e.target.value as SearchOperator[];
                                handleFieldConfigChange(field.path, {
                                  operators: value,
                                  defaultOperator: value.includes(fieldConfig.defaultOperator)
                                    ? fieldConfig.defaultOperator
                                    : value[0],
                                });
                              }}
                              input={<OutlinedInput label="Search Operators" />}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((op) => (
                                    <Chip
                                      key={op}
                                      label={OPERATOR_INFO[op]?.label || op}
                                      size="small"
                                      sx={{ fontSize: 10, height: 20 }}
                                    />
                                  ))}
                                </Box>
                              )}
                            >
                              {getAvailableOperatorsForType(field.type).map((op) => (
                                <MenuItem key={op} value={op}>
                                  <Checkbox
                                    checked={(fieldConfig.operators || []).includes(op)}
                                    size="small"
                                  />
                                  <ListItemText
                                    primary={OPERATOR_INFO[op]?.label || op}
                                    secondary={OPERATOR_INFO[op]?.description}
                                  />
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {/* Default Operator */}
                          <FormControl size="small" fullWidth>
                            <InputLabel>Default Operator</InputLabel>
                            <Select
                              value={fieldConfig.defaultOperator || 'equals'}
                              onChange={(e) =>
                                handleFieldConfigChange(field.path, {
                                  defaultOperator: e.target.value as SearchOperator,
                                })
                              }
                              label="Default Operator"
                            >
                              {(fieldConfig.operators || []).map((op) => (
                                <MenuItem key={op} value={op}>
                                  {OPERATOR_INFO[op]?.label || op}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {/* Show in Results */}
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={fieldConfig.showInResults ?? true}
                                onChange={(e) =>
                                  handleFieldConfigChange(field.path, {
                                    showInResults: e.target.checked,
                                  })
                                }
                                size="small"
                              />
                            }
                            label={
                              <Typography variant="body2">Show in search results</Typography>
                            }
                          />

                          {/* Placeholder */}
                          <TextField
                            size="small"
                            label="Search Placeholder"
                            placeholder={`Search by ${field.label}...`}
                            value={fieldConfig.placeholder || ''}
                            onChange={(e) =>
                              handleFieldConfigChange(field.path, {
                                placeholder: e.target.value,
                              })
                            }
                          />
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          </Paper>

          {/* Results Display */}
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Results Display
            </Typography>

            {/* Layout */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Results Layout
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[
                  { value: 'table', label: 'Table', icon: <TableChart /> },
                  { value: 'cards', label: 'Cards', icon: <ViewModule /> },
                  { value: 'list', label: 'List', icon: <ViewList /> },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={config?.results?.layout === option.value ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={option.icon}
                    onClick={() =>
                      handleResultsConfigChange({
                        layout: option.value as 'table' | 'cards' | 'list',
                      })
                    }
                    sx={{
                      flex: 1,
                      bgcolor:
                        config?.results?.layout === option.value
                          ? '#00ED64'
                          : 'transparent',
                      color:
                        config?.results?.layout === option.value
                          ? '#001E2B'
                          : 'text.secondary',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor:
                          config?.results?.layout === option.value
                            ? '#00CC55'
                            : alpha('#00ED64', 0.1),
                      },
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Page Size */}
            <FormControl size="small" sx={{ mb: 2, minWidth: 120 }}>
              <InputLabel>Page Size</InputLabel>
              <Select
                value={config?.results?.pageSize || 25}
                onChange={(e) =>
                  handleResultsConfigChange({ pageSize: Number(e.target.value) })
                }
                label="Page Size"
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            {/* Actions */}
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Result Actions
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                { key: 'allowView', label: 'View', icon: <Visibility sx={{ fontSize: 16 }} /> },
                { key: 'allowEdit', label: 'Edit', icon: <Edit sx={{ fontSize: 16 }} /> },
                { key: 'allowDelete', label: 'Delete', icon: <Delete sx={{ fontSize: 16 }} /> },
                { key: 'allowExport', label: 'Export', icon: <Download sx={{ fontSize: 16 }} /> },
              ].map((action) => (
                <FormControlLabel
                  key={action.key}
                  control={
                    <Checkbox
                      checked={config?.results?.[action.key as keyof SearchResultsConfig] as boolean ?? false}
                      onChange={(e) =>
                        handleResultsConfigChange({
                          [action.key]: e.target.checked,
                        })
                      }
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {action.icon}
                      <Typography variant="body2">{action.label}</Typography>
                    </Box>
                  }
                  sx={{ mr: 2 }}
                />
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Additional Options */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={config?.results?.showPagination ?? true}
                    onChange={(e) =>
                      handleResultsConfigChange({ showPagination: e.target.checked })
                    }
                  />
                }
                label={<Typography variant="body2">Show pagination</Typography>}
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={config?.results?.allowSorting ?? true}
                    onChange={(e) =>
                      handleResultsConfigChange({ allowSorting: e.target.checked })
                    }
                  />
                }
                label={<Typography variant="body2">Allow column sorting</Typography>}
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={config?.results?.allowSelection ?? false}
                    onChange={(e) =>
                      handleResultsConfigChange({ allowSelection: e.target.checked })
                    }
                  />
                }
                label={<Typography variant="body2">Allow row selection</Typography>}
              />
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
