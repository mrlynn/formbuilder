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

interface CompletionFunnelChartProps {
  data: Array<{ stage: string; count: number; percentage: number }>;
  title?: string;
}

export function CompletionFunnelChart({
  data,
  title = 'Completion Funnel',
}: CompletionFunnelChartProps) {
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
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            dataKey="stage"
            type="category"
            tick={{ fontSize: 12 }}
            width={100}
          />
          <Tooltip
            formatter={(value: any, name: any, props: any) => [
              `${value ?? 0} (${props.payload?.percentage?.toFixed(1) || 0}%)`,
              'Count',
            ]}
          />
          <Legend />
          <Bar dataKey="count" fill="#00ED64" name="Responses" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

