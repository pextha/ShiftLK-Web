'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const displayImages = images && images.length > 0
    ? images
    : ['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80'];

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Main Large Image */}
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-xl">
        <Image
          src={displayImages[activeIndex]}
          alt={`${productName} image ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center transition-all duration-300"
        />
      </div>

      {/* Thumbnails row (if more than 1 image) */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                activeIndex === idx
                  ? 'border-[#ccff00] ring-2 ring-[#ccff00]/40 shadow-md shadow-[#ccff00]/10'
                  : 'border-[#1f293d] opacity-60 hover:opacity-100 hover:border-slate-600'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
