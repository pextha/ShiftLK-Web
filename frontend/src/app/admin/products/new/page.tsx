'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Calculator,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Bike,
  Wand2,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatLKR, cn } from '@/lib/utils';
import {
  translateSparePartInstant,
  translateSparePartSmart,
} from '@/lib/utils/auto-translate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/common/Toast';
import { ImageUploadDropzone } from '@/components/admin/ui/ImageUploadDropzone';
import { QuickAddCategoryDialog } from '@/components/admin/categories/QuickAddCategoryDialog';
import { QuickAddBrandDialog } from '@/components/admin/brands/QuickAddBrandDialog';

interface CompatibilityItem {
  make: string;
  model: string;
  yearFrom: number;
  yearTo?: number | null;
  chassisCode?: string | null;
}

interface ImageItem {
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // Basic Details
  const [partNumber, setPartNumber] = useState('');
  const [partNumberMode, setPartNumberMode] = useState<'manual' | 'auto'>('manual');
  const [slug, setSlug] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quickBrandOpen, setQuickBrandOpen] = useState(false);
  const [quickCategoryOpen, setQuickCategoryOpen] = useState(false);
  const [condition, setCondition] = useState<'NEW' | 'RECONDITIONED' | 'USED'>('NEW');

  // Translations
  const [nameEn, setNameEn] = useState('');
  const [descEn, setDescEn] = useState('');
  const [nameSi, setNameSi] = useState('');
  const [descSi, setDescSi] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [descTa, setDescTa] = useState('');
  const [activeTab, setActiveTab] = useState<'en' | 'si' | 'ta'>('en');
  const [siManuallyEdited, setSiManuallyEdited] = useState(false);
  const [taManuallyEdited, setTaManuallyEdited] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pricing & Stock
  const [costPrice, setCostPrice] = useState<string>('0');
  const [sellingPrice, setSellingPrice] = useState<string>('0');
  const [stockQty, setStockQty] = useState<string>('5');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('5');
  const [weightKg, setWeightKg] = useState<string>('1.0');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Images
  const [images, setImages] = useState<ImageItem[]>([
    { imageUrl: '', isPrimary: true, displayOrder: 0 },
  ]);

  // Compatibilities
  const [compatibilities, setCompatibilities] = useState<CompatibilityItem[]>([
    { make: 'Bajaj', model: 'Pulsar 150', yearFrom: 2010, yearTo: 2024, chassisCode: '' },
  ]);

  // Fetch Brands
  const { data: rawBrands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => apiClient<any[]>('/api/v1/brands'),
  });
  const brands: any[] = Array.isArray(rawBrands)
    ? rawBrands
    : Array.isArray((rawBrands as any)?.data)
    ? (rawBrands as any).data
    : [];

  // Fetch Categories
  const { data: rawCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient<any[]>('/api/v1/categories'),
  });
  const categories: any[] = Array.isArray(rawCategories)
    ? rawCategories
    : Array.isArray((rawCategories as any)?.data)
    ? (rawCategories as any).data
    : [];

  // Profit & Margin calculations
  const cost = Number(costPrice) || 0;
  const selling = Number(sellingPrice) || 0;
  const profit = selling - cost;
  const marginPercent = selling > 0 ? (profit / selling) * 100 : 0;

  // Smart Part Number generator (uses Brand + Category prefix when available)
  const generateSmartPartNumber = (selectedBrandId?: string, selectedCategoryId?: string) => {
    const bId = selectedBrandId ?? brandId;
    const cId = selectedCategoryId ?? categoryId;
    const brandObj = brands.find((b: any) => b.id === bId);
    const catObj = categories.find((c: any) => c.id === cId);

    const brandPrefix = brandObj?.name
      ? brandObj.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()
      : '';
    const catPrefix = catObj?.name
      ? catObj.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()
      : '';

    const randomDigits = Math.floor(1000 + Math.random() * 9000);

    const parts = ['SLK'];
    if (brandPrefix) parts.push(brandPrefix);
    if (catPrefix) parts.push(catPrefix);
    if (!brandPrefix && !catPrefix) parts.push('PRT');
    parts.push(String(randomDigits));

    return parts.join('-');
  };

  // Auto-generate slug + Sinhala & Tamil translations from English name
  const handleNameEnChange = (val: string) => {
    setNameEn(val);
    if (!slug || slug === nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }

    // Instant glossary translation
    const instant = translateSparePartInstant(val);
    if (!siManuallyEdited) setNameSi(instant.si);
    if (!taManuallyEdited) setNameTa(instant.ta);

    // Debounced smart neural + glossary translation
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    if (val.trim()) {
      titleTimerRef.current = setTimeout(async () => {
        setIsTranslating(true);
        const smart = await translateSparePartSmart(val, 'title');
        if (!siManuallyEdited) setNameSi(smart.si);
        if (!taManuallyEdited) setNameTa(smart.ta);
        setIsTranslating(false);
      }, 400);
    }
  };

  // Auto-generate Sinhala & Tamil descriptions from English description
  const handleDescEnChange = (val: string) => {
    setDescEn(val);

    const instant = translateSparePartInstant(val);
    if (!siManuallyEdited) setDescSi(instant.si);
    if (!taManuallyEdited) setDescTa(instant.ta);

    if (descTimerRef.current) clearTimeout(descTimerRef.current);
    if (val.trim()) {
      descTimerRef.current = setTimeout(async () => {
        setIsTranslating(true);
        const smart = await translateSparePartSmart(val, 'description');
        if (!siManuallyEdited) setDescSi(smart.si);
        if (!taManuallyEdited) setDescTa(smart.ta);
        setIsTranslating(false);
      }, 450);
    }
  };

  // Force re-generate Sinhala & Tamil from current English title & description
  const handleForceAutoTranslate = async () => {
    if (!nameEn.trim() && !descEn.trim()) return;
    setSiManuallyEdited(false);
    setTaManuallyEdited(false);
    setIsTranslating(true);

    const [smartTitle, smartDesc] = await Promise.all([
      nameEn.trim() ? translateSparePartSmart(nameEn, 'title') : Promise.resolve({ si: '', ta: '' }),
      descEn.trim()
        ? translateSparePartSmart(descEn, 'description')
        : Promise.resolve({ si: '', ta: '' }),
    ]);

    if (nameEn.trim()) {
      setNameSi(smartTitle.si);
      setNameTa(smartTitle.ta);
    }
    if (descEn.trim()) {
      setDescSi(smartDesc.si);
      setDescTa(smartDesc.ta);
    }
    setIsTranslating(false);
    success('Sinhala & Tamil translations auto-generated from English');
  };

  // Image helpers
  const addImageField = () => {
    setImages([...images, { imageUrl: '', isPrimary: images.length === 0, displayOrder: images.length }]);
  };

  const removeImage = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    if (images[idx].isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setImages(updated);
  };

  const updateImageUrl = (idx: number, url: string) => {
    const updated = [...images];
    updated[idx].imageUrl = url;
    setImages(updated);
  };

  const setPrimaryImage = (idx: number) => {
    setImages(
      images.map((img, i) => ({
        ...img,
        isPrimary: i === idx,
      }))
    );
  };

  // Compatibility helpers
  const addCompatibility = () => {
    setCompatibilities([
      ...compatibilities,
      { make: '', model: '', yearFrom: 2015, yearTo: null, chassisCode: '' },
    ]);
  };

  const removeCompatibility = (idx: number) => {
    setCompatibilities(compatibilities.filter((_, i) => i !== idx));
  };

  const updateCompatibility = (idx: number, field: keyof CompatibilityItem, val: any) => {
    const updated = [...compatibilities];
    updated[idx] = { ...updated[idx], [field]: val };
    setCompatibilities(updated);
  };

  // Save Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient('/api/v1/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      success('Product successfully added to catalog');
      router.push('/admin/products');
    },
    onError: (err: any) => {
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        const fieldErrors = err.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
        toastError(`Validation Error: ${fieldErrors}`);
      } else {
        toastError(err.message || 'Failed to create product');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameEn.trim()) {
      toastError('English product name is required');
      return;
    }

    if (!brandId) {
      toastError('Please select a brand');
      return;
    }

    if (!categoryId) {
      toastError('Please select a category');
      return;
    }

    if (selling <= 0) {
      toastError('Selling price must be greater than LKR 0');
      return;
    }

    // Prepare translations array (auto-fill Sinhala & Tamil if left blank)
    const fallbackTitleTrans = translateSparePartInstant(nameEn.trim());
    const fallbackDescTrans = translateSparePartInstant(descEn.trim() || nameEn.trim());
    const finalNameSi = nameSi.trim() || fallbackTitleTrans.si || nameEn.trim();
    const finalDescSi = descSi.trim() || fallbackDescTrans.si || finalNameSi;
    const finalNameTa = nameTa.trim() || fallbackTitleTrans.ta || nameEn.trim();
    const finalDescTa = descTa.trim() || fallbackDescTrans.ta || finalNameTa;

    const translations = [
      { language: 'en', name: nameEn.trim(), description: descEn.trim() || nameEn.trim() },
      { language: 'si', name: finalNameSi, description: finalDescSi },
      { language: 'ta', name: finalNameTa, description: finalDescTa },
    ];

    // Filter valid image URLs
    const validImages = images
      .filter((img) => img.imageUrl && img.imageUrl.trim() !== '')
      .map((img, i) => ({
        imageUrl: img.imageUrl.trim(),
        isPrimary: img.isPrimary,
        displayOrder: i,
      }));

    if (validImages.length > 0 && !validImages.some((img) => img.isPrimary)) {
      validImages[0].isPrimary = true;
    }

    // Filter valid compatibilities
    const validCompatibilities = compatibilities
      .filter((c) => c.make && c.make.trim() !== '' && c.model && c.model.trim() !== '')
      .map((c) => ({
        make: c.make.trim(),
        model: c.model.trim(),
        yearFrom: Number(c.yearFrom) || 2010,
        yearTo: c.yearTo ? Number(c.yearTo) : null,
        chassisCode: c.chassisCode?.trim() || null,
      }));

    const cleanSlug =
      (slug.trim()
        ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        : nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) ||
      `part-${Date.now().toString(36)}`;

    const generatedPartNumber =
      partNumber.trim() || generateSmartPartNumber();

    const payload = {
      slug: cleanSlug,
      partNumber: generatedPartNumber,
      brandId,
      categoryId,
      condition,
      costPrice: cost,
      sellingPrice: selling,
      stockQty: Number(stockQty) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
      weightKg: Number(weightKg) || 1.0,
      isActive,
      translations,
      images: validImages.length > 0 ? validImages : undefined,
      compatibilities: validCompatibilities.length > 0 ? validCompatibilities : undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <Button variant="ghost" size="sm" type="button" className="p-2 h-9 w-9">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-brand-neon" />
              Add New Product
            </h1>
            <p className="text-xs text-slate-400">
              Create a new motorbike part entry with multi-language specs and bike fitments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <Button variant="outline" type="button" size="sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            size="sm"
            loading={createMutation.isPending}
            className="font-bold gap-1.5 shadow-lg shadow-brand-neon/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Basic Identifiers */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-neon" />
              Core Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    OEM / Part Number
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPartNumberMode('manual')}
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors border',
                        partNumberMode === 'manual'
                          ? 'bg-brand-neon/20 text-brand-neon border-brand-neon/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      )}
                    >
                      Manual (OEM)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPartNumberMode('auto');
                        setPartNumber(generateSmartPartNumber());
                      }}
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors border flex items-center gap-1',
                        partNumberMode === 'auto'
                          ? 'bg-brand-neon text-black border-brand-neon'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-brand-neon hover:border-brand-neon/40'
                      )}
                    >
                      <Wand2 className="w-3 h-3" />
                      Auto-Generate
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={
                      partNumberMode === 'manual'
                        ? 'e.g. 15100-28H00-000 (or leave empty to auto-generate)'
                        : 'Auto-generated ShiftLK Part No.'
                    }
                    value={partNumber}
                    onChange={(e) => {
                      setPartNumberMode('manual');
                      setPartNumber(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 pr-9 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon transition-all font-mono"
                  />
                  <button
                    type="button"
                    title="Auto-Generate Part Number"
                    onClick={() => {
                      setPartNumberMode('auto');
                      setPartNumber(generateSmartPartNumber());
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-brand-neon hover:bg-slate-800 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {partNumberMode === 'auto'
                    ? 'Auto-generated from Brand & Category. Click refresh icon for a new number.'
                    : 'Enter company OEM part number, or click Auto-Generate if part has no code.'}
                </p>
              </div>

              <div>
                <Input
                  label="URL Slug"
                  placeholder="e.g. pulsar-150-front-brake-pad (auto-fills from English name)"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Automatically generated from the English product name if left empty.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Brand */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Brand *
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickBrandOpen(true)}
                    className="text-[11px] text-brand-neon hover:underline font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    New
                  </button>
                </div>
                <select
                  value={brandId}
                  onChange={(e) => {
                    const nextBrandId = e.target.value;
                    setBrandId(nextBrandId);
                    if (partNumberMode === 'auto') {
                      setPartNumber(generateSmartPartNumber(nextBrandId, categoryId));
                    }
                  }}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
                >
                  <option value="">Select Brand</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickCategoryOpen(true)}
                    className="text-[11px] text-brand-neon hover:underline font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    New
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    const nextCatId = e.target.value;
                    setCategoryId(nextCatId);
                    if (partNumberMode === 'auto') {
                      setPartNumber(generateSmartPartNumber(brandId, nextCatId));
                    }
                  }}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
                >
                  <option value="">Select Category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Part Condition *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
                >
                  <option value="NEW">Brand New (OEM / Aftermarket)</option>
                  <option value="RECONDITIONED">Reconditioned (Japan Import)</option>
                  <option value="USED">Used Original</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Section 2: Multilingual Names & Descriptions */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-white">
                  Multilingual Product Names & Descriptions
                </h2>
                <p className="text-[11px] text-slate-400">
                  Sinhala (සිංහල) and Tamil (தமிழ்) are automatically generated as you type in English.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleForceAutoTranslate}
                  disabled={!nameEn.trim() && !descEn.trim()}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-brand-neon/15 text-brand-neon border border-brand-neon/30 hover:bg-brand-neon hover:text-black transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Wand2 className={cn('w-3.5 h-3.5', isTranslating && 'animate-spin')} />
                  <span>{isTranslating ? 'Translating...' : 'Auto-Translate SI & TA'}</span>
                </button>

                {/* Tab Selector */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('en')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-colors',
                      activeTab === 'en'
                        ? 'bg-brand-neon/20 text-brand-neon'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    English *
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('si')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5',
                      activeTab === 'si'
                        ? 'bg-brand-neon/20 text-brand-neon'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    <span>සිංහල (Sinhala)</span>
                    {nameSi.trim() && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ta')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5',
                      activeTab === 'ta'
                        ? 'bg-brand-neon/20 text-brand-neon'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    <span>தமிழ் (Tamil)</span>
                    {nameTa.trim() && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* English Fields */}
            {activeTab === 'en' && (
              <div className="space-y-4 animate-in fade-in">
                <Input
                  label="Product Title (English) *"
                  placeholder="e.g. Yamaha Gasket Cylinder FZ V1/V2/V3"
                  value={nameEn}
                  onChange={(e) => handleNameEnChange(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Description & Specifications (English)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="High friction ceramic pads for superior stopping power and heat dissipation..."
                    value={descEn}
                    onChange={(e) => handleDescEnChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-neon"
                  />
                </div>

                {/* Live Auto-Generated Sinhala & Tamil Preview */}
                {(nameSi.trim() || nameTa.trim()) && (
                  <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-brand-neon flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5" />
                        Auto-Generated Sinhala & Tamil Preview
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Click a language tab above to customize manually
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">සිංහල (Sinhala)</span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('si')}
                            className="text-[10px] text-brand-neon hover:underline font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="font-bold text-white font-sinhala">{nameSi}</div>
                        {descSi && (
                          <div className="text-[11px] text-slate-400 font-sinhala line-clamp-2">
                            {descSi}
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">தமிழ் (Tamil)</span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('ta')}
                            className="text-[10px] text-brand-neon hover:underline font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="font-bold text-white font-tamil">{nameTa}</div>
                        {descTa && (
                          <div className="text-[11px] text-slate-400 font-tamil line-clamp-2">
                            {descTa}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sinhala Fields */}
            {activeTab === 'si' && (
              <div className="space-y-4 animate-in fade-in">
                <Input
                  label="භාණ්ඩයේ නම (Sinhala)"
                  placeholder="උදා: ඉදිරිපස ඩිස්ක් බ්‍රේක් පෑඩ් කට්ටලය - බජාජ් පල්සර් 150"
                  value={nameSi}
                  onChange={(e) => {
                    setSiManuallyEdited(true);
                    setNameSi(e.target.value);
                  }}
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    විස්තරය (Sinhala)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="ඉහළ තාප ප්‍රතිරෝධී උසස් තත්වයේ බ්‍රේක් පෑඩ්..."
                    value={descSi}
                    onChange={(e) => {
                      setSiManuallyEdited(true);
                      setDescSi(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-neon font-sinhala"
                  />
                </div>
              </div>
            )}

            {/* Tamil Fields */}
            {activeTab === 'ta' && (
              <div className="space-y-4 animate-in fade-in">
                <Input
                  label="பொருளின் பெயர் (Tamil)"
                  placeholder="எ.கா. முன் டிஸ்க் பிரேக் பேட் - பஜாஜ் பல்சர் 150"
                  value={nameTa}
                  onChange={(e) => {
                    setTaManuallyEdited(true);
                    setNameTa(e.target.value);
                  }}
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    விளக்கம் (Tamil)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="உயர்தர பிரேக் பேட்கள்..."
                    value={descTa}
                    onChange={(e) => {
                      setTaManuallyEdited(true);
                      setDescTa(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-neon font-tamil"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Section 3: Product Images (Cloudflare R2 Object Storage) */}
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand-neon" />
                Product Photos & Media
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload motorbike part photos directly to Cloudflare R2 object storage with fast CDN delivery across Sri Lanka.
              </p>
            </div>

            <ImageUploadDropzone
              images={images}
              onChange={setImages}
              folder="products"
              maxFiles={8}
            />
          </Card>

          {/* Section 4: Vehicle Compatibility */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Bike className="w-4 h-4 text-brand-neon" />
                  Motorbike Compatibility / Fitment
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Specify compatible bike models and manufacturing years.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCompatibility}
                className="gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Fitment
              </Button>
            </div>

            <div className="space-y-3">
              {compatibilities.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-3 items-center"
                >
                  <input
                    type="text"
                    placeholder="Make (e.g. Bajaj)"
                    value={c.make}
                    onChange={(e) => updateCompatibility(idx, 'make', e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
                  />
                  <input
                    type="text"
                    placeholder="Model (e.g. Pulsar 150)"
                    value={c.model}
                    onChange={(e) => updateCompatibility(idx, 'model', e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
                  />
                  <input
                    type="number"
                    placeholder="From (2010)"
                    value={c.yearFrom || ''}
                    onChange={(e) => updateCompatibility(idx, 'yearFrom', Number(e.target.value))}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
                  />
                  <input
                    type="number"
                    placeholder="To (2024 or blank)"
                    value={c.yearTo || ''}
                    onChange={(e) =>
                      updateCompatibility(idx, 'yearTo', e.target.value ? Number(e.target.value) : null)
                    }
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
                  />
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <input
                      type="text"
                      placeholder="Chassis (opt)"
                      value={c.chassisCode || ''}
                      onChange={(e) => updateCompatibility(idx, 'chassisCode', e.target.value)}
                      className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon w-24"
                    />
                    <button
                      type="button"
                      onClick={() => removeCompatibility(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Col: Pricing, Margins, Stock, Status */}
        <div className="space-y-6">
          {/* Live Profit Margin Calculator Card */}
          <Card className="p-6 space-y-4 border-brand-neon/30">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-brand-neon" />
              Pricing & Live Margin
            </h2>

            <div className="space-y-3">
              <Input
                label="Cost Price (LKR) *"
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
              />

              <Input
                label="Selling Price (LKR) *"
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
              />
            </div>

            {/* Realtime Margin Display */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Unit Profit</span>
                <span className={cn('font-mono font-bold', profit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {formatLKR(profit)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Gross Margin %</span>
                <span
                  className={cn(
                    'font-mono font-black text-sm',
                    marginPercent >= 30
                      ? 'text-emerald-400'
                      : marginPercent >= 15
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  )}
                >
                  {marginPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>

          {/* Inventory & Logistics Card */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Inventory & Logistics</h2>

            <Input
              label="Initial Stock Quantity *"
              type="number"
              min="0"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              required
            />

            <div>
              <Input
                label="Low Stock Alert Threshold"
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Alerts will trigger in Dashboard and Stock views when inventory drops to or below this amount.
              </p>
            </div>

            <div>
              <Input
                label="Shipping Weight (kg)"
                type="number"
                step="0.05"
                min="0.05"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Used to calculate courier fees (First 1kg = Rs. 425, +Rs. 100/kg extra; Stickers &le; 0.25kg = Rs. 220).
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-brand-neon focus:ring-brand-neon w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-200">
                  Visible in Store Catalog (Active)
                </span>
              </label>
            </div>
          </Card>
        </div>
      </div>

      <QuickAddBrandDialog
        isOpen={quickBrandOpen}
        onClose={() => setQuickBrandOpen(false)}
        onBrandCreated={(newBrand) => setBrandId(newBrand.id)}
      />

      <QuickAddCategoryDialog
        isOpen={quickCategoryOpen}
        onClose={() => setQuickCategoryOpen(false)}
        onCategoryCreated={(newCat) => setCategoryId(newCat.id)}
      />
    </form>
  );
}
