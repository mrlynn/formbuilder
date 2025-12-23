'use client';

import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
} from '@mui/material';
import { useState } from 'react';

interface ResponseFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

export function ResponseFilters({
  filters,
  onFiltersChange,
  onClose,
}: ResponseFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared = {};
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={localFilters.status || ''}
              label="Status"
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  status: e.target.value || undefined,
                })
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="incomplete">Incomplete</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Device Type</InputLabel>
            <Select
              value={localFilters.deviceType || ''}
              label="Device Type"
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  deviceType: e.target.value || undefined,
                })
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="mobile">Mobile</MenuItem>
              <MenuItem value="desktop">Desktop</MenuItem>
              <MenuItem value="tablet">Tablet</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            type="date"
            label="Start Date"
            size="small"
            fullWidth
            value={localFilters.dateRange?.start ? new Date(localFilters.dateRange.start).toISOString().split('T')[0] : ''}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                dateRange: {
                  ...localFilters.dateRange,
                  start: e.target.value ? new Date(e.target.value) : undefined,
                },
              })
            }
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            type="date"
            label="End Date"
            size="small"
            fullWidth
            value={localFilters.dateRange?.end ? new Date(localFilters.dateRange.end).toISOString().split('T')[0] : ''}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                dateRange: {
                  ...localFilters.dateRange,
                  end: e.target.value ? new Date(e.target.value) : undefined,
                },
              })
            }
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={handleClear}>
          Clear
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          sx={{
            background: 'linear-gradient(135deg, #00ED64 0%, #4DFF9F 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #00CC55 0%, #3DFF8F 100%)',
            },
          }}
        >
          Apply Filters
        </Button>
      </Box>
    </Box>
  );
}

