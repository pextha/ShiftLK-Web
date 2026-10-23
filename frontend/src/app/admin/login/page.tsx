'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rawRedirect = searchParams.get('redirect');
  const redirectUrl = rawRedirect
    ? (rawRedirect.startsWith('/admin') ? rawRedirect : `/admin${rawRedirect.startsWith('/') ? '' : '/'}${rawRedirect}`)
    : '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push(redirectUrl);
    } catch (err: any) {
      if (err.status === 429) {
        setError(
          err.message ||
            'Access from this device is temporarily locked due to too many failed attempts. Please wait 10 minutes before retrying.'
        );
      } else {
        setError(err.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background neon ambient blur */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-brand-neon/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/80">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-neon/15 border border-brand-neon/40 flex items-center justify-center mb-4 shadow-lg shadow-brand-neon/10">
              <span className="font-black text-brand-neon text-2xl tracking-tighter">S</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              ShiftLK <span className="text-brand-neon font-bold">Admin</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Internal store administration & real-time inventory management
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-950/70 border border-rose-800/80 rounded-2xl flex items-start gap-3 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Admin / Staff Email"
                type="email"
                placeholder="admin@shiftlk.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] p-1 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={loading} className="w-full py-2.5 text-sm font-bold">
                Sign In to Admin Portal
              </Button>
            </div>
          </form>

          {/* Footer Notice */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
            <p>Protected area for authorized ShiftLK personnel only.</p>
            <p className="mt-1">
              Need access? Contact the super administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
          Loading portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
