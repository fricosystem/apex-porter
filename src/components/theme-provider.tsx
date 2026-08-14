'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'theme';
export const THEMES = ['light', 'dark', 'dark-apex'] as const;

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || 'light';
    const root = document.documentElement;
    root.classList.remove(...THEMES);
    root.classList.add(saved);
    if (saved === 'light' || saved === 'dark') {
      root.style.colorScheme = saved;
    }
  } catch {
    /* ignore storage errors */
  }
}

type ThemeValue = {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  resolvedTheme: string | undefined;
  themes: string[];
  systemTheme?: string;
  forcedTheme?: string;
};

const defaultContext: ThemeValue = {
  theme: undefined,
  setTheme: () => {},
  resolvedTheme: undefined,
  themes: THEMES as unknown as string[],
};

const ThemeContext = createContext<ThemeValue>(defaultContext);

function readStoredTheme(): string {
  if (typeof window === 'undefined') return 'light';
  try {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  } catch {
    return 'light';
  }
}

function applyThemeClass(theme: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(...THEMES);
  root.classList.add(theme);
  if (theme === 'light' || theme === 'dark') {
    root.style.colorScheme = theme;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<string>(() => readStoredTheme());
  const transitionStyleRef = useRef<HTMLStyleElement | null>(null);

  const setTheme = useCallback((next: string) => {
    if (!transitionStyleRef.current && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.appendChild(
        document.createTextNode(
          '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
        )
      );
      document.head.appendChild(style);
      transitionStyleRef.current = style;
    }
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore storage errors */
    }
    applyThemeClass(next);
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
    if (transitionStyleRef.current) {
      window.getComputedStyle(document.body);
      setTimeout(() => {
        transitionStyleRef.current?.remove();
        transitionStyleRef.current = null;
      }, 1);
    }
  }, [theme]);

  const value: ThemeValue = {
    theme,
    setTheme,
    resolvedTheme: theme,
    themes: THEMES as unknown as string[],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
