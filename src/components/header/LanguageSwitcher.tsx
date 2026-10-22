'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: 'en' | 'si' | 'ta') => {
    if (newLocale === locale) return;
    startTransition(() => {
      const search = searchParams?.toString();
      const targetUrl = search ? `${pathname}?${search}` : pathname;
      router.replace(targetUrl, { locale: newLocale });
    });
  };

  return (
    <div
      className="inline-flex items-center bg-[#0a0e18] border border-[#1f293d] rounded-full p-1 shadow-sm backdrop-blur-md"
      role="group"
      aria-label="Language Selector"
    >
      <div className="pl-2 pr-1 text-slate-400 hidden sm:flex items-center">
        <Globe className="w-3.5 h-3.5" />
      </div>
      <button
        type="button"
        onClick={() => handleLocaleChange('en')}
        disabled={isPending}
        className={`px-2.5 py-1 text-xs rounded-full transition-all duration-150 cursor-pointer ${
          locale === 'en'
            ? 'bg-[#ccff00] text-black shadow-md font-black'
            : 'text-slate-300 hover:text-white hover:bg-[#141b2b] font-medium'
        }`}
        title="English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => handleLocaleChange('si')}
        disabled={isPending}
        className={`px-2.5 py-1 text-xs rounded-full transition-all duration-150 cursor-pointer ${
          locale === 'si'
            ? 'bg-[#ccff00] text-black shadow-md font-black'
            : 'text-slate-300 hover:text-white hover:bg-[#141b2b] font-medium'
        }`}
        title="සිංහල (Sinhala)"
      >
        සිං
      </button>
      <button
        type="button"
        onClick={() => handleLocaleChange('ta')}
        disabled={isPending}
        className={`px-2.5 py-1 text-xs rounded-full transition-all duration-150 cursor-pointer ${
          locale === 'ta'
            ? 'bg-[#ccff00] text-black shadow-md font-black'
            : 'text-slate-300 hover:text-white hover:bg-[#141b2b] font-medium'
        }`}
        title="தமிழ் (Tamil)"
      >
        த
      </button>
    </div>
  );
}
