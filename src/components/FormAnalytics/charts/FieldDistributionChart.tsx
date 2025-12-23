'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, Paper, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useState } from 'react';

interface FieldDistributionChartProps {
  data: Array<{ value: string; count: number; percentage: number }>;
  title?: string;
  fieldName?: string;
}

const COLORS = [
  '#00ED64',
  '#4DFF9F',
  '#00CC55',
  '#3DFF8F',
  '#00B84D',
  '#2ECC71',
  '#27AE60',
  '#229954',
  '#1E8449',
  '#196F3D',
];

export function FieldDistributionChart({
  data,
  title,
  fieldName,
}: FieldDistributionChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Paper>
    );
  }

  const chartData = data.map(item => ({
    name: item.value,
    value: item.count,
    percentage: item.percentage,
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {title && (
          <Typography variant="h6">
            {title}
          </Typography>
        )}
        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={(_, newType) => newType && setChartType(newType)}
          size="small"
        >
          <ToggleButton value="pie">Pie</ToggleButton>
          <ToggleButton value="bar">Bar</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'pie' ? (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, payload }: any) => `${name}: ${payload?.percentage?.toFixed(1) || 0}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any, props: any) => [
                `${value ?? 0} (${props.payload?.percentage?.toFixed(1) || 0}%)`,
                'Count',
              ]}
            />
            <Legend />
          </PieChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: any, name: any, props: any) => [
                `${value ?? 0} (${props.payload?.percentage?.toFixed(1) || 0}%)`,
                'Count',
              ]}
            />
            <Legend />
            <Bar dataKey="value" fill="#00ED64" name="Responses" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}

