'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AppLocale, DeliveryZone, LocalizedProduct } from '@/lib/db/schema.types';
import { formatLKR } from '@/lib/utils/currency';
import { validateSriLankanPhone } from '@/lib/utils/phone-validator';
import { getDeliveryFeeDetails } from '@/services/deliveryService';
import {
  X,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';

interface WhatsAppOrderModalProps {
  product: LocalizedProduct;
  quantity: number;
  selectedDistrict: string;
  deliveryZones: DeliveryZone[];
  isOpen: boolean;
  onClose: () => void;
  onDistrictChange?: (district: string) => void;
}

export default function WhatsAppOrderModal({
  product,
  quantity,
  selectedDistrict,
  deliveryZones,
  isOpen,
  onClose,
  onDistrictChange,
}: WhatsAppOrderModalProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('orderModal');
  const tProd = useTranslations('product');

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState(selectedDistrict || 'Colombo');
  const [notes, setNotes] = useState('');

  // Status & Validation State
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{
    orderCode: string;
    whatsAppUrl: string;
  } | null>(null);

  if (!isOpen) return null;

  // Selected Zone & Costs
  const currentZone =
    deliveryZones.find((z) => z.district.toLowerCase() === district.toLowerCase()) ||
    deliveryZones[0];

  const deliveryDetails = getDeliveryFeeDetails(
    currentZone,
    (product.weight_kg || 1) * quantity,
    product.category_slug
  );
  const deliveryCost = deliveryDetails.fee;
  const subtotal = product.selling_price * quantity;
  const total = subtotal + deliveryCost;

  const handlePhoneBlur = () => {
    if (!phone) return;
    const res = validateSriLankanPhone(phone);
    if (!res.isValid) {
      setPhoneError(res.error || t('phoneError'));
    } else {
      setPhoneError(null);
      setPhone(res.formattedLocal); // Nice format
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Validation
    if (!customerName.trim()) {
      setGeneralError(t('nameRequired'));
      return;
    }

    const phoneRes = validateSriLankanPhone(phone);
    if (!phoneRes.isValid) {
      setPhoneError(phoneRes.error || t('phoneError'));
      return;
    }
    setPhoneError(null);

    if (!address.trim()) {
      setGeneralError(t('addressRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          customerName: customerName.trim(),
          phone: phoneRes.cleanNumber,
          address: address.trim(),
          district,
          notes: notes.trim(),
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit order');
      }

      setSuccessOrder({
        orderCode: data.orderCode,
        whatsAppUrl: data.whatsAppUrl,
      });

      // Attempt to open WhatsApp immediately in a new tab
      if (typeof window !== 'undefined' && data.whatsAppUrl) {
        window.open(data.whatsAppUrl, '_blank');
      }
    } catch (err: unknown) {
      console.error('Order creation error:', err);
      const message = err instanceof Error ? err.message : 'Error creating order. Please try again.';
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <WhatsAppIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {successOrder ? t('successTitle') : t('title')}
              </h3>
              <p className="text-xs text-slate-400">ShiftLK WhatsApp Gateway</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {successOrder ? (
            /* Success confirmation view */
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/40">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-white mb-1">
                  Order Registered!
                </h4>
                <div className="inline-block bg-slate-950 border border-brand-neon/40 px-3.5 py-1 rounded-xl font-mono text-sm font-bold text-brand-neon mb-2 shadow-sm shadow-brand-neon/10">
                  {successOrder.orderCode}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {t('successDesc', { orderCode: successOrder.orderCode })}
                </p>
              </div>

              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Item:</span>
                  <span className="font-semibold text-white truncate max-w-[200px]">
                    {product.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="font-semibold text-white">{quantity} unit(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total with Delivery:</span>
                  <span className="font-bold text-brand-neon text-sm">
                    {formatLKR(total, locale)}
                  </span>
                </div>
              </div>

              <div className="w-full pt-2 flex flex-col gap-2.5">
                <a
                  href={successOrder.whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-950/50 transition-all text-sm"
                >
                  <WhatsAppIcon className="w-5 h-5 text-white" />
                  <span>{t('openWhatsAppDirect')}</span>
                  <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            /* Order Input Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {generalError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Order preview snippet */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="font-semibold text-white line-clamp-1">
                  {product.name}
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>
                    Part <span className="font-mono text-brand-neon font-semibold">#{product.part_number}</span> • Qty: {quantity}
                  </span>
                  <span className="text-slate-200 font-semibold font-mono">
                    {formatLKR(subtotal, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 border-t border-slate-800/80 pt-1.5">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-brand-neon" />
                    <span>
                      {deliveryDetails.isStickerSpeedPost
                        ? 'SL Speed Post (Stickers < 250g):'
                        : `Delivery (${district}):`}
                    </span>
                  </span>
                  <span className="text-slate-300 font-semibold font-mono">
                    {formatLKR(deliveryCost, locale)}
                  </span>
                </div>
                {deliveryDetails.extraKg > 0 && (
                  <div className="text-[10px] text-slate-400 flex justify-between pl-5">
                    <span>+{deliveryDetails.extraKg} kg extra weight (@ Rs. 100/kg)</span>
                    <span>+{formatLKR(deliveryDetails.extraFee, locale)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-bold text-white border-t border-slate-800 pt-1.5">
                  <span>Grand Total:</span>
                  <span className="text-brand-neon font-black text-base neon-text-glow font-mono">
                    {formatLKR(total, locale)}
                  </span>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('phone')} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  onBlur={handlePhoneBlur}
                  placeholder={t('phonePlaceholder')}
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-all outline-none ${
                    phoneError
                      ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20'
                      : 'border-slate-700/80 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/40'
                  }`}
                />
                {phoneError ? (
                  <p className="text-[11px] text-red-400 mt-1">{phoneError}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format: 077 087 1018 or +94 77 087 1018
                  </p>
                )}
              </div>

              {/* District Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('district')} *
                </label>
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    if (onDistrictChange) onDistrictChange(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-brand-neon rounded-xl px-3.5 py-2.5 text-sm text-white outline-none cursor-pointer"
                >
                  {deliveryZones.map((z) => (
                    <option key={z.id} value={z.district}>
                      {z.district} ({z.province} Province - Rs. {z.base_fee})
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('address')} *
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('addressPlaceholder')}
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/40 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 resize-none transition-all outline-none"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('notes')}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-brand-neon rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-950/50 transition-all text-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('processing')}</span>
                    </>
                  ) : (
                    <>
                      <WhatsAppIcon className="w-5 h-5 text-white" />
                      <span>{t('submitBtn')}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-neon" />
                <span>No online payment required. Pay upon delivery or bank transfer via WhatsApp.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
