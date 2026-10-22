import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  ShieldCheck,
  Truck,
  MessageCircle,
} from 'lucide-react';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';

export default function Footer() {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tContact = useTranslations('contact');

  return (
    <footer className="bg-[#05070c] border-t border-[#1a2334] text-slate-400 text-sm mt-20">
      {/* Trust bar */}
      <div className="border-b border-[#1a2334] bg-[#090d16] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/25 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">
                {tCommon('islandwideDelivery')}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {tCommon('islandwideDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/25 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">
                {tCommon('verifiedQuality')}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {tCommon('verifiedQualityDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/25 shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">
                {tCommon('fastSupport')}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {tCommon('fastSupportDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Bio */}
          <div className="space-y-4">
            <Link href="/" className="inline-block group">
              <Image
                src="/assets/shiftlk-logo-dark.png"
                alt="ShiftLK Spares - Precious Parts For Every Ride"
                width={170}
                height={68}
                className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sri Lanka's dedicated motorbike spare parts destination. Specializing in Indian bike spares (Bajaj, Yamaha), custom modifications, body stickers, and helmets in Polgasowita.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#ccff00]/10 border border-[#ccff00]/25 px-2.5 py-1 rounded-lg text-[10px] font-black text-[#ccff00] tracking-wider uppercase">
              Precious Parts For Every Ride
            </div>

            {/* Social media links */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-white mb-2">Connect with Us:</div>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#0f1523] border border-[#1f293d] flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/40 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#0f1523] border border-[#1f293d] flex items-center justify-center text-slate-400 hover:text-white hover:bg-pink-600/20 hover:border-pink-500/40 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#0f1523] border border-[#1f293d] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#0f1523] border border-[#1f293d] flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600/20 hover:border-red-500/40 transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-[#ccff00] transition-colors">
                  {tNav('home')}
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-[#ccff00] transition-colors">
                  {tNav('products')}
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="hover:text-[#ccff00] transition-colors">
                  {tNav('delivery')} (25 Districts)
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-[#ccff00] transition-colors">
                  {tNav('returns')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#ccff00] transition-colors">
                  {tNav('about')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#ccff00] transition-colors">
                  {tNav('contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Business Hours & Sourcing Hub */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Operating Hours
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#ccff00] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Monday - Saturday</div>
                  <div>8:30 AM - 6:30 PM</div>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Sunday & Poya</div>
                  <div>9:00 AM - 2:00 PM (Emergency Dispatch)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Undurugoda Main Store
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#ccff00] shrink-0 mt-0.5" />
                <span>{tContact('address')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#ccff00] shrink-0" />
                <span>{tContact('phone')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#ccff00] shrink-0" />
                <span>{tContact('email')}</span>
              </div>
              <div className="pt-2">
                <a
                  href="https://wa.me/94770871018"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 px-3 py-1.5 rounded-xl font-black hover:bg-[#25D366] hover:text-black transition-all"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>WhatsApp 24/7 Hotline</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-[#1a2334] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} ShiftLK Spares. {tCommon('allRightsReserved')}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/delivery" className="hover:text-white transition-colors">
              Delivery Rates
            </Link>
            <span>•</span>
            <Link href="/returns" className="hover:text-white transition-colors">
              Warranty Terms
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-white transition-colors">
              Undurugoda Polgasowita
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
