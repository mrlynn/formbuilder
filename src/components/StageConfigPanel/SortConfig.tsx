'use client';

import { useState } from 'react';
import { Box, TextField, Button, Typography, IconButton, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { usePipeline } from '@/contexts/PipelineContext';
import { FieldAutocomplete } from '@/components/FieldAutocomplete/FieldAutocomplete';

interface SortField {
  field: string;
  direction: '1' | '-1';
}

interface SortConfigProps {
  nodeId: string;
}

export function SortConfig({ nodeId }: SortConfigProps) {
  const { nodes, dispatch } = usePipeline();
  const node = nodes.find((n) => n.id === nodeId);
  const config = node?.data.config || {};

  const [fields, setFields] = useState<SortField[]>(() => {
    if (Object.keys(config).length > 0) {
      return Object.entries(config).map(([field, direction]: [string, any]) => {
        const dirStr = String(direction);
        return {
          field,
          direction: (dirStr === '1' || dirStr === '-1' ? dirStr : '1') as '1' | '-1'
        };
      });
    }
    return [{ field: '', direction: '1' as const }];
  });

  const updateConfig = (newFields: SortField[]) => {
    const sortConfig: Record<string, 1 | -1> = {};
    newFields.forEach((f) => {
      if (f.field) {
        sortConfig[f.field] = Number(f.direction) as 1 | -1;
      }
    });

    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        nodeId,
        updates: { config: sortConfig }
      }
    });
  };

  const addField = () => {
    const newFields: SortField[] = [...fields, { field: '', direction: '1' as const }];
    setFields(newFields);
    updateConfig(newFields);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
    updateConfig(newFields);
  };

  const updateField = (index: number, updates: Partial<SortField>) => {
    const newFields = fields.map((f, i) => {
      if (i === index) {
        const updated = { ...f, ...updates };
        // Ensure direction is always '1' | '-1'
        if (updates.direction) {
          updated.direction = (updates.direction === '1' || updates.direction === '-1'
            ? updates.direction
            : '1') as '1' | '-1';
        }
        return updated;
      }
      return f;
    });
    setFields(newFields);
    updateConfig(newFields);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Sort Fields
      </Typography>

      {fields.map((field, index) => (
        <Box
          key={index}
          sx={{
            p: 2,
            mb: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FieldAutocomplete
              value={field.field}
              onChange={(value) => updateField(index, { field: value })}
              label="Field"
              placeholder="Type field name..."
              size="small"
              fullWidth
              allowCustom={true}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Direction</InputLabel>
              <Select
                value={field.direction}
                label="Direction"
                onChange={(e) => {
                  const dir = e.target.value === '1' || e.target.value === '-1' ? e.target.value : '1';
                  updateField(index, { direction: dir as '1' | '-1' });
                }}
              >
                <MenuItem value="1">Ascending</MenuItem>
                <MenuItem value="-1">Descending</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              size="small"
              onClick={() => removeField(index)}
              color="error"
              disabled={fields.length === 1}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ))}

      <Button
        startIcon={<Add />}
        onClick={addField}
        variant="outlined"
        size="small"
        sx={{ mt: 1 }}
      >
        Add Sort Field
      </Button>
    </Box>
  );
}

