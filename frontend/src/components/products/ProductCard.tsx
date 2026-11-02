'use client';

import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { AppLocale, LocalizedProduct } from '@/lib/db/schema.types';
import { formatLKR } from '@/lib/utils/currency';
import {
  resolveProductImageUrl,
  isLocalOrUnoptimizedImage,
} from '@/lib/utils/image';
import { useCart } from '@/lib/cart-context';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Car,
  ChevronRight,
  ShoppingCart,
} from 'lucide-react';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';
import Image from 'next/image';

interface ProductCardProps {
  product: LocalizedProduct;
  onQuickOrder?: (product: LocalizedProduct) => void;
}

export default function ProductCard({ product, onQuickOrder }: ProductCardProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('product');
  const tFilters = useTranslations('filters');
  const tCommon = useTranslations('common');
  const { addItem } = useCart();

  const isOutOfStock = product.stock_qty <= 0;
  const isLowStock =
    product.stock_qty > 0 && product.stock_qty <= (product.low_stock_threshold ?? 5);

  const getConditionBadge = () => {
    switch (product.condition) {
      case 'new':
        return (
          <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
            {tFilters('new')}
          </span>
        );
      case 'reconditioned':
        return (
          <span className="bg-[#121926]/90 text-[#ccff00] border border-[#ccff00]/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md">
            {tFilters('reconditioned')}
          </span>
        );
      case 'used':
        return (
          <span className="bg-sky-950/90 text-sky-300 border border-sky-700/60 text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
            {tFilters('used')}
          </span>
        );
    }
  };

  const primaryImage = resolveProductImageUrl(product.images?.[0]);

  const previewCompatibility = product.compatibility?.slice(0, 2) || [];

  return (
    <div className="group relative flex flex-col bg-[#0b0f19] rounded-2xl border border-[#1d273a] hover:border-[#ccff00]/60 hover:shadow-[0_10px_30px_rgba(204,255,0,0.08)] transition-all duration-200 overflow-hidden">
      {/* Top Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-4/3 w-full overflow-hidden bg-slate-950 block"
      >
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          unoptimized={isLocalOrUnoptimizedImage(primaryImage)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Condition Badge (Top Left) */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {getConditionBadge()}
        </div>

        {/* Stock Status Badge (Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 bg-red-950/90 text-red-300 border border-red-700/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md">
              <XCircle className="w-3 h-3" />
              <span>{t('outOfStock')}</span>
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 bg-amber-950/90 text-amber-300 border border-amber-700/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md">
              <AlertTriangle className="w-3 h-3" />
              <span>Only {product.stock_qty} Left</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md">
              <CheckCircle2 className="w-3 h-3" />
              <span>{t('inStock')}</span>
            </span>
          )}
        </div>
      </Link>

      {/* Content Container */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Brand & Part Number Pill */}
        <div className="flex items-center justify-between gap-2 text-xs mb-2">
          <span className="font-extrabold text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/25 px-2.5 py-0.5 rounded-lg truncate">
            {product.brand}
          </span>
          <span className="font-mono text-[11px] text-slate-300 bg-[#141b2b] border border-[#212c42] px-2 py-0.5 rounded-lg truncate">
            {product.part_number}
          </span>
        </div>

        {/* Product Title */}
        <Link
          href={`/products/${product.slug}`}
          className="font-bold text-white text-base hover:text-[#ccff00] line-clamp-2 transition-colors mb-2.5"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Vehicle compatibility preview pill */}
        {previewCompatibility.length > 0 && (
          <div className="mb-4 text-xs text-slate-400 flex items-center gap-1.5 overflow-hidden">
            <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {previewCompatibility
                .map((c) => `${c.make} ${c.model}`)
                .join(', ')}
              {product.compatibility.length > 2 &&
                ` +${product.compatibility.length - 2} more`}
            </span>
          </div>
        )}

        {/* Pricing & CTA */}
        <div className="mt-auto pt-3 border-t border-[#1c2436] flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Selling Price
            </div>
            <div className="text-lg sm:text-xl font-black text-white">
              {formatLKR(product.selling_price, locale)}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!isOutOfStock && (
              <button
                type="button"
                onClick={() => addItem(product, 1, true)}
                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-[#141b2b] hover:bg-[#ccff00] hover:text-black border border-[#212c42] text-[#ccff00] transition-all cursor-pointer"
                title="Add to Cart"
                aria-label="Add to Cart"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}

            <Link
              href={`/products/${product.slug}`}
              className="inline-flex items-center justify-center p-2.5 sm:px-3 sm:py-2 rounded-xl bg-[#141b2b] hover:bg-[#ccff00] hover:text-black border border-[#212c42] text-slate-200 text-xs font-bold transition-all"
              title="View Part Details"
            >
              <span className="hidden sm:inline mr-1">{tCommon('viewDetails')}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            {onQuickOrder ? (
              <button
                type="button"
                onClick={() => onQuickOrder(product)}
                disabled={isOutOfStock}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  isOutOfStock
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-[#25D366] hover:bg-[#20ba59] text-black shadow-md shadow-emerald-950/40 cursor-pointer active:scale-95'
                }`}
                title="Order via WhatsApp"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-black" />
                <span className="hidden xs:inline">Order</span>
              </button>
            ) : (
              <Link
                href={`/products/${product.slug}`}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  isOutOfStock
                    ? 'bg-slate-800 text-slate-500'
                    : 'bg-[#25D366] hover:bg-[#20ba59] text-black shadow-md shadow-emerald-950/40'
                }`}
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-black" />
                <span>Order</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
