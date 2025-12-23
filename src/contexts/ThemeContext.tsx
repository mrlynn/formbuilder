'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { getDesignTokens } from '@/theme/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'formbuilder-theme-mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize with dark as default, will be updated on mount
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setModeState(savedMode);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setModeState(prefersDark ? 'dark' : 'light');
    }
    setMounted(true);
  }, []);

  // Save preference when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  }, [mode, mounted]);

  const toggleTheme = () => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  // Create theme based on mode
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleTheme,
      setMode,
    }),
    [mode]
  );

  // Prevent flash by not rendering until mounted
  // Use a minimal wrapper to avoid layout shift
  if (!mounted) {
    return (
      <MuiThemeProvider theme={createTheme(getDesignTokens('dark'))}>
        <CssBaseline />
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </MuiThemeProvider>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a default implementation for SSR/build time
    return {
      mode: 'dark',
      toggleTheme: () => {},
      setMode: () => {},
    };
  }
  return context;
}
