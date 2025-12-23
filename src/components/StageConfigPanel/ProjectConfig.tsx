'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  alpha,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { usePipeline } from '@/contexts/PipelineContext';
import { FieldAutocomplete } from '@/components/FieldAutocomplete/FieldAutocomplete';

interface ProjectField {
  name: string;
  value: string | number | boolean;
  type: 'include' | 'exclude' | 'computed';
}

interface ProjectConfigProps {
  nodeId: string;
}

export function ProjectConfig({ nodeId }: ProjectConfigProps) {
  const { nodes, dispatch } = usePipeline();
  const node = nodes.find((n) => n.id === nodeId);

  const [fields, setFields] = useState<ProjectField[]>([]);

  useEffect(() => {
    if (node?.data.config && Object.keys(node.data.config).length > 0) {
      const config = node.data.config;
      const projectFields: ProjectField[] = [];

      Object.entries(config).forEach(([key, value]) => {
        if (value === 1 || value === true) {
          projectFields.push({ name: key, value: 1, type: 'include' });
        } else if (value === 0 || value === false) {
          projectFields.push({ name: key, value: 0, type: 'exclude' });
        } else {
          projectFields.push({ name: key, value: String(value), type: 'computed' });
        }
      });

      setFields(projectFields);
    } else {
      // Default to include _id field
      setFields([{ name: '_id', value: 1, type: 'include' }]);
      // Initialize config with default
      if (!node?.data.config || Object.keys(node.data.config).length === 0) {
        dispatch({
          type: 'UPDATE_NODE',
          payload: {
            nodeId,
            updates: { config: { _id: 1 } }
          }
        });
      }
    }
  }, [node, nodeId, dispatch]);

  const updateConfig = (newFields: ProjectField[]) => {
    const config: Record<string, any> = {};

    newFields.forEach((field) => {
      if (field.name.trim()) {
        if (field.type === 'include') {
          config[field.name] = 1;
        } else if (field.type === 'exclude') {
          config[field.name] = 0;
        } else {
          // For computed fields, try to parse the value
          const trimmedValue = String(field.value).trim();
          if (trimmedValue.startsWith('$')) {
            // Field reference
            config[field.name] = trimmedValue;
          } else if (trimmedValue === 'true' || trimmedValue === 'false') {
            config[field.name] = trimmedValue === 'true';
          } else if (!isNaN(Number(trimmedValue)) && trimmedValue !== '') {
            config[field.name] = Number(trimmedValue);
          } else {
            // String or expression
            config[field.name] = trimmedValue;
          }
        }
      }
    });

    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        nodeId,
        updates: { config }
      }
    });
  };

  const addField = () => {
    const newFields = [...fields, { name: '', value: 1, type: 'include' as const }];
    setFields(newFields);
    updateConfig(newFields);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    if (newFields.length === 0) {
      const emptyField = [{ name: '', value: 1, type: 'include' as const }];
      setFields(emptyField);
      updateConfig(emptyField);
    } else {
      setFields(newFields);
      updateConfig(newFields);
    }
  };

  const updateField = (index: number, updates: Partial<ProjectField>) => {
    const newFields = fields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    setFields(newFields);
    updateConfig(newFields);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Project Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Include, exclude, or compute fields. Use 1 to include, 0 to exclude, or an expression for computed fields.
      </Typography>

      {fields.map((field, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: alpha('#4CAF50', 0.05),
            border: '1px solid',
            borderColor: alpha('#4CAF50', 0.2)
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <FieldAutocomplete
              value={field.name}
              onChange={(value) => updateField(index, { name: value })}
              label="Field Name"
              placeholder="Type field name..."
              size="small"
              fullWidth
              allowCustom={true}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={field.type}
                label="Type"
                onChange={(e) => {
                  const newType = e.target.value as ProjectField['type'];
                  let newValue: string | number | boolean = field.value;
                  
                  if (newType === 'include') {
                    newValue = 1;
                  } else if (newType === 'exclude') {
                    newValue = 0;
                  } else if (newType === 'computed' && typeof field.value === 'number') {
                    newValue = '';
                  }
                  
                  updateField(index, { type: newType, value: newValue });
                }}
              >
                <MenuItem value="include">Include (1)</MenuItem>
                <MenuItem value="exclude">Exclude (0)</MenuItem>
                <MenuItem value="computed">Computed</MenuItem>
              </Select>
            </FormControl>

            {field.type === 'computed' && (
              <TextField
                label="Expression"
                size="small"
                fullWidth
                value={field.value}
                onChange={(e) => updateField(index, { value: e.target.value })}
                placeholder='$fieldName, "$literal", or expression'
                sx={{ flex: 1 }}
                helperText="Use $fieldName for field references, or enter an expression"
              />
            )}

            {field.type !== 'computed' && (
              <Box sx={{ minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Chip
                  label={field.value === 1 || field.value === true ? 'Include' : 'Exclude'}
                  size="small"
                  sx={{
                    bgcolor: field.value === 1 || field.value === true 
                      ? alpha('#4CAF50', 0.2) 
                      : alpha('#f85149', 0.2),
                    color: field.value === 1 || field.value === true ? '#4CAF50' : '#f85149'
                  }}
                />
              </Box>
            )}

            <IconButton
              size="small"
              onClick={() => removeField(index)}
              sx={{ color: 'error.main' }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      ))}

      <Button
        variant="outlined"
        startIcon={<Add />}
        onClick={addField}
        fullWidth
        sx={{ mt: 2 }}
      >
        Add Field
      </Button>

      <Divider sx={{ my: 3 }} />

      <Box
        sx={{
          p: 2,
          bgcolor: alpha('#000', 0.02),
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
          Examples:
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
          <div>• Include: name: 1, email: 1</div>
          <div>• Exclude: password: 0, _id: 0</div>
          <div>• Computed: fullName: "$firstName + ' ' + $lastName"</div>
          <div>• Computed: age: "$year - $birthYear"</div>
        </Typography>
      </Box>
    </Box>
  );
}
