'use client';

import { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  alpha,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { ContentCopy, Check, Description, Schema, Edit, ChevronRight } from '@mui/icons-material';
import { useState } from 'react';
import { FieldConfig } from '@/types/form';
import { evaluateFormula } from '@/utils/computedFields';

interface DocumentPreviewProps {
  fieldConfigs: FieldConfig[];
  formData: Record<string, any>;
}

export function DocumentPreview({ fieldConfigs, formData }: DocumentPreviewProps) {
  const [copied, setCopied] = useState(false);

  // Build the MongoDB document from form data
  const document = useMemo(() => {
    const doc: Record<string, any> = {};

    for (const field of fieldConfigs) {
      if (!field.included) continue;
      // Skip fields marked as not included in document
      if (field.includeInDocument === false) continue;
      // Skip layout fields
      if (field.layout) continue;

      let value: any;

      // Handle computed fields
      if (field.computed) {
        value = evaluateFormula(field.computed.formula, formData, fieldConfigs);

        // Convert to appropriate type
        if (field.computed.outputType === 'number') {
          value = Number(value) || 0;
        } else if (field.computed.outputType === 'boolean') {
          value = Boolean(value);
        } else {
          value = String(value);
        }
      } else {
        value = getNestedValue(formData, field.path);
      }

      // Skip empty optional fields
      if (!field.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Set the value using the original path structure
      setNestedValue(doc, field.path, value);
    }

    return doc;
  }, [fieldConfigs, formData]);

  const jsonString = JSON.stringify(document, null, 2);
  const isEmpty = Object.keys(document).length === 0;

  // Get included data fields (not layout fields)
  const includedDataFields = fieldConfigs.filter(f =>
    f.included &&
    !f.layout &&
    f.includeInDocument !== false
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Syntax highlighting for JSON
  const highlightedJson = useMemo(() => {
    return jsonString
      .replace(/(".*?"):/g, '<span class="json-key">$1</span>:')
      .replace(/: (".*?")/g, ': <span class="json-string">$1</span>')
      .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/: (null)/g, ': <span class="json-null">$1</span>');
  }, [jsonString]);

  // Generate schema preview showing expected document structure
  const schemaPreview = useMemo(() => {
    const schema: Record<string, any> = {};

    for (const field of includedDataFields) {
      const placeholder = getTypePlaceholder(field.type, field.path);
      setNestedValue(schema, field.path, placeholder);
    }

    return JSON.stringify(schema, null, 2);
  }, [includedDataFields]);

  // Highlighted schema
  const highlightedSchema = useMemo(() => {
    return schemaPreview
      .replace(/(".*?"):/g, '<span class="json-key">$1</span>:')
      .replace(/: (".*?")/g, ': <span class="json-string">$1</span>')
      .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/: (null)/g, ': <span class="json-null">$1</span>')
      .replace(/: (\[\])/g, ': <span class="json-null">$1</span>')
      .replace(/: (\{\})/g, ': <span class="json-null">$1</span>');
  }, [schemaPreview]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Document Preview
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isEmpty ? 'Expected document structure' : 'MongoDB document to insert'}
          </Typography>
        </Box>
        <Tooltip title={copied ? 'Copied!' : 'Copy JSON'}>
          <span>
            <IconButton size="small" onClick={handleCopy} disabled={isEmpty}>
              {copied ? (
                <Check fontSize="small" sx={{ color: '#00ED64' }} />
              ) : (
                <ContentCopy fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {isEmpty ? (
          // Empty state - show schema structure and helpful guidance
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Schema structure */}
            {includedDataFields.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Schema fontSize="small" sx={{ color: '#00ED64' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#00ED64' }}>
                    Expected Document Schema
                  </Typography>
                  <Chip
                    label={`${includedDataFields.length} fields`}
                    size="small"
                    sx={{ height: 18, fontSize: '0.65rem', bgcolor: alpha('#00ED64', 0.1), color: '#00ED64' }}
                  />
                </Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: '#1e1e1e',
                    border: '1px solid',
                    borderColor: alpha('#00ED64', 0.3),
                    borderRadius: 1,
                    overflow: 'auto',
                    '& .json-key': { color: '#9cdcfe' },
                    '& .json-string': { color: '#ce9178' },
                    '& .json-number': { color: '#b5cea8' },
                    '& .json-boolean': { color: '#569cd6' },
                    '& .json-null': { color: '#6a9955' }
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      color: '#d4d4d4',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                    dangerouslySetInnerHTML={{ __html: highlightedSchema }}
                  />
                </Paper>

                {/* Field list */}
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                    Fields to be included:
                  </Typography>
                  <List dense sx={{ py: 0 }}>
                    {includedDataFields.slice(0, 6).map((field) => (
                      <ListItem key={field.path} sx={{ py: 0.25, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>
                          <ChevronRight fontSize="small" sx={{ color: 'text.disabled', fontSize: 14 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                                {field.path}
                              </Typography>
                              <Chip
                                label={field.type}
                                size="small"
                                sx={{ height: 16, fontSize: '0.6rem', bgcolor: alpha('#00ED64', 0.1), color: '#00ED64' }}
                              />
                              {field.required && (
                                <Chip
                                  label="required"
                                  size="small"
                                  sx={{ height: 16, fontSize: '0.6rem', bgcolor: alpha('#ff9800', 0.1), color: '#ff9800' }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                    {includedDataFields.length > 6 && (
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 3, fontStyle: 'italic' }}>
                        +{includedDataFields.length - 6} more fields...
                      </Typography>
                    )}
                  </List>
                </Box>

                {/* Guidance */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mt: 1,
                    bgcolor: alpha('#2196f3', 0.05),
                    border: '1px solid',
                    borderColor: alpha('#2196f3', 0.2),
                    borderRadius: 1,
                    display: 'flex',
                    gap: 1.5
                  }}
                >
                  <Edit fontSize="small" sx={{ color: '#2196f3', mt: 0.25 }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#2196f3', display: 'block' }}>
                      Start filling the form
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Enter data in the Form Preview panel to see the live document update here.
                    </Typography>
                  </Box>
                </Paper>
              </>
            ) : (
              // No fields included
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200,
                  textAlign: 'center',
                  color: 'text.secondary'
                }}
              >
                <Description sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                <Typography variant="body2" sx={{ mb: 1 }}>
                  No fields included in document
                </Typography>
                <Typography variant="caption">
                  Enable fields in the Field Configuration panel to build your document
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          // Document has data - show the actual document
          <>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: '#1e1e1e',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'auto',
                '& .json-key': { color: '#9cdcfe' },
                '& .json-string': { color: '#ce9178' },
                '& .json-number': { color: '#b5cea8' },
                '& .json-boolean': { color: '#569cd6' },
                '& .json-null': { color: '#569cd6' }
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: '#d4d4d4',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
                dangerouslySetInnerHTML={{ __html: highlightedJson }}
              />
            </Paper>

            {/* Field count summary */}
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {Object.keys(flattenObject(document)).length} fields
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Blob([jsonString]).size} bytes
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

// Helper to get placeholder value based on type
function getTypePlaceholder(type: string, path: string): any {
  switch (type) {
    case 'string':
    case 'email':
    case 'url':
    case 'textarea':
      return `<${type}>`;
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'date':
      return '<date>';
    case 'array':
      return [];
    case 'array-object':
      return [{}];
    case 'object':
      return {};
    default:
      return `<${type}>`;
  }
}

// Helper functions
function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let value: any = obj;
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      return undefined;
    }
  }
  return value;
}

function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let target = obj;
  for (const key of keys) {
    if (!target[key]) target[key] = {};
    target = target[key];
  }
  target[lastKey] = value;
}

function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], newKey));
    } else {
      result[newKey] = obj[key];
    }
  }

  return result;
}
