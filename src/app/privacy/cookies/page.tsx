'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  alpha,
  useTheme,
  Divider,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { AppNavBar } from '@/components/Navigation/AppNavBar';
import { useConsent } from '@/contexts/ConsentContext';
import {
  COOKIE_DEFINITIONS,
  CATEGORY_INFO,
  CookieCategory,
  CONSENT_VERSION,
} from '@/types/consent';

const categoryColors: Record<CookieCategory, string> = {
  essential: '#00ED64',
  functional: '#3b82f6',
  analytics: '#f59e0b',
  marketing: '#ef4444',
};

export default function CookiePolicyPage() {
  const theme = useTheme();
  const { showPreferences } = useConsent();

  const lastUpdated = 'December 22, 2025';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppNavBar />

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(135deg, #00ED64 0%, #4DFF9F 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Cookie Policy
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Version {CONSENT_VERSION} • Last updated: {lastUpdated}
        </Typography>

        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={showPreferences}
          sx={{ mb: 4 }}
        >
          Manage Cookie Preferences
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.2),
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" fontWeight={600} gutterBottom>
            What Are Cookies?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Cookies are small text files that are stored on your device when you visit
            a website. They help websites remember your preferences and provide a better
            user experience. Some cookies are essential for the website to function,
            while others help us understand how you use the site.
          </Typography>

          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
            How We Use Cookies
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We use cookies for several purposes:
          </Typography>
          <ul style={{ color: theme.palette.text.secondary }}>
            <li>To keep you signed in and maintain your session</li>
            <li>To remember your preferences and settings</li>
            <li>To understand how you use our service and improve it</li>
            <li>To show you relevant content and advertisements</li>
          </ul>

          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
            Your Choices
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You have control over which cookies you allow. Essential cookies cannot be
            disabled as they are required for the website to function. For all other
            categories, you can choose to accept or reject them.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You can change your preferences at any time by clicking the &quot;Manage Cookie
            Preferences&quot; button above or visiting your{' '}
            <a href="/settings?tab=privacy" style={{ color: theme.palette.primary.main }}>
              Privacy Settings
            </a>
            .
          </Typography>
        </Paper>

        {/* Cookie Categories */}
        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
          Cookie Categories
        </Typography>

        {(Object.keys(CATEGORY_INFO) as CookieCategory[]).map((category) => {
          const info = CATEGORY_INFO[category];
          const cookies = COOKIE_DEFINITIONS.filter((c) => c.category === category);

          return (
            <Paper
              key={category}
              elevation={0}
              sx={{
                p: 3,
                mb: 2,
                border: '1px solid',
                borderColor: alpha(categoryColors[category], 0.3),
                borderRadius: 2,
                bgcolor: alpha(categoryColors[category], 0.02),
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                  label={info.title}
                  size="small"
                  sx={{
                    bgcolor: alpha(categoryColors[category], 0.2),
                    color: categoryColors[category],
                    fontWeight: 600,
                  }}
                />
                {info.required && (
                  <Chip
                    label="Required"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              <Typography variant="body1" color="text.secondary" paragraph>
                {info.description}
              </Typography>

              {cookies.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Cookie Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Purpose</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Provider</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cookies.map((cookie) => (
                        <TableRow key={cookie.name}>
                          <TableCell>
                            <code
                              style={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: '0.85rem',
                              }}
                            >
                              {cookie.name}
                            </code>
                          </TableCell>
                          <TableCell>{cookie.purpose}</TableCell>
                          <TableCell>{cookie.duration}</TableCell>
                          <TableCell>
                            {cookie.provider === 'first-party' ? (
                              <Chip label="First Party" size="small" variant="outlined" />
                            ) : (
                              <Chip label={cookie.provider} size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          );
        })}

        {/* Legal Information */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mt: 4,
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.2),
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Your Rights
          </Typography>

          <Typography variant="h6" fontWeight={500} gutterBottom sx={{ mt: 3 }}>
            Under GDPR (European Union)
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            If you are in the European Union, you have the right to:
          </Typography>
          <ul style={{ color: theme.palette.text.secondary }}>
            <li>Access your personal data</li>
            <li>Rectify inaccurate personal data</li>
            <li>Request erasure of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Request restriction of processing</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>

          <Typography variant="h6" fontWeight={500} gutterBottom sx={{ mt: 3 }}>
            Under CCPA (California)
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            If you are a California resident, you have the right to:
          </Typography>
          <ul style={{ color: theme.palette.text.secondary }}>
            <li>Know what personal information is collected</li>
            <li>Know whether your personal information is sold or disclosed</li>
            <li>Say no to the sale of personal information</li>
            <li>Access your personal information</li>
            <li>Request deletion of your personal information</li>
            <li>Not be discriminated against for exercising your rights</li>
          </ul>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" fontWeight={600} gutterBottom>
            Do Not Track
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We respect the Do Not Track (DNT) browser setting. If you have DNT enabled,
            we will not use non-essential cookies unless you explicitly consent.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" fontWeight={600} gutterBottom>
            Managing Cookies in Your Browser
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            In addition to our cookie preferences, you can manage cookies through your
            browser settings. Most browsers allow you to:
          </Typography>
          <ul style={{ color: theme.palette.text.secondary }}>
            <li>View cookies stored on your device</li>
            <li>Delete all or specific cookies</li>
            <li>Block third-party cookies</li>
            <li>Block all cookies (may affect website functionality)</li>
            <li>Clear cookies when you close your browser</li>
          </ul>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" fontWeight={600} gutterBottom>
            Contact Us
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            If you have any questions about our use of cookies or this policy, please
            contact us at:
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Email:{' '}
            <a href="mailto:privacy@example.com" style={{ color: theme.palette.primary.main }}>
              privacy@example.com
            </a>
          </Typography>
        </Paper>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button href="/privacy" variant="text">
            Privacy Policy
          </Button>
          <Button href="/terms" variant="text">
            Terms of Service
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
