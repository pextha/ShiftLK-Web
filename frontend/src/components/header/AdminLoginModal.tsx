'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, X, ExternalLink, LogOut, CheckCircle2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || '/admin';

  // Check if session cookie is already active when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setCheckingAuth(true);
      fetch(`${apiUrl}/admin/auth/me`, {
        method: 'GET',
        credentials: 'include',
      })
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data) => {
          if (data && data.data) {
            setCurrentUser(data.data);
          } else if (data && data.id) {
            setCurrentUser(data);
          } else {
            setCurrentUser(null);
          }
        })
        .catch(() => setCurrentUser(null))
        .finally(() => setCheckingAuth(false));
    }
  }, [isOpen, apiUrl]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(
            data?.error?.message ||
              'Access from this device is temporarily locked due to too many failed attempts. Please retry in 10 minutes.'
          );
        }
        throw new Error(data?.error?.message || 'Invalid email or password');
      }

      // Redirect to admin panel
      const target = adminUrl.endsWith('/admin') ? `${adminUrl}/dashboard` : `${adminUrl}/admin/dashboard`;
      window.location.href = target;
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setCurrentUser(null);
    } catch {}
  };

  const handleGoToAdmin = () => {
    const target = adminUrl.endsWith('/admin') ? `${adminUrl}/dashboard` : `${adminUrl}/admin/dashboard`;
    window.location.href = target;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#0b0f19] border border-[#1e293b] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/15 border border-[#ccff00]/40 flex items-center justify-center text-[#ccff00]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              ShiftLK <span className="text-[#ccff00]">Admin</span>
            </h2>
            <p className="text-xs text-slate-400">
              Internal store & inventory administration
            </p>
          </div>
        </div>

        {checkingAuth ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Checking session status...
          </div>
        ) : currentUser ? (
          /* User is already authenticated */
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#0e1422] border border-[#212c42] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center font-bold text-sm">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoToAdmin}
                className="w-full flex items-center justify-center gap-2 bg-[#ccff00] hover:bg-[#b8e600] text-black py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-[#ccff00]/10"
              >
                <span>Open Admin Dashboard</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-rose-400 py-2.5 rounded-2xl font-bold text-xs border border-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@shiftlk.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#ccff00] hover:bg-[#b8e600] disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#ccff00]/10 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Enter Admin Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-500 pt-2">
              ShiftLK Internal Store Staff & Administrator Access Only.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
