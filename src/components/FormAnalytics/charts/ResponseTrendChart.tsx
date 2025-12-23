'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

interface ResponseTrendChartProps {
  data: Array<{ date: string; count: number }>;
  title?: string;
}

export function ResponseTrendChart({ data, title = 'Response Trend' }: ResponseTrendChartProps) {
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
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value: number | undefined) => [value ?? 0, 'Responses']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#00ED64"
            strokeWidth={2}
            dot={{ fill: '#00ED64', r: 4 }}
            name="Responses"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

