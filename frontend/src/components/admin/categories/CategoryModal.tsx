'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, X, Sparkles, Check, Globe } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/common/Toast';
import { cn } from '@/lib/utils';
import { CategoryIcon, POPULAR_CATEGORY_ICONS } from './CategoryIcon';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: any | null; // null for create mode, category object for edit
  onSuccess?: (category: any) => void;
}

export function CategoryModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: CategoryModalProps) {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEdit = !!category;

  // Form State
  const [activeTab, setActiveTab] = useState<'en' | 'si' | 'ta'>('en');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [icon, setIcon] = useState('Wrench');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Translations
  const [nameEn, setNameEn] = useState('');
  const [descEn, setDescEn] = useState('');

  const [nameSi, setNameSi] = useState('');
  const [descSi, setDescSi] = useState('');

  const [nameTa, setNameTa] = useState('');
  const [descTa, setDescTa] = useState('');

  // Sync state when editing or opening
  useEffect(() => {
    if (category) {
      setSlug(category.slug || '');
      setIsSlugManual(true);
      setIcon(category.icon || 'Wrench');
      setDisplayOrder(category.displayOrder ?? 0);
      setIsActive(category.isActive ?? true);

      const transMap = category.translationsMap || {};
      setNameEn(transMap.en?.name || category.name || '');
      setDescEn(transMap.en?.description || category.description || '');

      setNameSi(transMap.si?.name || '');
      setDescSi(transMap.si?.description || '');

      setNameTa(transMap.ta?.name || '');
      setDescTa(transMap.ta?.description || '');
    } else {
      setSlug('');
      setIsSlugManual(false);
      setIcon('Wrench');
      setDisplayOrder(0);
      setIsActive(true);
      setNameEn('');
      setDescEn('');
      setNameSi('');
      setDescSi('');
      setNameTa('');
      setDescTa('');
    }
    setActiveTab('en');
  }, [category, isOpen]);

  // Auto-slug from English name
  const handleNameEnChange = (val: string) => {
    setNameEn(val);
    if (!isSlugManual && !isEdit) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEdit) {
        return apiClient(`/api/v1/admin/categories/${category.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        return apiClient('/api/v1/admin/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      success(isEdit ? 'Category updated successfully!' : 'Category created successfully!');
      if (onSuccess) onSuccess(data?.data || data);
      onClose();
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to save category');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameEn.trim()) {
      toastError('English Category Name is required');
      setActiveTab('en');
      return;
    }

    const cleanSlug =
      slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
      nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      toastError('A valid slug is required');
      return;
    }

    const payload: any = {
      slug: cleanSlug,
      icon,
      displayOrder: Number(displayOrder) || 0,
      isActive,
      translations: {
        en: {
          name: nameEn.trim(),
          description: descEn.trim() || undefined,
        },
      },
    };

    if (nameSi.trim()) {
      payload.translations.si = {
        name: nameSi.trim(),
        description: descSi.trim() || undefined,
      };
    }

    if (nameTa.trim()) {
      payload.translations.ta = {
        name: nameTa.trim(),
        description: descTa.trim() || undefined,
      };
    }

    mutation.mutate(payload);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="max-w-2xl bg-slate-950 border-slate-800 p-0 text-white overflow-hidden rounded-2xl max-h-[90vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEdit ? 'Edit Category' : 'Create New Category'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEdit
                  ? `Updating "${category?.name || category?.slug}"`
                  : 'Add a new trilingual catalog category for motorbike spare parts'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL Slug *
              </label>
              <Input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManual(true);
                }}
                required
                placeholder="e.g. engine-spares"
                className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Lowercase alphanumeric and hyphens only
              </p>
            </div>

            {/* Display Order & Active Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Display Order
                </label>
                <Input
                  type="number"
                  min="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Status
                </label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={cn(
                    'w-full h-9 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all',
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  )}
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isActive ? 'bg-emerald-400' : 'bg-rose-400'
                    )}
                  />
                  {isActive ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span>Category Icon</span>
              <span className="text-slate-500 font-normal">
                (Selected: <strong className="text-brand-neon">{icon}</strong>)
              </span>
            </label>
            <div className="grid grid-cols-7 sm:grid-cols-7 gap-2 p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              {POPULAR_CATEGORY_ICONS.map((item) => {
                const isSelected = icon === item.name;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.name}
                    type="button"
                    title={item.label}
                    onClick={() => setIcon(item.name)}
                    className={cn(
                      'p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all',
                      isSelected
                        ? 'bg-brand-neon/15 border-brand-neon text-brand-neon shadow-lg shadow-brand-neon/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    )}
                  >
                    <IconComp className="w-5 h-5" />
                    <span className="text-[9px] truncate max-w-full font-medium">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multilingual Section */}
          <div className="border border-slate-800/80 rounded-xl bg-slate-900/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-neon" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Trilingual Names & Descriptions
                </h3>
              </div>

              {/* Language Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('en')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                    activeTab === 'en'
                      ? 'bg-brand-neon/20 text-brand-neon border border-brand-neon/30'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  English *
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('si')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                    activeTab === 'si'
                      ? 'bg-brand-neon/20 text-brand-neon border border-brand-neon/30'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  සිංහල (Sinhala)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ta')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                    activeTab === 'ta'
                      ? 'bg-brand-neon/20 text-brand-neon border border-brand-neon/30'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  தமிழ் (Tamil)
                </button>
              </div>
            </div>

            {/* Tab: English */}
            {activeTab === 'en' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    English Name *
                  </label>
                  <Input
                    type="text"
                    value={nameEn}
                    onChange={(e) => handleNameEnChange(e.target.value)}
                    required
                    placeholder="e.g. Engine & Mechanical Spares"
                    className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    English Description
                  </label>
                  <textarea
                    rows={2}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    placeholder="Brief description of motorbike spare parts in this category"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
                  />
                </div>
              </div>
            )}

            {/* Tab: Sinhala */}
            {activeTab === 'si' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sinhala Name (සිංහල නම)
                  </label>
                  <Input
                    type="text"
                    value={nameSi}
                    onChange={(e) => setNameSi(e.target.value)}
                    placeholder="උදා: එන්ජින් සහ යාන්ත්‍රික අමතර කොටස්"
                    className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sinhala Description (සිංහල විස්තරය)
                  </label>
                  <textarea
                    rows={2}
                    value={descSi}
                    onChange={(e) => setDescSi(e.target.value)}
                    placeholder="මෙම කාණ්ඩයට අයත් අමතර කොටස් පිළිබඳ කෙටි හැඳින්වීමක්"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
                  />
                </div>
              </div>
            )}

            {/* Tab: Tamil */}
            {activeTab === 'ta' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tamil Name (தமிழ் பெயர்)
                  </label>
                  <Input
                    type="text"
                    value={nameTa}
                    onChange={(e) => setNameTa(e.target.value)}
                    placeholder="எ.கா: என்ஜின் மற்றும் மெக்கானிக்கல் பாகங்கள்"
                    className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tamil Description (தமிழ் விளக்கம்)
                  </label>
                  <textarea
                    rows={2}
                    value={descTa}
                    onChange={(e) => setDescTa(e.target.value)}
                    placeholder="இந்த வகையின் உதிரிபாகங்கள் பற்றிய சுருக்கமான விளக்கம்"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
              className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={mutation.isPending}
              className="bg-brand-neon text-slate-950 font-bold hover:bg-brand-neon/90 text-xs px-5 shadow-lg shadow-brand-neon/20"
            >
              {isEdit ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
    </Dialog>
  );
}
