'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

interface NumberDistributionChartProps {
  data: Array<{ range: string; count: number }>;
  title?: string;
  fieldName?: string;
}

export function NumberDistributionChart({
  data,
  title,
  fieldName,
}: NumberDistributionChartProps) {
  if (data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number | undefined) => [value ?? 0, 'Count']}
            labelFormatter={(label) => `Range: ${label}`}
          />
          <Legend />
          <Bar dataKey="count" fill="#00ED64" name="Frequency" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

