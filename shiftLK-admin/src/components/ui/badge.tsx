import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'neon' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors select-none',
        variant === 'default' && 'bg-slate-800 text-slate-200 border border-slate-700',
        variant === 'neon' && 'bg-brand-neon/15 text-brand-neon border border-brand-neon/30',
        variant === 'success' && 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60',
        variant === 'warning' && 'bg-amber-950/80 text-amber-300 border border-amber-800/60',
        variant === 'danger' && 'bg-rose-950/80 text-rose-300 border border-rose-800/60',
        variant === 'info' && 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60',
        variant === 'outline' && 'text-slate-300 border border-slate-700',
        className
      )}
      {...props}
    />
  );
}
