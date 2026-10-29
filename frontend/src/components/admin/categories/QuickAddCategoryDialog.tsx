'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, X, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/common/Toast';
import { cn } from '@/lib/utils';
import { CategoryIcon, POPULAR_CATEGORY_ICONS } from './CategoryIcon';

interface QuickAddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: any) => void;
}

export function QuickAddCategoryDialog({
  isOpen,
  onClose,
  onCategoryCreated,
}: QuickAddCategoryDialogProps) {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [icon, setIcon] = useState('Wrench');
  const [nameSi, setNameSi] = useState('');
  const [nameTa, setNameTa] = useState('');

  const handleNameEnChange = (val: string) => {
    setNameEn(val);
    if (!isSlugManual) {
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
      return apiClient('/api/v1/admin/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      success('New category created and selected!');
      const newCategory = data?.data || data;
      onCategoryCreated(newCategory);
      // Reset state
      setNameEn('');
      setSlug('');
      setIsSlugManual(false);
      setIcon('Wrench');
      setNameSi('');
      setNameTa('');
      onClose();
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to create category');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameEn.trim()) {
      toastError('Category Name (English) is required');
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
      displayOrder: 0,
      isActive: true,
      translations: {
        en: {
          name: nameEn.trim(),
        },
      },
    };

    if (nameSi.trim()) {
      payload.translations.si = { name: nameSi.trim() };
    }

    if (nameTa.trim()) {
      payload.translations.ta = { name: nameTa.trim() };
    }

    mutation.mutate(payload);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="max-w-lg bg-slate-950 border-slate-800 p-0 text-white overflow-hidden rounded-2xl"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Quick Add Category</h3>
              <p className="text-[11px] text-slate-400">
                Create and select a new catalog category without leaving this form
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Category Name (English) *
            </label>
            <Input
              type="text"
              value={nameEn}
              onChange={(e) => handleNameEnChange(e.target.value)}
              required
              placeholder="e.g. Brake Discs & Calipers"
              className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
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
              placeholder="e.g. brake-discs-calipers"
              className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sinhala Name (Optional)
              </label>
              <Input
                type="text"
                value={nameSi}
                onChange={(e) => setNameSi(e.target.value)}
                placeholder="උදා: බ්‍රේක් ඩිස්ක්"
                className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tamil Name (Optional)
              </label>
              <Input
                type="text"
                value={nameTa}
                onChange={(e) => setNameTa(e.target.value)}
                placeholder="எ.கா: பிரேக் டிஸ்க்குகள்"
                className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon"
              />
            </div>
          </div>

          {/* Quick Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Icon</span>
              <span className="text-[10px] text-brand-neon font-mono">{icon}</span>
            </label>
            <div className="grid grid-cols-7 gap-1.5 p-2 bg-slate-900/60 border border-slate-800 rounded-xl">
              {POPULAR_CATEGORY_ICONS.slice(0, 14).map((item) => {
                const isSelected = icon === item.name;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.name}
                    type="button"
                    title={item.label}
                    onClick={() => setIcon(item.name)}
                    className={cn(
                      'p-2 rounded-lg border flex items-center justify-center transition-all',
                      isSelected
                        ? 'bg-brand-neon/15 border-brand-neon text-brand-neon'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    )}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={mutation.isPending}
              className="border-slate-800 text-slate-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={mutation.isPending}
              className="bg-brand-neon text-slate-950 font-bold hover:bg-brand-neon/90 text-xs px-4"
            >
              Save & Select
            </Button>
          </div>
        </form>
    </Dialog>
  );
}
