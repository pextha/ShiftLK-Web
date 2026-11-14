'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'dark' | 'light';

interface ThemeContextType {
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = 'shiftlk_theme';
const PERIOD_KEY = 'shiftlk_theme_period';

/**
 * 6:00 AM (06:00) to 5:59 PM (17:59) -> 'light' (day)
 * 6:00 PM (18:00) to 5:59 AM (05:59) -> 'dark' (night)
 */
export function getTimeBasedTheme(date: Date = new Date()): {
  theme: AppTheme;
  periodId: string;
} {
  const hour = date.getHours();
  const isDaytime = hour >= 6 && hour < 18;
  const theme: AppTheme = isDaytime ? 'light' : 'dark';

  // Period ID tracks the specific date + day/night window so manual overrides
  // reset automatically when the next 6:00 AM or 6:00 PM boundary is crossed.
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const periodId = `${year}-${month}-${day}-${isDaytime ? 'DAY' : 'NIGHT'}`;

  return { theme, periodId };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window === 'undefined') return 'dark';
    return getTimeBasedTheme().theme;
  });

  useEffect(() => {
    const syncThemeWithClock = () => {
      const { theme: scheduledTheme, periodId } = getTimeBasedTheme();
      try {
        const savedTheme = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
        const savedPeriod = localStorage.getItem(PERIOD_KEY);

        // If the user manually toggled during this same 6AM-6PM / 6PM-6AM window, respect it.
        // Otherwise (first visit or crossed 6:00 AM / 6:00 PM), auto-switch to scheduledTheme!
        if (
          savedPeriod === periodId &&
          (savedTheme === 'light' || savedTheme === 'dark')
        ) {
          setThemeState(savedTheme);
          document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
          localStorage.setItem(STORAGE_KEY, scheduledTheme);
          localStorage.setItem(PERIOD_KEY, periodId);
          setThemeState(scheduledTheme);
          document.documentElement.setAttribute('data-theme', scheduledTheme);
        }
      } catch {
        setThemeState(scheduledTheme);
        document.documentElement.setAttribute('data-theme', scheduledTheme);
      }
    };

    syncThemeWithClock();

    // Check every 30 seconds so if the clock crosses 6:00 AM or 6:00 PM while open, it switches live
    const interval = setInterval(syncThemeWithClock, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setTheme = (nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    const { periodId } = getTimeBasedTheme();
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
      localStorage.setItem(PERIOD_KEY, periodId);
    } catch {
      // ignore storage errors
    }
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
