'use client';

import { Box, Paper, Typography, Grid, alpha } from '@mui/material';
import { FieldStatistics } from '@/types/form';
import { FieldDistributionChart } from './charts/FieldDistributionChart';
import { NumberDistributionChart } from './charts/NumberDistributionChart';

interface FieldAnalyticsProps {
  fieldStats: FieldStatistics;
}

export function FieldAnalytics({ fieldStats }: FieldAnalyticsProps) {
  const { fieldPath, fieldType, totalResponses, completionRate, textStats, numberStats, choiceStats, booleanStats, dateStats } = fieldStats;

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {fieldPath} ({fieldType})
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <Paper
            sx={{
              p: 2,
              bgcolor: alpha('#00ED64', 0.1),
              border: '1px solid',
              borderColor: alpha('#00ED64', 0.3),
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Total Responses
            </Typography>
            <Typography variant="h5">{totalResponses}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            sx={{
              p: 2,
              bgcolor: alpha('#00ED64', 0.1),
              border: '1px solid',
              borderColor: alpha('#00ED64', 0.3),
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Completion Rate
            </Typography>
            <Typography variant="h5">{completionRate.toFixed(1)}%</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Text field stats */}
      {textStats && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Text Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">
                Average Length: {textStats.averageLength.toFixed(1)} characters
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                Total Words: {textStats.wordCount}
              </Typography>
            </Grid>
            {textStats.commonWords && textStats.commonWords.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Most Common Words:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {textStats.commonWords.slice(0, 10).map(({ word, count }) => (
                    <Paper
                      key={word}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        bgcolor: alpha('#00ED64', 0.1),
                        border: '1px solid',
                        borderColor: alpha('#00ED64', 0.3),
                      }}
                    >
                      <Typography variant="caption">
                        {word} ({count})
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Number field stats */}
      {numberStats && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Number Statistics
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2">
                Min: {numberStats.min}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2">
                Max: {numberStats.max}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2">
                Average: {numberStats.average.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2">
                Median: {numberStats.median.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
          {numberStats.distribution && numberStats.distribution.length > 0 && (
            <NumberDistributionChart
              data={numberStats.distribution}
              fieldName={fieldPath}
            />
          )}
        </Box>
      )}

      {/* Choice field stats */}
      {choiceStats?.options && choiceStats.options.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <FieldDistributionChart
            data={choiceStats.options}
            title="Choice Distribution"
            fieldName={fieldPath}
          />
        </Box>
      )}

      {/* Boolean field stats */}
      {booleanStats && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Boolean Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: alpha('#00ED64', 0.1),
                  border: '1px solid',
                  borderColor: alpha('#00ED64', 0.3),
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  True
                </Typography>
                <Typography variant="h6">
                  {booleanStats.trueCount} ({booleanStats.truePercentage.toFixed(1)}%)
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: alpha('#00ED64', 0.1),
                  border: '1px solid',
                  borderColor: alpha('#00ED64', 0.3),
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  False
                </Typography>
                <Typography variant="h6">
                  {booleanStats.falseCount} ({booleanStats.falsePercentage.toFixed(1)}%)
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Date field stats */}
      {dateStats && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Date Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">
                Earliest: {new Date(dateStats.earliest).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                Latest: {new Date(dateStats.latest).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
}

