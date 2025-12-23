import { ThemeOptions, createTheme } from '@mui/material/styles';

type ThemeMode = 'light' | 'dark';

// Shared design elements
const sharedTypography = {
  fontFamily: '"Inter", -apple-system, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
  h1: {
    fontWeight: 700,
    letterSpacing: '-0.02em'
  },
  h2: {
    fontWeight: 700,
    letterSpacing: '-0.01em'
  },
  h3: {
    fontWeight: 600,
    letterSpacing: '-0.01em'
  },
  h4: {
    fontWeight: 600
  },
  h5: {
    fontWeight: 600
  },
  h6: {
    fontWeight: 600,
    fontSize: '1rem'
  },
  body1: {
    fontSize: '0.9375rem',
    lineHeight: 1.6
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5
  },
  button: {
    textTransform: 'none' as const,
    fontWeight: 500
  }
};

const sharedShape = {
  borderRadius: 8
};

// Dark theme palette
const darkPalette = {
  mode: 'dark' as const,
  primary: {
    main: '#00ED64', // MongoDB green
    light: '#4DFF9F',
    dark: '#00B84A',
    contrastText: '#000'
  },
  secondary: {
    main: '#00684A', // MongoDB dark green
    light: '#00966B',
    dark: '#004A33'
  },
  background: {
    default: '#0a0e14',
    paper: '#141920'
  },
  text: {
    primary: '#e6edf3',
    secondary: '#8b949e'
  },
  divider: 'rgba(110, 118, 129, 0.2)',
  error: {
    main: '#f85149',
    light: '#ff6b6b',
    dark: '#d32f2f'
  },
  success: {
    main: '#00ED64',
    light: '#4DFF9F',
    dark: '#00B84A'
  },
  warning: {
    main: '#d29922',
    light: '#f1a43c',
    dark: '#b08800'
  },
  info: {
    main: '#58a6ff',
    light: '#79c0ff',
    dark: '#388bfd'
  }
};

// Light theme palette
const lightPalette = {
  mode: 'light' as const,
  primary: {
    main: '#00684A', // MongoDB dark green for light mode
    light: '#00966B',
    dark: '#004A33',
    contrastText: '#fff'
  },
  secondary: {
    main: '#00ED64', // MongoDB bright green as secondary
    light: '#4DFF9F',
    dark: '#00B84A'
  },
  background: {
    default: '#f5f7f9',
    paper: '#ffffff'
  },
  text: {
    primary: '#1a1a2e',
    secondary: '#5c6370'
  },
  divider: 'rgba(0, 0, 0, 0.08)',
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828'
  },
  success: {
    main: '#00684A',
    light: '#00966B',
    dark: '#004A33'
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100'
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b'
  }
};

// Dark shadows
const darkShadows: ThemeOptions['shadows'] = [
  'none',
  '0 1px 3px rgba(0, 0, 0, 0.3)',
  '0 2px 6px rgba(0, 0, 0, 0.3)',
  '0 4px 12px rgba(0, 0, 0, 0.4)',
  '0 8px 24px rgba(0, 0, 0, 0.4)',
  '0 12px 32px rgba(0, 0, 0, 0.5)',
  '0 16px 48px rgba(0, 0, 0, 0.5)',
  '0 20px 64px rgba(0, 0, 0, 0.6)',
  '0 24px 80px rgba(0, 0, 0, 0.6)',
  '0 28px 96px rgba(0, 0, 0, 0.7)',
  '0 32px 112px rgba(0, 0, 0, 0.7)',
  '0 36px 128px rgba(0, 0, 0, 0.8)',
  '0 40px 144px rgba(0, 0, 0, 0.8)',
  '0 44px 160px rgba(0, 0, 0, 0.9)',
  '0 48px 176px rgba(0, 0, 0, 0.9)',
  '0 52px 192px rgba(0, 0, 0, 1)',
  '0 56px 208px rgba(0, 0, 0, 1)',
  '0 60px 224px rgba(0, 0, 0, 1)',
  '0 64px 240px rgba(0, 0, 0, 1)',
  '0 68px 256px rgba(0, 0, 0, 1)',
  '0 72px 272px rgba(0, 0, 0, 1)',
  '0 76px 288px rgba(0, 0, 0, 1)',
  '0 80px 304px rgba(0, 0, 0, 1)',
  '0 84px 320px rgba(0, 0, 0, 1)',
  '0 88px 336px rgba(0, 0, 0, 1)'
];

// Light shadows
const lightShadows: ThemeOptions['shadows'] = [
  'none',
  '0 1px 3px rgba(0, 0, 0, 0.08)',
  '0 2px 6px rgba(0, 0, 0, 0.08)',
  '0 4px 12px rgba(0, 0, 0, 0.1)',
  '0 8px 24px rgba(0, 0, 0, 0.1)',
  '0 12px 32px rgba(0, 0, 0, 0.12)',
  '0 16px 48px rgba(0, 0, 0, 0.12)',
  '0 20px 64px rgba(0, 0, 0, 0.14)',
  '0 24px 80px rgba(0, 0, 0, 0.14)',
  '0 28px 96px rgba(0, 0, 0, 0.16)',
  '0 32px 112px rgba(0, 0, 0, 0.16)',
  '0 36px 128px rgba(0, 0, 0, 0.18)',
  '0 40px 144px rgba(0, 0, 0, 0.18)',
  '0 44px 160px rgba(0, 0, 0, 0.2)',
  '0 48px 176px rgba(0, 0, 0, 0.2)',
  '0 52px 192px rgba(0, 0, 0, 0.22)',
  '0 56px 208px rgba(0, 0, 0, 0.22)',
  '0 60px 224px rgba(0, 0, 0, 0.24)',
  '0 64px 240px rgba(0, 0, 0, 0.24)',
  '0 68px 256px rgba(0, 0, 0, 0.26)',
  '0 72px 272px rgba(0, 0, 0, 0.26)',
  '0 76px 288px rgba(0, 0, 0, 0.28)',
  '0 80px 304px rgba(0, 0, 0, 0.28)',
  '0 84px 320px rgba(0, 0, 0, 0.3)',
  '0 88px 336px rgba(0, 0, 0, 0.3)'
];

// Component overrides for dark mode
const darkComponents: ThemeOptions['components'] = {
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        border: '1px solid rgba(110, 118, 129, 0.1)'
      },
      elevation1: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(110, 118, 129, 0.1)'
      },
      elevation2: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(110, 118, 129, 0.1)'
      },
      elevation3: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(110, 118, 129, 0.1)'
      }
    }
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        padding: '8px 16px',
        transition: 'all 0.2s ease'
      },
      contained: {
        boxShadow: '0 2px 8px rgba(0, 237, 100, 0.3)',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 237, 100, 0.4)',
          transform: 'translateY(-1px)'
        }
      }
    }
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        border: '1px solid rgba(110, 118, 129, 0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'rgba(0, 237, 100, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 237, 100, 0.15)'
        }
      }
    }
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          transition: 'all 0.2s ease',
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 237, 100, 0.5)'
            }
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00ED64',
              borderWidth: 2
            }
          }
        }
      }
    }
  }
};

// Component overrides for light mode
const lightComponents: ThemeOptions['components'] = {
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        border: '1px solid rgba(0, 0, 0, 0.06)'
      },
      elevation1: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04)'
      },
      elevation2: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)'
      },
      elevation3: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04)'
      }
    }
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        padding: '8px 16px',
        transition: 'all 0.2s ease'
      },
      contained: {
        boxShadow: '0 2px 8px rgba(0, 104, 74, 0.2)',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 104, 74, 0.3)',
          transform: 'translateY(-1px)'
        }
      }
    }
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        border: '1px solid rgba(0, 0, 0, 0.06)',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'rgba(0, 104, 74, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 104, 74, 0.1)'
        }
      }
    }
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          transition: 'all 0.2s ease',
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 104, 74, 0.5)'
            }
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00684A',
              borderWidth: 2
            }
          }
        }
      }
    }
  }
};

// Get design tokens based on mode
export function getDesignTokens(mode: ThemeMode): ThemeOptions {
  return {
    palette: mode === 'dark' ? darkPalette : lightPalette,
    typography: sharedTypography,
    shape: sharedShape,
    shadows: mode === 'dark' ? darkShadows : lightShadows,
    components: mode === 'dark' ? darkComponents : lightComponents
  };
}

// Default theme export (dark mode) for backward compatibility
export const theme = createTheme(getDesignTokens('dark'));

// Named theme exports
export const darkTheme = createTheme(getDesignTokens('dark'));
export const lightTheme = createTheme(getDesignTokens('light'));
