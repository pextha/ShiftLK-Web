'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Globe, Check, Sparkles } from 'lucide-react';

export type SupportedLocale = 'en' | 'si' | 'ta';

export const MANUAL_LOCALE_STORAGE_KEY = 'shiftlk_locale_manual';
export const MANUAL_LOCALE_COOKIE_KEY = 'SHIFTLK_LOCALE';

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function persistManualLocale(locale: SupportedLocale) {
  try {
    localStorage.setItem(MANUAL_LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore storage error
  }
  if (typeof document !== 'undefined') {
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `${MANUAL_LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

/**
 * 4-Tier Client-Side Language Detection:
 * 1. Visitor's manually saved choice (localStorage / SHIFTLK_LOCALE cookie)
 * 2. Browser language (navigator.languages: 'ta' -> Tamil, 'si' -> Sinhala)
 * 3. IP Country via Cloudflare cookie ('SHIFTLK_COUNTRY' === 'LK' -> Sinhala, other -> English)
 *    with Sri Lanka timezone ('Asia/Colombo') fallback when running locally without Cloudflare
 * 4. Default: 'en' (English)
 */
export function detectSmartLocale(): {
  recommended: SupportedLocale;
  reason: 'browser_ta' | 'browser_si' | 'country_lk' | 'country_other' | 'default';
} {
  if (typeof window === 'undefined') {
    return { recommended: 'en', reason: 'default' };
  }

  // Tier 2: Browser languages (navigator.languages)
  const browserLangs =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language || ''];

  for (const rawLang of browserLangs) {
    const lang = rawLang.toLowerCase().trim();
    if (lang === 'ta' || lang.startsWith('ta-')) {
      return { recommended: 'ta', reason: 'browser_ta' };
    }
    if (lang === 'si' || lang.startsWith('si-')) {
      return { recommended: 'si', reason: 'browser_si' };
    }
  }

  // Tier 3: Country from Cloudflare IP cookie ('SHIFTLK_COUNTRY') or timezone fallback
  const cfCountry = getCookieValue('SHIFTLK_COUNTRY');
  if (cfCountry) {
    if (cfCountry.toUpperCase() === 'LK') {
      return { recommended: 'si', reason: 'country_lk' };
    }
    return { recommended: 'en', reason: 'country_other' };
  }

  // Fallback for local dev when Cloudflare header isn't present: check Sri Lanka timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Asia/Colombo') {
      return { recommended: 'si', reason: 'country_lk' };
    }
  } catch {
    // ignore
  }

  // Tier 4: Default English
  return { recommended: 'en', reason: 'default' };
}

const LANGUAGE_OPTIONS: {
  code: SupportedLocale;
  nativeTitle: string;
  englishLabel: string;
  subtitle: string;
  badge: string;
}[] = [
  {
    code: 'si',
    nativeTitle: 'සිංහල',
    englishLabel: 'Sinhala',
    subtitle: 'ශ්‍රී ලංකාවේ මෝටර්බයික් අමතර කොටස් ජාලය',
    badge: 'සිං',
  },
  {
    code: 'ta',
    nativeTitle: 'தமிழ்',
    englishLabel: 'Tamil',
    subtitle: 'இலங்கையின் மோட்டார் பைக் உதிரிப்பாகங்கள்',
    badge: 'த',
  },
  {
    code: 'en',
    nativeTitle: 'English',
    englishLabel: 'English',
    subtitle: "Sri Lanka's Motorbike Spare Parts Network",
    badge: 'EN',
  },
];

export default function LanguageWelcomePopup() {
  const currentLocale = useLocale() as SupportedLocale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [recommendedLocale, setRecommendedLocale] =
    useState<SupportedLocale>('si');
  const [selectedLocale, setSelectedLocale] =
    useState<SupportedLocale>(currentLocale);

  useEffect(() => {
    try {
      const savedLocal = localStorage.getItem(
        MANUAL_LOCALE_STORAGE_KEY
      ) as SupportedLocale | null;
      const savedCookie = getCookieValue(
        MANUAL_LOCALE_COOKIE_KEY
      ) as SupportedLocale | null;

      const manualChoice =
        savedLocal && ['en', 'si', 'ta'].includes(savedLocal)
          ? savedLocal
          : savedCookie && ['en', 'si', 'ta'].includes(savedCookie)
          ? savedCookie
          : null;

      // Tier 1: If visitor already manually selected a language previously, keep it synced & don't show popup
      if (manualChoice) {
        persistManualLocale(manualChoice);
        if (manualChoice !== currentLocale) {
          const search = searchParams?.toString();
          const targetUrl = search ? `${pathname}?${search}` : pathname;
          router.replace(targetUrl, { locale: manualChoice });
        }
        return;
      }

      // First-time visitor: Run 4-tier smart detection & open language selection popup
      const { recommended } = detectSmartLocale();
      setRecommendedLocale(recommended);
      setSelectedLocale(recommended);
      setIsOpen(true);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmLanguage = (chosen: SupportedLocale) => {
    setSelectedLocale(chosen);
    persistManualLocale(chosen);
    setIsOpen(false);

    if (chosen !== currentLocale) {
      startTransition(() => {
        const search = searchParams?.toString();
        const targetUrl = search ? `${pathname}?${search}` : pathname;
        router.replace(targetUrl, { locale: chosen });
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-neon/15 border border-brand-neon/35 text-brand-neon flex items-center justify-center mx-auto shadow-sm">
            <Globe className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            භාෂාව තෝරන්න • மொழியைத் தேர்ந்தெடுக்கவும் • Choose Language
          </h2>
          <p className="text-xs text-slate-400">
            Select your preferred language for browsing ShiftLK Spares. We will remember your choice for future visits.
          </p>
        </div>

        {/* 3 Language Cards */}
        <div className="space-y-2.5">
          {LANGUAGE_OPTIONS.map((opt) => {
            const isRecommended = opt.code === recommendedLocale;
            const isSelected = opt.code === selectedLocale;

            return (
              <button
                key={opt.code}
                type="button"
                disabled={isPending}
                onClick={() => handleConfirmLanguage(opt.code)}
                className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-brand-neon/10 border-brand-neon shadow-[0_0_20px_rgba(204,255,0,0.15)]'
                    : 'bg-slate-950 border-slate-800 hover:border-brand-neon/50 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#ccff00] text-black'
                        : 'bg-slate-900 text-slate-300 border border-slate-800 group-hover:border-brand-neon/40'
                    }`}
                  >
                    {opt.badge}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-black text-white group-hover:text-brand-neon transition-colors">
                        {opt.nativeTitle}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        ({opt.englishLabel})
                      </span>
                      {isRecommended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-neon/15 text-brand-neon border border-brand-neon/30">
                          <Sparkles className="w-2.5 h-2.5" />
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {opt.subtitle}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                    isSelected
                      ? 'bg-[#ccff00] border-[#ccff00] text-black'
                      : 'border-slate-700 text-transparent group-hover:border-brand-neon'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Continue CTA */}
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleConfirmLanguage(selectedLocale)}
          className="btn-neon w-full py-3 rounded-2xl text-xs sm:text-sm font-black shadow-lg cursor-pointer"
        >
          {selectedLocale === 'si'
            ? 'සිංහලෙන් ඉදිරියට යන්න →'
            : selectedLocale === 'ta'
            ? 'தமிழில் தொடரவும் →'
            : 'Continue in English →'}
        </button>
      </div>
    </div>
  );
}

