'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative p-2 text-slate-300 hover:text-brand-neon bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-brand-neon/50 transition-colors cursor-pointer shrink-0"
      title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
      aria-label={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
    >
      {isLight ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </button>
  );
}
