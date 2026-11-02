'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, X, Globe } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/common/Toast';
import { cn } from '@/lib/utils';

const POPULAR_COUNTRIES = [
  'India',
  'Japan',
  'Sri Lanka',
  'Taiwan',
  'Italy',
  'Thailand',
  'Germany',
  'China',
];

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand?: any | null;
  onSuccess?: (brand: any) => void;
}

export function BrandModal({
  isOpen,
  onClose,
  brand,
  onSuccess,
}: BrandModalProps) {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEdit = !!brand;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [country, setCountry] = useState('India');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (brand) {
      setName(brand.name || '');
      setSlug(brand.slug || '');
      setIsSlugManual(true);
      setCountry(brand.country || '');
      setIsActive(brand.isActive ?? true);
    } else {
      setName('');
      setSlug('');
      setIsSlugManual(false);
      setCountry('India');
      setIsActive(true);
    }
  }, [brand, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
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
        return apiClient(`/api/v1/admin/brands/${brand.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        return apiClient('/api/v1/admin/brands', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      success(isEdit ? 'Brand updated successfully!' : 'Brand created successfully!');
      if (onSuccess) onSuccess(data?.data || data);
      onClose();
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to save brand');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toastError('Brand Name is required');
      return;
    }

    const cleanSlug =
      slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      toastError('A valid slug is required');
      return;
    }

    const payload = {
      name: name.trim(),
      slug: cleanSlug,
      country: country.trim() || null,
      isActive,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="max-w-lg bg-slate-950 border-slate-800 p-0 text-white overflow-hidden rounded-2xl max-h-[90vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {isEdit ? 'Edit Brand' : 'Create New Brand'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEdit
                ? `Updating "${brand?.name || brand?.slug}"`
                : 'Add a motorbike manufacturer or aftermarket parts brand'}
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
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Brand / Manufacturer Name *
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="e.g. Bajaj Genuine Parts, Yamaha, Minda, Rolon"
            className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              placeholder="e.g. bajaj-genuine"
              className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Lowercase alphanumeric and hyphens only
            </p>
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

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-brand-neon" />
            <span>Country of Origin</span>
          </label>
          <Input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. India, Japan, Sri Lanka"
            className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon mb-2"
          />
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_COUNTRIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCountry(c)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all',
                  country === c
                    ? 'bg-brand-neon/15 border-brand-neon text-brand-neon'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                )}
              >
                {c}
              </button>
            ))}
          </div>
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
            {isEdit ? 'Save Changes' : 'Create Brand'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

