'use client';

import { useState } from 'react';
import { Box, TextField, Button, Typography, IconButton, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { usePipeline } from '@/contexts/PipelineContext';
import { FieldAutocomplete } from '@/components/FieldAutocomplete/FieldAutocomplete';

interface Accumulator {
  field: string;
  operator: string;
  expression: string;
}

interface GroupConfigProps {
  nodeId: string;
}

export function GroupConfig({ nodeId }: GroupConfigProps) {
  const { nodes, dispatch } = usePipeline();
  const node = nodes.find((n) => n.id === nodeId);
  const config = node?.data.config || { _id: null };

  const [idField, setIdField] = useState<string>(() => {
    // Handle both string and null values for _id
    if (config._id === null || config._id === undefined) return '';
    const idValue = String(config._id);
    // Remove $ prefix if present for display (FieldAutocomplete will add it back)
    return idValue.replace(/^\$/, '');
  });
  const [accumulators, setAccumulators] = useState<Accumulator[]>(() => {
    const accs: Accumulator[] = [];
    Object.entries(config).forEach(([key, value]) => {
      if (key !== '_id' && typeof value === 'object' && value !== null) {
        const operator = Object.keys(value)[0];
        accs.push({
          field: key,
          operator: operator.replace('$', ''),
          expression: String(value[operator])
        });
      }
    });
    return accs.length > 0 ? accs : [{ field: '', operator: 'sum', expression: '' }];
  });

  const updateConfig = () => {
    // Ensure _id is properly formatted: if idField has value, add $ prefix
    // If it's empty, set to null
    let _idValue: string | null = null;
    if (idField && idField.trim() !== '') {
      const cleanField = idField.replace(/^\$/, ''); // Remove any existing $
      _idValue = `$${cleanField}`; // Always add $ prefix for field reference
    }
    
    const groupConfig: Record<string, any> = {
      _id: _idValue
    };

    accumulators.forEach((acc) => {
      if (acc.field && acc.expression) {
        groupConfig[acc.field] = {
          [`$${acc.operator}`]: acc.expression.startsWith('$') ? acc.expression : parseValue(acc.expression)
        };
      }
    });

    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        nodeId,
        updates: { config: groupConfig }
      }
    });
  };

  const parseValue = (value: string): any => {
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return value;
  };

  const handleIdChange = (value: string) => {
    // FieldAutocomplete with prefix="$" will pass value with $, but we store without $
    const cleanValue = value ? value.replace(/^\$/, '') : '';
    setIdField(cleanValue);
    // Update config immediately with the new value
    const groupConfig: Record<string, any> = {
      _id: cleanValue && cleanValue.trim() !== '' ? `$${cleanValue}` : null
    };
    
    accumulators.forEach((acc) => {
      if (acc.field && acc.expression) {
        groupConfig[acc.field] = {
          [`$${acc.operator}`]: acc.expression.startsWith('$') ? acc.expression : parseValue(acc.expression)
        };
      }
    });

    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        nodeId,
        updates: { config: groupConfig }
      }
    });
  };

  const addAccumulator = () => {
    setAccumulators([...accumulators, { field: '', operator: 'sum', expression: '' }]);
  };

  const removeAccumulator = (index: number) => {
    const newAccs = accumulators.filter((_, i) => i !== index);
    setAccumulators(newAccs);
    setTimeout(updateConfig, 100);
  };

  const updateAccumulator = (index: number, updates: Partial<Accumulator>) => {
    const newAccs = accumulators.map((acc, i) =>
      i === index ? { ...acc, ...updates } : acc
    );
    setAccumulators(newAccs);
    setTimeout(updateConfig, 100);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Group Configuration
      </Typography>

      <FieldAutocomplete
        value={idField}
        onChange={(value) => {
          // FieldAutocomplete with prefix will return value with $, but we store without $
          const cleanValue = value ? value.replace(/^\$/, '') : '';
          handleIdChange(cleanValue);
        }}
        label="Group By (_id)"
        placeholder="Type field name or leave empty..."
        size="small"
        fullWidth
        prefix="$"
        helperText="Leave empty to group all documents together"
        allowCustom={true}
      />

      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Accumulators
      </Typography>

      {accumulators.map((acc, index) => (
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
              value={acc.field}
              onChange={(value) => updateAccumulator(index, { field: value })}
              label="Field Name"
              placeholder="Type field name..."
              size="small"
              fullWidth
              allowCustom={true}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Operator</InputLabel>
              <Select
                value={acc.operator}
                label="Operator"
                onChange={(e) => updateAccumulator(index, { operator: e.target.value })}
              >
                <MenuItem value="sum">Sum</MenuItem>
                <MenuItem value="avg">Average</MenuItem>
                <MenuItem value="min">Minimum</MenuItem>
                <MenuItem value="max">Maximum</MenuItem>
                <MenuItem value="first">First</MenuItem>
                <MenuItem value="last">Last</MenuItem>
                <MenuItem value="push">Push</MenuItem>
                <MenuItem value="addToSet">Add to Set</MenuItem>
                <MenuItem value="count">Count</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Expression"
              size="small"
              value={acc.expression}
              onChange={(e) => updateAccumulator(index, { expression: e.target.value })}
              sx={{ flex: 1 }}
              placeholder="e.g., $price or 1"
            />
            <IconButton
              size="small"
              onClick={() => removeAccumulator(index)}
              color="error"
              disabled={accumulators.length === 1}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ))}

      <Button
        startIcon={<Add />}
        onClick={addAccumulator}
        variant="outlined"
        size="small"
        sx={{ mt: 1 }}
      >
        Add Accumulator
      </Button>
    </Box>
  );
}

