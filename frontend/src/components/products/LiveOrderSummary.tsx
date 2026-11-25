'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AppLocale, DeliveryZone, LocalizedProduct } from '@/lib/db/schema.types';
import { formatLKR } from '@/lib/utils/currency';
import { getDeliveryFeeDetails } from '@/services/deliveryService';
import {
  Truck,
  Plus,
  Minus,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  Landmark,
  FileCheck2,
  Info,
} from 'lucide-react';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';
import WhatsAppOrderModal from './WhatsAppOrderModal';

interface LiveOrderSummaryProps {
  product: LocalizedProduct;
  deliveryZones: DeliveryZone[];
}

export default function LiveOrderSummary({
  product,
  deliveryZones,
}: LiveOrderSummaryProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const t = useTranslations('product');

  const [availableStock, setAvailableStock] = useState(product.stock_qty);
  const [quantity, setQuantity] = useState(1);
  const [selectedDistrict, setSelectedDistrict] = useState(
    deliveryZones[0]?.district || 'Colombo'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setAvailableStock(product.stock_qty);
  }, [product.stock_qty]);

  useEffect(() => {
    if (availableStock > 0 && quantity > availableStock) {
      setQuantity(availableStock);
    }
  }, [availableStock, quantity]);

  const isOutOfStock = availableStock <= 0;

  // Selected Zone
  const currentZone =
    deliveryZones.find(
      (z) => z.district.toLowerCase() === selectedDistrict.toLowerCase()
    ) || deliveryZones[0];

  const unitWeightKg = Number(product.weight_kg || 1);
  const totalWeightKg = Number((unitWeightKg * quantity).toFixed(3));

  const deliveryDetails = getDeliveryFeeDetails(
    currentZone,
    totalWeightKg,
    product.category_slug
  );
  const deliveryFee = deliveryDetails.fee;
  const subtotal = product.selling_price * quantity;
  const grandTotal = subtotal + deliveryFee;

  const handleIncrement = () => {
    if (quantity < availableStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Price & Stock Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            {t('pricePerUnit')}
          </div>
          <div className="text-3xl font-black text-white mt-0.5">
            {formatLKR(product.selling_price, locale)}
          </div>
        </div>

        <div>
          {isOutOfStock ? (
            <div className="inline-flex items-center gap-1.5 bg-red-950/80 text-red-300 border border-red-700/60 px-3 py-1 rounded-full text-xs font-bold">
              <XCircle className="w-3.5 h-3.5" />
              <span>{t('outOfStock')}</span>
            </div>
          ) : availableStock <= (product.low_stock_threshold ?? 5) ? (
            <div className="inline-flex items-center gap-1.5 bg-amber-950/80 text-amber-300 border border-amber-700/60 px-3 py-1 rounded-full text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t('lowStock', { qty: availableStock })}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-3 py-1 rounded-full text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('inStock')} ({availableStock})</span>
            </div>
          )}
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>{t('quantity')}</span>
          <span className="text-slate-400">
            {availableStock > 0
              ? t('availableQty', { qty: availableStock })
              : t('zeroAvailable')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-1">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1 || isOutOfStock}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-bold text-lg text-white">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={quantity >= availableStock || isOutOfStock}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-400">
            {t('subtotal')}: <span className="text-white font-bold">{formatLKR(subtotal, locale)}</span>
          </div>
        </div>
      </div>

      {/* Delivery District Selector */}
      <div className="space-y-2">
        <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-[#ccff00]" />
            <span>{t('selectDistrict')}</span>
          </span>
          {currentZone && (
            <span className="text-[#ccff00] font-normal text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{currentZone.estimated_days}</span>
            </span>
          )}
        </label>

        <div className="relative">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full bg-[#070a12] border border-[#1f293d] focus:border-[#ccff00] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none cursor-pointer appearance-none font-medium"
          >
            {deliveryZones.map((z) => (
              <option key={z.id} value={z.district}>
                {z.district} ({z.province} Province) — Delivery Rs. {z.base_fee}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
            ▼
          </div>
        </div>
      </div>

      {/* Live Order Calculation Breakdown */}
      <div className="bg-[#070a12] border border-[#1a2336] rounded-2xl p-4 space-y-2.5 text-xs">
        <div className="flex justify-between text-slate-300">
          <span>
            {t('subtotal')} ({quantity} × {formatLKR(product.selling_price, locale)})
          </span>
          <span className="font-semibold text-white">{formatLKR(subtotal, locale)}</span>
        </div>

        <div className="flex justify-between text-slate-300">
          <span className="flex flex-wrap items-center gap-1.5">
            <span>
              {t('deliveryCost')} ({selectedDistrict} • {t('packedWeight')}:{' '}
              <strong className="text-white">
                {totalWeightKg < 1
                  ? `${Math.round(totalWeightKg * 1000)}g`
                  : `${totalWeightKg} ${t('kg')}`}
              </strong>
              )
            </span>
            {deliveryDetails.isStickerSpeedPost && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-semibold">
                SL Speed Post (&lt; 250g)
              </span>
            )}
          </span>
          <span className="font-semibold text-white">{formatLKR(deliveryFee, locale)}</span>
        </div>

        {!deliveryDetails.isStickerSpeedPost && (
          <div className="text-[11px] text-slate-400 space-y-1 pl-2.5 border-l-2 border-slate-800">
            <div className="flex justify-between">
              <span>{t('districtBaseFee', { district: selectedDistrict })}</span>
              <span>{formatLKR(deliveryDetails.baseFee, locale)}</span>
            </div>
            {deliveryDetails.extraKg > 0 && (
              <div className="flex justify-between text-[#ccff00]/90 font-medium">
                <span>
                  {t('extraPackedWeight', {
                    extraKg: deliveryDetails.extraKg,
                    rate: currentZone?.extra_per_kg ?? 100,
                  })}
                </span>
                <span>+{formatLKR(deliveryDetails.extraFee, locale)}</span>
              </div>
            )}
          </div>
        )}

        <div className="pt-2.5 border-t border-[#1a2336] flex justify-between items-center text-sm">
          <div>
            <span className="font-black text-white uppercase tracking-wider text-xs block">
              {t('total')}
            </span>
            <span className="text-[10px] text-slate-400">
              {t('totalWithDeliverySub', { district: selectedDistrict })}
            </span>
          </div>
          <span className="font-black text-2xl sm:text-3xl text-[#ccff00] tracking-tight neon-text-glow">
            {formatLKR(grandTotal, locale)}
          </span>
        </div>
      </div>

      {/* Pre-Order Instructions Card (Localized to selected language) */}
      <div className="bg-[#070a12] border border-[#ccff00]/30 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-black text-[#ccff00] uppercase tracking-wider">
          <Info className="w-4 h-4 shrink-0" />
          <span>{t('howToOrderTitle')}</span>
        </div>

        <ol className="text-[11.5px] text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>{t('howToOrderStep1', { total: formatLKR(grandTotal, locale) })}</li>
          <li>{t('howToOrderStep2')}</li>
          <li>
            {t('howToOrderStep3')}{' '}
            <span className="text-[#ccff00] font-bold underline">
              {t('howToOrderStep3Remark')}
            </span>
          </li>
          <li>{t('howToOrderStep4')}</li>
        </ol>
      </div>

      {/* Direct Buy CTA Button */}
      <div className="pt-1">
        {isOutOfStock ? (
          <a
            href={`https://wa.me/94770871018?text=${encodeURIComponent(
              `Hello ShiftLK Spares, I would like to inquire when "${product.name}" (OEM: ${product.part_number}) will be back in stock.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold py-4 px-6 rounded-2xl text-sm transition-all shadow-md cursor-pointer"
          >
            <WhatsAppIcon className="w-5 h-5 text-[#ccff00]" />
            <span>{t('chatForAvailability')}</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 bg-[#ccff00] hover:bg-[#d8ff33] text-black font-black py-4 px-6 rounded-2xl text-base shadow-xl shadow-[#ccff00]/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Zap className="w-5 h-5 text-black fill-black shrink-0" />
            <span>{t('buyNowBtn', { total: formatLKR(grandTotal, locale) })}</span>
          </button>
        )}
      </div>

      {/* Direct Bank Transfer Security Note */}
      <div className="flex items-start gap-2.5 text-[11px] text-slate-400 bg-[#070a12] p-3 rounded-xl border border-[#1a2336]">
        <Landmark className="w-4 h-4 text-[#ccff00] shrink-0 mt-0.5" />
        <span>{t('directCheckoutNote')}</span>
      </div>

      {/* Direct Buy & Bank Slip Upload Modal */}
      <WhatsAppOrderModal
        product={product}
        quantity={quantity}
        selectedDistrict={selectedDistrict}
        deliveryZones={deliveryZones}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDistrictChange={(newDistrict) => setSelectedDistrict(newDistrict)}
        onStockReserved={(remainingStock) => setAvailableStock(remainingStock)}
        onStockReleased={(restoredQty, currentStock) => {
          if (typeof currentStock === 'number') {
            setAvailableStock(currentStock);
          } else {
            setAvailableStock((prev) => prev + restoredQty);
          }
          router.refresh();
        }}
        onOrderCompleted={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
