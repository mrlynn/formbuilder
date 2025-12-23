'use client';

import { Box, Typography, Button, Container, Grid, Paper, alpha, Chip } from '@mui/material';
import {
  ArrowForward,
  GitHub,
  Storage,
  CheckCircle,
  Rule,
  Link as LinkIcon,
  ViewCarousel,
  Publish,
  Functions,
  Analytics,
  History,
  Webhook,
  DragIndicator,
  Visibility,
  Speed,
} from '@mui/icons-material';
import Link from 'next/link';

const features = [
  {
    icon: <Storage sx={{ fontSize: 32 }} />,
    title: 'Schema Import',
    description: 'Auto-generate fields from your MongoDB collection schema. Connect and import in seconds.',
  },
  {
    icon: <CheckCircle sx={{ fontSize: 32 }} />,
    title: 'Smart Validation',
    description: 'Built-in validation rules with real-time feedback. Required fields, patterns, min/max values.',
  },
  {
    icon: <Rule sx={{ fontSize: 32 }} />,
    title: 'Conditional Logic',
    description: 'Show or hide fields based on user input. Create dynamic, intelligent forms.',
  },
  {
    icon: <LinkIcon sx={{ fontSize: 32 }} />,
    title: 'Lookup Fields',
    description: 'Reference data from other collections with autocomplete. Build relational forms.',
  },
  {
    icon: <ViewCarousel sx={{ fontSize: 32 }} />,
    title: 'Multi-Page Forms',
    description: 'Break long forms into manageable steps. Track progress and improve completion rates.',
  },
  {
    icon: <Publish sx={{ fontSize: 32 }} />,
    title: 'One-Click Publish',
    description: 'Share forms instantly with a public URL. Collect responses immediately.',
  },
];

const steps = [
  {
    icon: <DragIndicator sx={{ fontSize: 40 }} />,
    title: 'Design',
    description: 'Start from scratch or import fields from your MongoDB collection schema.',
  },
  {
    icon: <Visibility sx={{ fontSize: 40 }} />,
    title: 'Configure',
    description: 'Add validation, conditional logic, and customize the look and feel.',
  },
  {
    icon: <Speed sx={{ fontSize: 40 }} />,
    title: 'Publish',
    description: 'Share your form with a public URL and start collecting responses.',
  },
];

const advancedFeatures = [
  { icon: <Functions />, title: 'Computed Fields', description: 'Formula-based fields that calculate values automatically' },
  { icon: <Analytics />, title: 'Response Analytics', description: 'Track submissions with charts and export to CSV' },
  { icon: <History />, title: 'Version History', description: 'Track changes and revert to previous versions' },
  { icon: <Webhook />, title: 'Webhook Integration', description: 'Send form data to external services' },
];

export default function LandingPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#001E2B' }}>
      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 },
          background: 'radial-gradient(ellipse at top, rgba(0, 237, 100, 0.1) 0%, transparent 50%)'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip
              label="Open Source"
              icon={<GitHub sx={{ fontSize: 16 }} />}
              sx={{
                mb: 3,
                bgcolor: alpha('#00ED64', 0.1),
                color: '#00ED64',
                fontWeight: 600,
                '& .MuiChip-icon': { color: '#00ED64' }
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                fontWeight: 700,
                color: '#fff',
                mb: 2,
                lineHeight: 1.2
              }}
            >
              FormBuilder
              <Box
                component="span"
                sx={{
                  display: 'block',
                  background: 'linear-gradient(135deg, #00ED64 0%, #4DFF9F 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Build MongoDB Forms in Minutes
              </Box>
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: alpha('#fff', 0.7),
                maxWidth: 700,
                mx: 'auto',
                mb: 4,
                fontWeight: 400,
                lineHeight: 1.6
              }}
            >
              Create beautiful, validated data entry forms connected directly to your MongoDB collections.
              No coding required.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                href="/builder"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #00ED64 0%, #00CC55 100%)',
                  color: '#001E2B',
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00FF6A 0%, #00ED64 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0, 237, 100, 0.3)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Create Your First Form
              </Button>
              <Button
                component={Link}
                href="/my-forms"
                variant="outlined"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderColor: alpha('#fff', 0.3),
                  color: '#fff',
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#00ED64',
                    bgcolor: alpha('#00ED64', 0.1)
                  }
                }}
              >
                My Forms
              </Button>
            </Box>
            <Typography
              variant="body2"
              sx={{ mt: 2, color: alpha('#fff', 0.5) }}
            >
              No signup required to get started
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: alpha('#000', 0.2) }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              color: '#fff',
              mb: 2
            }}
          >
            Everything You Need
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: alpha('#fff', 0.6),
              mb: 6,
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            Powerful features to build professional forms connected to MongoDB.
          </Typography>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    bgcolor: alpha('#fff', 0.03),
                    border: '1px solid',
                    borderColor: alpha('#fff', 0.1),
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: alpha('#00ED64', 0.05),
                      borderColor: alpha('#00ED64', 0.3),
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: alpha('#00ED64', 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00ED64',
                      mb: 2
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              color: '#fff',
              mb: 6
            }}
          >
            How It Works
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            {steps.map((step, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: alpha('#00ED64', 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00ED64',
                      mx: 'auto',
                      mb: 3,
                      position: 'relative',
                    }}
                  >
                    {step.icon}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: '#00ED64',
                        color: '#001E2B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}
                    >
                      {index + 1}
                    </Box>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: alpha('#fff', 0.6), maxWidth: 280, mx: 'auto' }}>
                    {step.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Advanced Features Section */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: alpha('#000', 0.2) }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              color: '#fff',
              mb: 4
            }}
          >
            Advanced Features
          </Typography>

          <Grid container spacing={2}>
            {advancedFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.03)
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: alpha('#00ED64', 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00ED64',
                      flexShrink: 0
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#fff', mb: 0.5 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.5) }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background: 'linear-gradient(180deg, transparent 0%, rgba(0, 237, 100, 0.05) 100%)'
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 6 },
              textAlign: 'center',
              bgcolor: alpha('#00ED64', 0.05),
              border: '1px solid',
              borderColor: alpha('#00ED64', 0.2),
              borderRadius: 4
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>
              Ready to build your first form?
            </Typography>
            <Typography variant="body1" sx={{ color: alpha('#fff', 0.6), mb: 4, maxWidth: 500, mx: 'auto' }}>
              Start creating MongoDB-connected forms in minutes.
              No signup required.
            </Typography>
            <Button
              component={Link}
              href="/builder"
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              sx={{
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #00ED64 0%, #00CC55 100%)',
                color: '#001E2B',
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #00FF6A 0%, #00ED64 100%)'
                }
              }}
            >
              Start Building Now
            </Button>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          borderTop: '1px solid',
          borderColor: alpha('#fff', 0.1)
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.4) }}>
              Built with MongoDB, Next.js, and MUI
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Typography
                component="a"
                href="https://github.com/mrlynn/aggregation-builder"
                target="_blank"
                variant="body2"
                sx={{
                  color: alpha('#fff', 0.4),
                  textDecoration: 'none',
                  '&:hover': { color: '#00ED64' }
                }}
              >
                GitHub
              </Typography>
              <Typography
                component="a"
                href="https://mongodb.com"
                target="_blank"
                variant="body2"
                sx={{
                  color: alpha('#fff', 0.4),
                  textDecoration: 'none',
                  '&:hover': { color: '#00ED64' }
                }}
              >
                MongoDB
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
