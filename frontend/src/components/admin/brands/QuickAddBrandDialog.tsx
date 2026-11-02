'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/common/Toast';
import { cn } from '@/lib/utils';

const QUICK_COUNTRIES = ['India', 'Japan', 'Sri Lanka', 'Taiwan', 'Italy', 'Thailand'];

interface QuickAddBrandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBrandCreated: (brand: any) => void;
}

export function QuickAddBrandDialog({
  isOpen,
  onClose,
  onBrandCreated,
}: QuickAddBrandDialogProps) {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [country, setCountry] = useState('India');

  const handleNameChange = (val: string) => {
    setName(val);
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
      return apiClient('/api/v1/admin/brands', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      success('New brand created and selected!');
      const newBrand = data?.data || data;
      onBrandCreated(newBrand);
      setName('');
      setSlug('');
      setIsSlugManual(false);
      setCountry('India');
      onClose();
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to create brand');
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

    mutation.mutate({
      name: name.trim(),
      slug: cleanSlug,
      country: country.trim() || null,
      isActive: true,
    });
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
            <h3 className="text-sm font-bold text-white">Quick Add Brand</h3>
            <p className="text-[11px] text-slate-400">
              Create and select a new brand without leaving this product form
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
            Brand Name *
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="e.g. Bajaj Genuine, Minda, Endurance"
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
            placeholder="e.g. bajaj-genuine"
            className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Country of Origin (Optional)
          </label>
          <Input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. India, Japan"
            className="bg-slate-900 border-slate-800 text-xs text-white focus:border-brand-neon mb-2"
          />
          <div className="flex flex-wrap gap-1.5">
            {QUICK_COUNTRIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCountry(c)}
                className={cn(
                  'px-2 py-1 rounded-lg text-[10px] font-medium border transition-all',
                  country === c
                    ? 'bg-brand-neon/15 border-brand-neon text-brand-neon'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                )}
              >
                {c}
              </button>
            ))}
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

