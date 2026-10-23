'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Boxes,
  History,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatLKR, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/common/Toast';
import { ImageUploadDropzone } from '@/components/admin/ui/ImageUploadDropzone';

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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  // Basic Details
  const [partNumber, setPartNumber] = useState('');
  const [slug, setSlug] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState<'NEW' | 'RECONDITIONED' | 'USED'>('NEW');

  // Translations
  const [nameEn, setNameEn] = useState('');
  const [descEn, setDescEn] = useState('');
  const [nameSi, setNameSi] = useState('');
  const [descSi, setDescSi] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [descTa, setDescTa] = useState('');
  const [activeTab, setActiveTab] = useState<'en' | 'si' | 'ta'>('en');

  // Pricing & Stock
  const [costPrice, setCostPrice] = useState<string>('0');
  const [sellingPrice, setSellingPrice] = useState<string>('0');
  const [stockQty, setStockQty] = useState<string>('0');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('5');
  const [weightKg, setWeightKg] = useState<string>('1.0');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Images
  const [images, setImages] = useState<ImageItem[]>([]);

  // Compatibilities
  const [compatibilities, setCompatibilities] = useState<CompatibilityItem[]>([]);

  // Fetch Brands & Categories
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => apiClient<any[]>('/api/v1/brands'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient<any[]>('/api/v1/categories'),
  });

  // Fetch Existing Product
  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => apiClient<any>(`/api/v1/admin/products/${productId}`),
    enabled: !!productId,
  });

  // Pre-fill fields when data loads
  useEffect(() => {
    if (product) {
      setPartNumber(product.partNumber || '');
      setSlug(product.slug || '');
      setBrandId(product.brandId || product.brand?.id || '');
      setCategoryId(product.categoryId || product.category?.id || '');
      setCondition(product.condition || 'NEW');

      const enTrans = product.translations?.find((t: any) => t.language === 'en');
      const siTrans = product.translations?.find((t: any) => t.language === 'si');
      const taTrans = product.translations?.find((t: any) => t.language === 'ta');

      setNameEn(enTrans?.name || '');
      setDescEn(enTrans?.description || '');
      setNameSi(siTrans?.name || '');
      setDescSi(siTrans?.description || '');
      setNameTa(taTrans?.name || '');
      setDescTa(taTrans?.description || '');

      setCostPrice(String(product.costPrice ?? 0));
      setSellingPrice(String(product.sellingPrice ?? 0));
      setStockQty(String(product.stockQty ?? 0));
      setLowStockThreshold(String(product.lowStockThreshold ?? 5));
      setWeightKg(String(product.weightKg ?? 1.0));
      setIsActive(product.isActive ?? true);

      if (product.images && product.images.length > 0) {
        setImages(
          product.images.map((img: any) => ({
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
            displayOrder: img.displayOrder,
          }))
        );
      } else {
        setImages([{ imageUrl: '', isPrimary: true, displayOrder: 0 }]);
      }

      if (product.compatibilities && product.compatibilities.length > 0) {
        setCompatibilities(
          product.compatibilities.map((c: any) => ({
            make: c.make,
            model: c.model,
            yearFrom: c.yearFrom,
            yearTo: c.yearTo,
            chassisCode: c.chassisCode,
          }))
        );
      } else {
        setCompatibilities([]);
      }
    }
  }, [product]);

  // Profit & Margin calculations
  const cost = Number(costPrice) || 0;
  const selling = Number(sellingPrice) || 0;
  const profit = selling - cost;
  const marginPercent = selling > 0 ? (profit / selling) * 100 : 0;

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

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient(`/api/v1/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
      success('Product updated successfully');
      router.push('/admin/products');
    },
    onError: (err: any) => {
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        const fieldErrors = err.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
        toastError(`Validation Error: ${fieldErrors}`);
      } else {
        toastError(err.message || 'Failed to update product');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameEn.trim()) {
      toastError('English product name is required');
      return;
    }

    if (selling <= 0) {
      toastError('Selling price must be greater than LKR 0');
      return;
    }

    const translations = [
      { language: 'en', name: nameEn.trim(), description: descEn.trim() || nameEn.trim() },
    ];
    if (nameSi.trim()) {
      translations.push({ language: 'si', name: nameSi.trim(), description: descSi.trim() || nameSi.trim() });
    }
    if (nameTa.trim()) {
      translations.push({ language: 'ta', name: nameTa.trim(), description: descTa.trim() || nameTa.trim() });
    }

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

    const validCompatibilities = compatibilities
      .filter((c) => c.make.trim() !== '' && c.model.trim() !== '')
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

    const payload = {
      slug: cleanSlug,
      partNumber: partNumber.trim() || `PART-${Date.now().toString(36).toUpperCase()}`,
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

    updateMutation.mutate(payload);
  };

  if (loadingProduct) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

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
              Edit Product: {partNumber}
            </h1>
            <p className="text-xs text-slate-400">
              Update inventory specifications, pricing margins, and multilingual information.
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
            loading={updateMutation.isPending}
            className="font-bold gap-1.5 shadow-lg shadow-brand-neon/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            Update Product
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
              <Input
                label="OEM / Part Number"
                placeholder="e.g. 15100-28H00-000"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                required
              />

              <Input
                label="URL Slug"
                placeholder="e.g. pulsar-150-front-brake-pad"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Brand *
                </label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
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
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Multilingual Product Names & Descriptions
              </h2>
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
                    'px-3 py-1 rounded-lg text-xs font-bold transition-colors',
                    activeTab === 'si'
                      ? 'bg-brand-neon/20 text-brand-neon'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  සිංහල (Sinhala)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ta')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-colors',
                    activeTab === 'ta'
                      ? 'bg-brand-neon/20 text-brand-neon'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  தமிழ் (Tamil)
                </button>
              </div>
            </div>

            {/* English Fields */}
            {activeTab === 'en' && (
              <div className="space-y-4 animate-in fade-in">
                <Input
                  label="Product Title (English) *"
                  placeholder="e.g. Front Disc Brake Pad Set - Bajaj Pulsar 150/180"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
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
                    onChange={(e) => setDescEn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-neon"
                  />
                </div>
              </div>
            )}

            {/* Sinhala Fields */}
            {activeTab === 'si' && (
              <div className="space-y-4 animate-in fade-in">
                <Input
                  label="භාණ්ඩයේ නම (Sinhala)"
                  placeholder="උදා: ඉදිරිපස ඩිස්ක් බ්‍රේක් පෑඩ් කට්ටලය - බජාජ් පල්සර් 150"
                  value={nameSi}
                  onChange={(e) => setNameSi(e.target.value)}
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    විස්තරය (Sinhala)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="ඉහළ තාප ප්‍රතිරෝධී උසස් තත්වයේ බ්‍රේක් පෑඩ්..."
                    value={descSi}
                    onChange={(e) => setDescSi(e.target.value)}
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
                  onChange={(e) => setNameTa(e.target.value)}
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    விளக்கம் (Tamil)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="உயர்தர பிரேக் பேட்கள்..."
                    value={descTa}
                    onChange={(e) => setDescTa(e.target.value)}
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
            <h2 className="text-base font-bold text-white flex items-center justify-between">
              <span>Inventory & Logistics</span>
              <Link href="/admin/stock" className="text-xs text-brand-neon hover:underline flex items-center gap-1">
                <History className="w-3.5 h-3.5" />
                History
              </Link>
            </h2>

            <Input
              label="Stock Quantity *"
              type="number"
              min="0"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              required
            />

            <Input
              label="Low Stock Alert Threshold"
              type="number"
              min="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
            />

            <Input
              label="Shipping Weight (kg)"
              type="number"
              step="0.05"
              min="0.05"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
            />

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
    </form>
  );
}
