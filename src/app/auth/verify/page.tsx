'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Button,
  alpha,
  Checkbox,
  FormControlLabel,
  useTheme,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, ArrowForward } from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { verifyMagicLink, isAuthenticated, refreshSession } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your login link...');
  const [trustDevice, setTrustDevice] = useState(true);

  const token = searchParams.get('token');
  const returnUrl = searchParams.get('returnUrl');

  // Determine redirect destination (with security check)
  const getDestination = () => {
    if (returnUrl) {
      const decoded = decodeURIComponent(returnUrl);
      // Security: only allow relative paths starting with /
      if (decoded.startsWith('/') && !decoded.startsWith('//')) {
        return decoded;
      }
    }
    return '/builder';
  };

  // Theme-aware colors
  const bgColor = isDark ? '#001E2B' : '#f5f7fa';
  const textColor = isDark ? '#fff' : '#1a1a2e';
  const textSecondary = isDark ? alpha('#fff', 0.6) : alpha('#000', 0.6);
  const textMuted = isDark ? alpha('#fff', 0.4) : alpha('#000', 0.4);
  const borderColor = isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1);
  const paperBg = isDark ? alpha('#fff', 0.03) : '#ffffff';

  // Use ref to prevent double verification in React Strict Mode
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification link');
      return;
    }

    // Prevent double verification
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verify = async () => {
      const result = await verifyMagicLink(token, trustDevice);

      if (result.success) {
        setStatus('success');
        setMessage('Successfully signed in!');

        // Refresh session to ensure it's loaded before redirect
        await refreshSession();

        // Redirect after a brief pause to the original destination
        setTimeout(() => {
          router.push(getDestination());
        }, 1000);
      } else {
        setStatus('error');
        setMessage(result.message || 'Verification failed');
      }
    };

    verify();
  }, [token, trustDevice, verifyMagicLink, router, refreshSession]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={isDark ? 0 : 2}
          sx={{
            p: 5,
            textAlign: 'center',
            bgcolor: paperBg,
            border: '1px solid',
            borderColor: borderColor,
            borderRadius: 3,
          }}
        >
          {status === 'loading' && (
            <>
              <CircularProgress
                size={64}
                sx={{ color: '#00ED64', mb: 3 }}
              />
              <Typography variant="h5" sx={{ fontWeight: 600, color: textColor, mb: 1 }}>
                Verifying...
              </Typography>
              <Typography sx={{ color: textSecondary }}>
                {message}
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: alpha('#00ED64', 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <CheckCircle sx={{ fontSize: 48, color: '#00ED64' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: textColor, mb: 1 }}>
                Welcome!
              </Typography>
              <Typography sx={{ color: textSecondary, mb: 3 }}>
                {message}
              </Typography>
              <Typography variant="caption" sx={{ color: textMuted }}>
                Redirecting to the app...
              </Typography>
            </>
          )}

          {status === 'error' && (
            <>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: alpha('#f44336', 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <ErrorIcon sx={{ fontSize: 48, color: '#f44336' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: textColor, mb: 1 }}>
                Verification Failed
              </Typography>
              <Typography sx={{ color: textSecondary, mb: 4 }}>
                {message}
              </Typography>
              <Button
                component={Link}
                href="/auth/login"
                variant="contained"
                endIcon={<ArrowForward />}
                sx={{
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #00ED64 0%, #00CC55 100%)',
                  color: '#001E2B',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00FF6A 0%, #00ED64 100%)',
                  },
                }}
              >
                Try Again
              </Button>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress sx={{ color: '#00ED64' }} />
        </Box>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
