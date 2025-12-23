'use client';

import { ReactNode } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';

// Clean theme for public forms
const formTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#00ED64',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default function FormsLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={formTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
}
