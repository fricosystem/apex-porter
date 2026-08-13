'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';

// Theme color values matching the CSS variables
const THEME_COLORS = {
  light: '#059669', // emerald-600 (matches :root --primary)
  dark: '#34d399',  // emerald-400 (matches .dark --primary)
  login: '#030d09', // very dark green (matches login page background)
};

export default function ThemeColorUpdater() {
  const { theme, resolvedTheme } = useTheme();
  const { isAuthenticated } = useAppStore();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;

    // Login page always uses the dark login background color
    if (!isAuthenticated) {
      meta.setAttribute('content', THEME_COLORS.login);
      return;
    }

    // App pages: match the header's bg-primary color
    const currentTheme = resolvedTheme || theme || 'light';
    meta.setAttribute('content', currentTheme === 'dark' ? THEME_COLORS.dark : THEME_COLORS.light);
  }, [theme, resolvedTheme, isAuthenticated]);

  return null;
}
