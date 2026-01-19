'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  type Theme,
  type ResolvedTheme,
  getStoredTheme,
  setStoredTheme,
  resolveTheme,
  applyTheme,
  onSystemThemeChange,
} from '@/lib/utils/theme';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    setResolvedTheme(resolveTheme(stored));
    setMounted(true);
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    setResolvedTheme(resolveTheme(theme));
  }, [theme, mounted]);

  // Listen for system theme changes when using "system" preference
  useEffect(() => {
    if (!mounted || theme !== 'system') return;

    const unsubscribe = onSystemThemeChange((systemTheme) => {
      setResolvedTheme(systemTheme);
      applyTheme('system');
    });

    return unsubscribe;
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setStoredTheme(newTheme);
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
