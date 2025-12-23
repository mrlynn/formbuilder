'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Box, Typography, Paper, Chip, alpha } from '@mui/material';
import { Warning, TrendingDown } from '@mui/icons-material';

interface FieldDropOffData {
  fieldPath: string;
  fieldLabel: string;
  viewCount: number;
  interactionCount: number;
  completionCount: number;
  abandonmentCount: number;
  abandonmentRate: number;
  averageTimeSpent: number;
}

interface FieldDropOffChartProps {
  data: FieldDropOffData[];
  title?: string;
  highlightThreshold?: number;  // Highlight fields with abandonment rate above this
}

/**
 * Get color based on abandonment rate severity
 */
function getDropOffColor(abandonmentRate: number): string {
  if (abandonmentRate >= 20) return '#f44336';  // Red - Critical
  if (abandonmentRate >= 10) return '#ff9800';  // Orange - Warning
  if (abandonmentRate >= 5) return '#ffeb3b';   // Yellow - Attention
  return '#4caf50';  // Green - Good
}

/**
 * Custom tooltip for the chart
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as FieldDropOffData;

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        maxWidth: 280,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {data.fieldLabel}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Views:</strong> {data.viewCount}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Interactions:</strong> {data.interactionCount}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Completions:</strong> {data.completionCount}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: data.abandonmentRate >= 10 ? 'error.main' : 'text.secondary',
            fontWeight: data.abandonmentRate >= 10 ? 600 : 400,
          }}
        >
          <strong>Abandoned here:</strong> {data.abandonmentCount} ({data.abandonmentRate.toFixed(1)}%)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Avg. time:</strong> {data.averageTimeSpent.toFixed(1)}s
        </Typography>
      </Box>
    </Paper>
  );
}

export function FieldDropOffChart({
  data,
  title = 'Field Drop-off Analysis',
  highlightThreshold = 10,
}: FieldDropOffChartProps) {
  if (data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No field interaction data available yet.
          <br />
          Data will appear once users start filling out your form.
        </Typography>
      </Paper>
    );
  }

  // Find problematic fields
  const problematicFields = data.filter(d => d.abandonmentRate >= highlightThreshold);

  // Prepare chart data with truncated labels
  const chartData = data.map(d => ({
    ...d,
    displayLabel: d.fieldLabel.length > 20
      ? d.fieldLabel.substring(0, 17) + '...'
      : d.fieldLabel,
  }));

  return (
    <Box>
      {title && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingDown sx={{ color: '#ff9800' }} />
          <Typography variant="h6">
            {title}
          </Typography>
        </Box>
      )}

      {/* Problem Fields Alert */}
      {problematicFields.length > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: alpha('#f44336', 0.05),
            border: '1px solid',
            borderColor: alpha('#f44336', 0.2),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Warning sx={{ color: 'error.main', mt: 0.25 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main' }}>
                {problematicFields.length} field{problematicFields.length > 1 ? 's' : ''} with high abandonment
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {problematicFields.slice(0, 5).map(field => (
                  <Chip
                    key={field.fieldPath}
                    label={`${field.fieldLabel} (${field.abandonmentRate.toFixed(0)}%)`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                ))}
                {problematicFields.length > 5 && (
                  <Chip
                    label={`+${problematicFields.length - 5} more`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            dataKey="displayLabel"
            type="category"
            tick={{ fontSize: 11 }}
            width={140}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={highlightThreshold}
            stroke="#f44336"
            strokeDasharray="5 5"
            label={{
              value: `${highlightThreshold}% threshold`,
              position: 'top',
              fill: '#f44336',
              fontSize: 10,
            }}
          />
          <Bar
            dataKey="abandonmentRate"
            name="Abandonment Rate"
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getDropOffColor(entry.abandonmentRate)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: 0.5 }} />
          <Typography variant="caption" color="text.secondary">&lt;5% (Good)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#ffeb3b', borderRadius: 0.5 }} />
          <Typography variant="caption" color="text.secondary">5-10% (Attention)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#ff9800', borderRadius: 0.5 }} />
          <Typography variant="caption" color="text.secondary">10-20% (Warning)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', borderRadius: 0.5 }} />
          <Typography variant="caption" color="text.secondary">&gt;20% (Critical)</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default FieldDropOffChart;
