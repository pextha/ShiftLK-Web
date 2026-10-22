'use client';

import { useState } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Search,
  Car,
} from 'lucide-react';

interface CategoryOption {
  slug: string;
  name: string;
}

interface MakeModelOption {
  make: string;
  models: string[];
}

interface ProductFilterBarProps {
  categories: CategoryOption[];
  brands: string[];
  makesAndModels: MakeModelOption[];
  totalResults: number;
}

export default function ProductFilterBar({
  categories,
  brands,
  makesAndModels,
  totalResults,
}: ProductFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('filters');
  const tSearch = useTranslations('search');

  // Search parameters
  const q = searchParams.get('q') || '';
  const currentCategory = searchParams.get('category') || 'all';
  const currentBrand = searchParams.get('brand') || 'all';
  const currentCondition = searchParams.get('condition') || 'all';
  const currentMake = searchParams.get('make') || 'all';
  const currentModel = searchParams.get('model') || 'all';
  const currentSort = searchParams.get('sort') || 'newest';
  const inStock = searchParams.get('inStock') === 'true';

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(q);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset model if make changes
    if (key === 'make') {
      params.delete('model');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput.trim() || null);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    router.replace(pathname);
    setMobileFilterOpen(false);
  };

  const selectedMakeObj = makesAndModels.find(
    (m) => m.make.toLowerCase() === currentMake.toLowerCase()
  );
  const availableModels = selectedMakeObj ? selectedMakeObj.models : [];

  const hasActiveFilters =
    q ||
    currentCategory !== 'all' ||
    currentBrand !== 'all' ||
    currentCondition !== 'all' ||
    currentMake !== 'all' ||
    currentModel !== 'all' ||
    inStock;

  return (
    <div className="w-full space-y-4">
      {/* Top Filter Bar / Quick Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search inside page */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-md"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search within results..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/40 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                updateParam('q', null);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
          {/* Results count indicator */}
          <div className="text-xs font-semibold text-slate-400">
            {t('resultsCount', { count: totalResults })}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">
              {t('sortBy')}:
            </span>
            <select
              value={currentSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-brand-neon text-xs rounded-xl px-3 py-2 text-white font-medium cursor-pointer outline-none transition-all"
            >
              <option value="newest">{t('sortNewest')}</option>
              <option value="price_asc">{t('sortPriceLow')}</option>
              <option value="price_desc">{t('sortPriceHigh')}</option>
            </select>
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-brand-neon/50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-neon" />
            <span>{t('title')}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-brand-neon shadow-sm shadow-brand-neon"></span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Horizontal Filter Pills */}
      <div className="hidden lg:grid grid-cols-5 gap-3 bg-slate-950/40 p-4 border border-slate-800/80 rounded-2xl">
        {/* Category */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {t('category')}
          </label>
          <select
            value={currentCategory}
            onChange={(e) => updateParam('category', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-2 text-white font-medium cursor-pointer focus:border-brand-neon outline-none"
          >
            <option value="all">{t('allCategories')}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Vehicle Make */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Vehicle Make
          </label>
          <select
            value={currentMake}
            onChange={(e) => updateParam('make', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-2 text-white font-medium cursor-pointer focus:border-brand-neon outline-none"
          >
            <option value="all">{tSearch('allMakes')}</option>
            {makesAndModels.map((m) => (
              <option key={m.make} value={m.make}>
                {m.make}
              </option>
            ))}
          </select>
        </div>

        {/* Vehicle Model */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Vehicle Model
          </label>
          <select
            value={currentModel}
            disabled={currentMake === 'all'}
            onChange={(e) => updateParam('model', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-2 text-white font-medium cursor-pointer focus:border-brand-neon outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="all">{tSearch('allModels')}</option>
            {availableModels.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {t('condition')}
          </label>
          <select
            value={currentCondition}
            onChange={(e) => updateParam('condition', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-2 text-white font-medium cursor-pointer focus:border-brand-neon outline-none"
          >
            <option value="all">{t('allConditions')}</option>
            <option value="new">Brand New (OEM)</option>
            <option value="reconditioned">Reconditioned (Japan)</option>
            <option value="used">Used Original</option>
          </select>
        </div>

        {/* Brand */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {t('brand')}
          </label>
          <select
            value={currentBrand}
            onChange={(e) => updateParam('brand', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-2 text-white font-medium cursor-pointer focus:border-brand-neon outline-none"
          >
            <option value="all">{t('allBrands')}</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter tags & Reset active filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-slate-400">Active filters:</span>
          {q && (
            <span className="bg-slate-900 text-slate-200 border border-brand-neon/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
              Search: "{q}"
              <button
                onClick={() => updateParam('q', null)}
                className="hover:text-brand-neon"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentCategory !== 'all' && (
            <span className="bg-slate-900 text-slate-200 border border-brand-neon/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
              Category: {categories.find((c) => c.slug === currentCategory)?.name}
              <button
                onClick={() => updateParam('category', null)}
                className="hover:text-brand-neon"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentMake !== 'all' && (
            <span className="bg-slate-900 text-slate-200 border border-brand-neon/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
              Make: {currentMake}
              <button
                onClick={() => updateParam('make', null)}
                className="hover:text-brand-neon"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentModel !== 'all' && (
            <span className="bg-slate-900 text-slate-200 border border-brand-neon/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
              Model: {currentModel}
              <button
                onClick={() => updateParam('model', null)}
                className="hover:text-brand-neon"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentCondition !== 'all' && (
            <span className="bg-slate-900 text-slate-200 border border-brand-neon/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
              Condition: {currentCondition}
              <button
                onClick={() => updateParam('condition', null)}
                className="hover:text-brand-neon"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentBrand !== 'all' && (
            <span className="bg-slate-900 text-slate-200 border border-brand-neon/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
              Brand: {currentBrand}
              <button
                onClick={() => updateParam('brand', null)}
                className="hover:text-brand-neon"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-brand-neon hover:underline flex items-center gap-1 font-semibold ml-2 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('clearAll')}</span>
          </button>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xs h-full bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="font-bold text-white text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-neon" />
                <span>{t('title')}</span>
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Category */}
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('category')}
                </label>
                <select
                  value={currentCategory}
                  onChange={(e) => updateParam('category', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="all">{t('allCategories')}</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Make */}
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Vehicle Make
                </label>
                <select
                  value={currentMake}
                  onChange={(e) => updateParam('make', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="all">{tSearch('allMakes')}</option>
                  {makesAndModels.map((m) => (
                    <option key={m.make} value={m.make}>
                      {m.make}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Vehicle Model
                </label>
                <select
                  value={currentModel}
                  disabled={currentMake === 'all'}
                  onChange={(e) => updateParam('model', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white disabled:opacity-40"
                >
                  <option value="all">{tSearch('allModels')}</option>
                  {availableModels.map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('condition')}
                </label>
                <select
                  value={currentCondition}
                  onChange={(e) => updateParam('condition', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="all">{t('allConditions')}</option>
                  <option value="new">Brand New (OEM)</option>
                  <option value="reconditioned">Reconditioned (Japan)</option>
                  <option value="used">Used Original</option>
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('brand')}
                </label>
                <select
                  value={currentBrand}
                  onChange={(e) => updateParam('brand', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="all">{t('allBrands')}</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full bg-brand-neon hover:bg-brand-neon-hover text-black font-extrabold py-3.5 rounded-xl text-xs shadow-lg shadow-brand-neon/20 transition-all cursor-pointer"
              >
                Apply Filters ({totalResults} parts)
              </button>
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-full text-slate-400 hover:text-white py-2 text-xs"
              >
                {t('clearAll')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
