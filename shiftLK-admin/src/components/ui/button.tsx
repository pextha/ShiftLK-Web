'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-bold transition-all rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]',
          variant === 'default' && 'bg-brand-neon hover:bg-brand-neon-hover text-black shadow-lg shadow-brand-neon/15',
          variant === 'outline' && 'border border-slate-700 hover:border-slate-500 bg-slate-900/60 text-slate-200 hover:text-white',
          variant === 'ghost' && 'text-slate-300 hover:text-white hover:bg-slate-800/60',
          variant === 'danger' && 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40',
          variant === 'secondary' && 'bg-slate-800 hover:bg-slate-700 text-slate-100',
          size === 'sm' && 'text-xs px-3 py-1.5 gap-1.5',
          size === 'md' && 'text-sm px-4 py-2 gap-2',
          size === 'lg' && 'text-base px-6 py-3 gap-2.5',
          size === 'icon' && 'p-2 aspect-square',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
