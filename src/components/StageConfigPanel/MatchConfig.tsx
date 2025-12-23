'use client';

import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, IconButton, Select, MenuItem, FormControl, InputLabel, Chip } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { usePipeline } from '@/contexts/PipelineContext';
import { FieldAutocomplete } from '@/components/FieldAutocomplete/FieldAutocomplete';

interface MatchCondition {
  field: string;
  operator: string;
  value: string;
}

interface MatchConfigProps {
  nodeId: string;
}

export function MatchConfig({ nodeId }: MatchConfigProps) {
  const { nodes, dispatch } = usePipeline();
  const node = nodes.find((n) => n.id === nodeId);
  const config = node?.data.config || {};

  const [conditions, setConditions] = useState<MatchCondition[]>(() => {
    // Parse existing config into conditions
    if (Object.keys(config).length > 0) {
      return Object.entries(config).map(([field, value]: [string, any]) => {
        if (typeof value === 'object' && value !== null) {
          const operator = Object.keys(value)[0];
          return {
            field,
            operator: operator.replace('$', ''),
            value: String(value[operator])
          };
        }
        return { field, operator: 'eq', value: String(value) };
      });
    }
    return [{ field: '', operator: 'eq', value: '' }];
  });

  const updateConfig = (newConditions: MatchCondition[]) => {
    const matchConfig: Record<string, any> = {};
    
    newConditions.forEach((cond) => {
      if (cond.field && cond.value) {
        const operatorKey = cond.operator === 'eq' ? '' : `$${cond.operator}`;
        if (operatorKey) {
          matchConfig[cond.field] = { [operatorKey]: parseValue(cond.value) };
        } else {
          matchConfig[cond.field] = parseValue(cond.value);
        }
      }
    });

    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        nodeId,
        updates: { config: matchConfig }
      }
    });
  };

  const parseValue = (value: string): any => {
    // Try to parse as number
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }
    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    // Return as string
    return value;
  };

  const addCondition = () => {
    const newConditions = [...conditions, { field: '', operator: 'eq', value: '' }];
    setConditions(newConditions);
    updateConfig(newConditions);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
    updateConfig(newConditions);
  };

  const updateCondition = (index: number, updates: Partial<MatchCondition>) => {
    const newConditions = conditions.map((cond, i) =>
      i === index ? { ...cond, ...updates } : cond
    );
    setConditions(newConditions);
    updateConfig(newConditions);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Filter Conditions
      </Typography>

      {conditions.map((condition, index) => (
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
          <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
            <FieldAutocomplete
              value={condition.field}
              onChange={(value) => updateCondition(index, { field: value })}
              label="Field"
              placeholder="Type field name..."
              size="small"
              fullWidth
              allowCustom={true}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Operator</InputLabel>
              <Select
                value={condition.operator}
                label="Operator"
                onChange={(e) => updateCondition(index, { operator: e.target.value })}
              >
                <MenuItem value="eq">Equals</MenuItem>
                <MenuItem value="ne">Not Equals</MenuItem>
                <MenuItem value="gt">Greater Than</MenuItem>
                <MenuItem value="gte">Greater or Equal</MenuItem>
                <MenuItem value="lt">Less Than</MenuItem>
                <MenuItem value="lte">Less or Equal</MenuItem>
                <MenuItem value="in">In</MenuItem>
                <MenuItem value="nin">Not In</MenuItem>
                <MenuItem value="regex">Regex</MenuItem>
                <MenuItem value="exists">Exists</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Value"
              size="small"
              value={condition.value}
              onChange={(e) => updateCondition(index, { value: e.target.value })}
              sx={{ flex: 1 }}
              placeholder="e.g., active"
            />
            <IconButton
              size="small"
              onClick={() => removeCondition(index)}
              color="error"
              disabled={conditions.length === 1}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ))}

      <Button
        startIcon={<Add />}
        onClick={addCondition}
        variant="outlined"
        size="small"
        sx={{ mt: 1 }}
      >
        Add Condition
      </Button>
    </Box>
  );
}

