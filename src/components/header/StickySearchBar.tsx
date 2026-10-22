'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Search, X, Wrench, ArrowRight } from 'lucide-react';

interface StickySearchBarProps {
  initialQuery?: string;
  className?: string;
}

export default function StickySearchBar({
  initialQuery = '',
  className = '',
}: StickySearchBarProps) {
  const t = useTranslations('search');
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      router.push('/products');
      return;
    }
    router.push(`/products?q=${encodeURIComponent(query.trim())}`);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSearch} className="relative w-full">
        <div
          className={`relative flex items-center bg-[#090d16] border transition-all duration-200 rounded-2xl shadow-xl overflow-hidden ${
            isFocused
              ? 'border-[#ccff00] ring-2 ring-[#ccff00]/25 shadow-[0_0_25px_rgba(204,255,0,0.2)]'
              : 'border-[#1f293d] hover:border-slate-600'
          }`}
        >
          <div className="pl-3.5 pr-2 text-[#ccff00] flex items-center pointer-events-none">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 250)}
            placeholder={t('placeholder')}
            className="w-full bg-transparent py-3 text-sm md:text-base text-slate-100 placeholder-slate-400 focus:outline-none"
            aria-label="Search spare parts"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 mr-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#ccff00] hover:bg-[#b8e600] text-black px-5 py-3 text-sm font-black transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>{t('searchBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick popular OEM suggestions when focused */}
        {isFocused && !query && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c111c] border border-[#212c42] rounded-2xl p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 text-xs text-slate-300">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#ccff00]" />
              <span>Popular Motorbike Searches in Sri Lanka:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Bajaj Pulsar 150/180/NS',
                'Yamaha FZ / FZ-S Spares',
                'Body Sticker Kits',
                'Helmets & Visors',
                'Custom Exhausts',
                'Crash Guards',
                'Bajaj Discover / CT100',
                'Yamaha R15 Spares',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={() => {
                    setQuery(suggestion);
                    router.push(`/products?q=${encodeURIComponent(suggestion)}`);
                  }}
                  className="bg-[#141b2b] hover:bg-[#ccff00]/15 hover:text-[#ccff00] border border-[#212c42] hover:border-[#ccff00]/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
