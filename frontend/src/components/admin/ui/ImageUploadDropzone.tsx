'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  X,
  Star,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  Plus,
  ArrowUp,
  ArrowDown,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ImageItem {
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

interface ImageUploadDropzoneProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  folder?: string;
  maxFiles?: number;
}

export function ImageUploadDropzone({
  images,
  onChange,
  folder = 'products',
  maxFiles = 8,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  // Handle uploading files directly to backend -> Cloudflare R2
  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (images.length + fileArray.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} images per product.`);
      return;
    }

    setError('');
    setUploading(true);
    setUploadProgress(`Uploading ${fileArray.length} image${fileArray.length > 1 ? 's' : ''} to Cloudflare R2...`);

    try {
      const formData = new FormData();
      formData.append('folder', folder);

      fileArray.forEach((file) => {
        formData.append('files', file);
      });

      const endpoint =
        fileArray.length === 1 ? `${apiUrl}/admin/uploads` : `${apiUrl}/admin/uploads/multiple`;

      const requestFormData = new FormData();
      requestFormData.append('folder', folder);
      if (fileArray.length === 1) {
        requestFormData.append('file', fileArray[0]);
      } else {
        fileArray.forEach((file) => {
          requestFormData.append('files', file);
        });
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: requestFormData,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error?.message || 'Failed to upload image(s) to Cloudflare R2');
      }

      const uploadedList: Array<{ url: string }> = Array.isArray(json.data)
        ? json.data
        : [json.data];

      // Format full URL if backend returned relative path
      const backendBase = apiUrl.replace(/\/api\/v1\/?$/, '');
      const newItems: ImageItem[] = uploadedList.map((item, idx) => {
        const fullUrl = item.url.startsWith('http')
          ? item.url
          : `${backendBase}${item.url.startsWith('/') ? '' : '/'}${item.url}`;

        const isFirstEver = images.length === 0 && idx === 0;
        return {
          imageUrl: fullUrl,
          isPrimary: isFirstEver,
          displayOrder: images.length + idx,
        };
      });

      // Filter out empty placeholder image if present
      const existing = images.filter((img) => img.imageUrl && img.imageUrl.trim() !== '');
      const updated = [...existing, ...newItems];

      // Ensure at least one primary exists
      if (!updated.some((img) => img.isPrimary) && updated.length > 0) {
        updated[0].isPrimary = true;
      }

      onChange(updated);
    } catch (err: any) {
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const wasPrimary = images[index]?.isPrimary;
    const updated = images
      .filter((_, idx) => idx !== index)
      .map((img, idx) => ({ ...img, displayOrder: idx }));

    if (wasPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const updated = copy.map((img, idx) => ({
      ...img,
      displayOrder: idx,
    }));
    onChange(updated);
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    const isFirst = images.length === 0;
    const newImg: ImageItem = {
      imageUrl: manualUrl.trim(),
      isPrimary: isFirst,
      displayOrder: images.length,
    };
    onChange([...images.filter((img) => img.imageUrl), newImg]);
    setManualUrl('');
    setShowManualUrlInput(false);
  };

  const getDisplayUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const validImages = images.filter((img) => img.imageUrl && img.imageUrl.trim() !== '');

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-brand-neon bg-brand-neon/10 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700',
          uploading && 'pointer-events-none opacity-80'
        )}
      >
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-lg shadow-black/40 group-hover:scale-105 transition-transform">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-brand-neon animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6 text-brand-neon" />
          )}
        </div>

        <h3 className="text-sm font-bold text-white mb-1">
          {uploading ? 'Streaming to Cloudflare R2...' : 'Click to upload or drag & drop'}
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-3">
          High-resolution photos are securely saved to Cloudflare R2 storage with edge CDN delivery across Sri Lanka.
        </p>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">JPG</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">PNG</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">WEBP</span>
          <span>• Max 5MB each</span>
        </div>

        {uploadProgress && (
          <div className="mt-4 flex items-center gap-2 text-xs text-brand-neon font-medium animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{uploadProgress}</span>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded Images List */}
      {validImages.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
            <span>
              Product Gallery ({validImages.length} of {maxFiles})
            </span>
            <span className="text-[11px] text-slate-500">First image or starred is primary</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {validImages.map((img, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200',
                  img.isPrimary
                    ? 'bg-slate-900 border-brand-neon/60 shadow-lg shadow-brand-neon/5'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                )}
              >
                {/* Thumbnail Preview */}
                <div className="relative w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getDisplayUrl(img.imageUrl)}
                    alt={`Product photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    loading="lazy"
                  />
                  {img.isPrimary && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-brand-neon text-black text-[9px] font-black uppercase tracking-wider shadow z-10">
                      Primary
                    </div>
                  )}
                </div>

                {/* Info & Reordering */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-slate-300 truncate" title={img.imageUrl}>
                    {img.imageUrl.split('/').pop() || 'product-image'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-colors',
                        img.isPrimary
                          ? 'bg-brand-neon text-black'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      )}
                    >
                      <Star className={cn('w-2.5 h-2.5', img.isPrimary && 'fill-black')} />
                      {img.isPrimary ? 'Cover Image' : 'Set Cover'}
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === validImages.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual URL toggle for flexibility */}
      <div className="pt-1">
        {!showManualUrlInput ? (
          <button
            type="button"
            onClick={() => setShowManualUrlInput(true)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-neon transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Or add image from direct external URL</span>
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Add External Image URL</span>
              <button
                type="button"
                onClick={() => setShowManualUrlInput(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon font-mono"
              />
              <Button type="button" size="sm" onClick={handleAddManualUrl} className="text-xs gap-1">
                <Plus className="w-3 h-3" />
                Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
