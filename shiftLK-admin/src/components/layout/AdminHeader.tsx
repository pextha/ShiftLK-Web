'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  ExternalLink,
  Lock,
  LogOut,
  User,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { ChangePasswordDialog } from './ChangePasswordDialog';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const customerSiteUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & breadcrumb/badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 lg:hidden transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-neon/10 text-brand-neon border border-brand-neon/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-pulse" />
              Live System
            </span>
          </div>
        </div>

        {/* Right: Quick Customer Store Link & User Profile Dropdown */}
        <div className="flex items-center gap-3">
          {/* Quick link to customer-facing website */}
          <Link
            href={customerSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Open customer website in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-brand-neon" />
            <span>Customer Store</span>
          </Link>

          {/* User Profile Pill & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-brand-neon/20 border border-brand-neon/30 flex items-center justify-center text-brand-neon text-xs font-black shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-100 leading-tight">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-brand-neon capitalize font-medium">
                  {user?.role?.toLowerCase() || 'staff'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-40 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <p className="text-xs font-bold text-white truncate">
                      {user?.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user?.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-brand-neon uppercase font-bold tracking-wider">
                      <Shield className="w-3 h-3" />
                      {user?.role}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setChangePasswordOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    Change Password
                  </button>

                  <a
                    href={customerSiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    Visit Customer Site
                  </a>

                  <div className="my-1 border-t border-slate-800" />

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </>
  );
}
