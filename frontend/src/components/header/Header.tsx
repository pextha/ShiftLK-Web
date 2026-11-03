'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import StickySearchBar from './StickySearchBar';
import {
  Menu,
  X,
  Truck,
  ShieldCheck,
  Flame,
  Shield,
  PackageSearch,
  ShoppingCart,
} from 'lucide-react';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';
import AdminLoginModal from './AdminLoginModal';
import { useCart } from '@/lib/cart-context';

export default function Header() {
  const locale = useLocale();
  const isIndic = locale === 'si' || locale === 'ta';
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      ['/products', '/track-order', '/delivery', '/returns', '/about', '/contact'].forEach((path) => {
        router.prefetch(path);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [router]);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const { totalItemsCount, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#06080d]/95 backdrop-blur-md border-b border-[#1c2436]">
      {/* Top micro banner */}
      <div className="bg-[#090d16] border-b border-[#1a2334] text-xs font-semibold py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
            <span className="bg-[#ccff00] text-black text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-sm shrink-0">
              Islandwide
            </span>
            <span className="text-slate-300 hidden sm:inline text-[11px] truncate">
              Doorstep Delivery to all 25 Districts in Sri Lanka.
            </span>
            <span className="text-slate-300 sm:hidden text-[11px] truncate">
              All 25 Districts Delivery Available
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-bold shrink-0">
            <Link
              href="/track-order"
              className="hidden sm:flex items-center gap-1 text-slate-300 hover:text-[#ccff00] transition-colors whitespace-nowrap"
            >
              <PackageSearch className="w-3.5 h-3.5 text-[#ccff00] shrink-0" />
              <span>{t('trackOrder')}</span>
            </Link>
            <a
              href="https://wa.me/94770871018"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#ccff00] hover:text-white transition-colors whitespace-nowrap"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#ccff00] shrink-0" />
              <span>WhatsApp: 077 087 1018</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 xl:gap-4">
          {/* Brand Logo with Polgasowita Badge (always shown across EN, SI, TA on desktop) */}
          <Link href="/" className="flex items-center gap-2.5 group py-1 shrink-0" aria-label="ShiftLK Spares Home">
            <div className="relative h-9 sm:h-11 flex items-center">
              <Image
                src="/assets/shiftlk-logo-dark.png"
                alt="ShiftLK Spares - Precious Parts For Every Ride"
                width={165}
                height={64}
                priority
                className="h-9 sm:h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="hidden xl:flex flex-col border-l border-slate-800 pl-2.5 shrink-0">
              <span className="text-[10px] text-[#ccff00] font-black tracking-widest uppercase leading-tight">
                Polgasowita
              </span>
              <span className="text-[9px] text-slate-400 font-medium leading-tight">
                Sri Lanka
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className={`hidden lg:flex items-center justify-center whitespace-nowrap font-semibold text-slate-300 ${
              isIndic
                ? 'text-[11.5px] xl:text-xs gap-2 xl:gap-3'
                : 'text-xs xl:text-[13px] gap-2.5 xl:gap-4'
            }`}
          >
            <Link
              href="/"
              className="hover:text-[#ccff00] transition-colors shrink-0 whitespace-nowrap"
            >
              <span>{t('home')}</span>
            </Link>
            <Link
              href="/products"
              className="hover:text-[#ccff00] transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <Flame className="w-3.5 h-3.5 text-[#ccff00] shrink-0" />
              <span>{t('products')}</span>
            </Link>
            <Link
              href="/track-order"
              className="hover:text-[#ccff00] transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <PackageSearch className="w-3.5 h-3.5 text-[#ccff00] shrink-0" />
              <span>{t('trackOrder')}</span>
            </Link>
            <Link
              href="/delivery"
              className="hover:text-[#ccff00] transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <Truck className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#ccff00] shrink-0" />
              <span>{t('delivery')}</span>
            </Link>
            <Link
              href="/returns"
              className="hover:text-[#ccff00] transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{t('returns')}</span>
            </Link>
            <Link
              href="/about"
              className="hover:text-[#ccff00] transition-colors shrink-0 whitespace-nowrap"
            >
              <span>{t('about')}</span>
            </Link>
            <Link
              href="/contact"
              className="hover:text-[#ccff00] transition-colors shrink-0 whitespace-nowrap"
            >
              <span>{t('contact')}</span>
            </Link>
          </nav>

          {/* Actions & Language Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Always-visible Language Switcher */}
            <LanguageSwitcher />

            {/* Shopping Cart Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-300 hover:text-[#ccff00] hover:bg-[#0e1422] rounded-xl border border-[#212c42]/80 hover:border-[#ccff00]/40 transition-colors cursor-pointer shrink-0"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ccff00] text-black text-[10px] font-black flex items-center justify-center shadow-md">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Subtle Staff / Admin Portal Entry Icon */}
            <button
              type="button"
              onClick={() => setAdminModalOpen(true)}
              className="p-2 text-slate-400 hover:text-[#ccff00] hover:bg-[#0e1422] rounded-xl border border-[#212c42]/60 hover:border-[#ccff00]/40 transition-colors cursor-pointer shrink-0"
              title="Staff & Admin Portal"
              aria-label="Staff & Admin Portal"
            >
              <Shield className="w-4 h-4" />
            </button>

            {/* Direct WhatsApp Hotline Button */}
            <a
              href="https://wa.me/94770871018"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-black px-3 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-95 shrink-0 whitespace-nowrap"
              title="Chat with Spare Parts Specialist"
            >
              <WhatsAppIcon className="w-4 h-4 text-black shrink-0" />
              <span>WhatsApp</span>
            </a>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white bg-[#0e1422] border border-[#212c42] rounded-xl cursor-pointer shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Sticky Search Bar row */}
        <div className="mt-2.5">
          <StickySearchBar />
        </div>
      </div>

      {/* Mobile drawer navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#1c2436] bg-[#06080d]/98 backdrop-blur-xl px-4 py-4 space-y-3">
          <div className="flex flex-col space-y-1.5 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-[#0e1422] text-slate-200 hover:text-[#ccff00] transition-colors"
            >
              {t('home')}
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-[#0e1422] text-slate-200 hover:text-[#ccff00] flex items-center justify-between transition-colors"
            >
              <span>{t('products')}</span>
              <span className="text-[10px] font-black bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 px-2 py-0.5 rounded-full">
                In Stock
              </span>
            </Link>
            <Link
              href="/track-order"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-[#0e1422] text-slate-200 hover:text-[#ccff00] flex items-center gap-2 transition-colors"
            >
              <PackageSearch className="w-4 h-4 text-[#ccff00]" />
              <span>{t('trackOrder')}</span>
            </Link>
            <Link
              href="/delivery"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-[#0e1422] text-slate-200 hover:text-[#ccff00] transition-colors"
            >
              {t('delivery')} (25 Districts)
            </Link>
            <Link
              href="/returns"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-[#0e1422] text-slate-200 hover:text-[#ccff00] transition-colors"
            >
              {t('returns')}
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-[#0e1422] text-slate-200 hover:text-[#ccff00] transition-colors"
            >
              {t('about')}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-[#0e1422] text-slate-200 hover:text-[#ccff00] transition-colors"
            >
              {t('contact')}
            </Link>
          </div>

          <div className="pt-2 border-t border-[#1c2436] flex flex-col gap-2">
            <a
              href="https://wa.me/94770871018"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-black py-3 rounded-xl text-sm font-black shadow-lg"
            >
              <WhatsAppIcon className="w-5 h-5 text-black" />
              <span>{tCommon('fastSupport')} (077 087 1018)</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setAdminModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-[#ccff00] py-2 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[#ccff00]" />
              <span>Staff & Admin Portal</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Login Modal Entry Point */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
    </header>
  );
}
