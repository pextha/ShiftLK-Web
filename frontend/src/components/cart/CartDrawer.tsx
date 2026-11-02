'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useCart } from '@/lib/cart-context';
import { AppLocale } from '@/lib/db/schema.types';
import { SEED_DELIVERY_ZONES } from '@/lib/db/seed-data';
import { formatLKR } from '@/lib/utils/currency';
import { validateSriLankanPhone } from '@/lib/utils/phone-validator';
import { getDeliveryFeeDetails } from '@/services/deliveryService';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Truck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  PackageSearch,
  Scale,
} from 'lucide-react';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';

export default function CartDrawer() {
  const locale = useLocale() as AppLocale;
  const tModal = useTranslations('orderModal');
  const tProd = useTranslations('product');
  const tNav = useTranslations('nav');

  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQty,
    removeItem,
    clearCart,
    totalItemsCount,
    subtotal,
    totalWeightKg,
    isAllStickers,
  } = useCart();

  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [district, setDistrict] = useState('Colombo');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{
    orderCode: string;
    whatsAppUrl: string;
    total: number;
    itemCount: number;
  } | null>(null);

  if (!isCartOpen) return null;

  const selectedZone =
    SEED_DELIVERY_ZONES.find((z) => z.district.toLowerCase() === district.toLowerCase()) ||
    SEED_DELIVERY_ZONES[0];

  const deliveryDetails = getDeliveryFeeDetails(
    selectedZone,
    totalWeightKg,
    isAllStickers ? 'body-stickers' : undefined
  );
  const deliveryCost = items.length > 0 ? deliveryDetails.fee : 0;
  const grandTotal = subtotal + deliveryCost;

  const handleClose = () => {
    setIsCartOpen(false);
    if (step === 'success') {
      setStep('cart');
      setSuccessOrder(null);
    }
  };

  const handlePhoneBlur = () => {
    if (!phone) return;
    const res = validateSriLankanPhone(phone);
    if (!res.isValid) {
      setPhoneError(res.error || tModal('phoneError'));
    } else {
      setPhoneError(null);
      setPhone(res.formattedLocal);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (items.length === 0) return;

    if (!customerName.trim()) {
      setGeneralError(tModal('nameRequired'));
      return;
    }

    const phoneRes = validateSriLankanPhone(phone);
    if (!phoneRes.isValid) {
      setPhoneError(phoneRes.error || tModal('phoneError'));
      return;
    }
    setPhoneError(null);

    if (!address.trim()) {
      setGeneralError(tModal('addressRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            qty: item.qty,
          })),
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
        throw new Error(data.error || 'Failed to place order');
      }

      setSuccessOrder({
        orderCode: data.orderCode,
        whatsAppUrl: data.whatsAppUrl,
        total: grandTotal,
        itemCount: totalItemsCount,
      });
      clearCart();
      setStep('success');

      if (typeof window !== 'undefined' && data.whatsAppUrl) {
        window.open(data.whatsAppUrl, '_blank');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to submit order. Please try again.';
      setGeneralError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={handleClose} />

      {/* Slide-over Drawer */}
      <div className="w-full max-w-md bg-[#080c14] border-l border-[#1c2436] h-full flex flex-col shadow-2xl text-slate-100">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c2436] bg-[#05070c]">
          <div className="flex items-center gap-2.5">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="p-2 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                {step === 'checkout'
                  ? tModal('title')
                  : step === 'success'
                  ? tModal('successTitle')
                  : `Your Parts Cart (${totalItemsCount})`}
              </h3>
              <p className="text-[11px] text-slate-400">
                {step === 'checkout'
                  ? 'Combined islandwide courier checkout'
                  : 'Add multiple spare parts for combined delivery'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        {step === 'success' && successOrder ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/40">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-xl font-black text-white mb-1">Order Registered!</h4>
              <div className="inline-block bg-slate-950 border border-[#ccff00]/40 px-4 py-1.5 rounded-xl font-mono text-base font-black text-[#ccff00] mb-2">
                {successOrder.orderCode}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                {tModal('successDesc', { orderCode: successOrder.orderCode })}
              </p>
            </div>

            <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Parts:</span>
                <span className="font-bold text-white">{successOrder.itemCount} item(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery District:</span>
                <span className="font-bold text-white">{district}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-300 font-bold">Grand Total:</span>
                <span className="font-mono font-black text-[#ccff00] text-sm">
                  {formatLKR(successOrder.total, locale)}
                </span>
              </div>
            </div>

            <div className="w-full space-y-2.5 pt-2">
              <a
                href={successOrder.whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-black font-black py-3.5 px-6 rounded-2xl text-sm shadow-lg transition-all"
              >
                <WhatsAppIcon className="w-5 h-5 text-black" />
                <span>{tModal('openWhatsAppDirect')}</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>

              <Link
                href={`/track-order?code=${encodeURIComponent(successOrder.orderCode)}&phone=${encodeURIComponent(phone)}`}
                onClick={handleClose}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-[#ccff00]/30 text-[#ccff00] font-bold py-3 px-6 rounded-2xl text-xs transition-all"
              >
                <PackageSearch className="w-4 h-4" />
                <span>
                  {tNav('trackOrder')} ({successOrder.orderCode})
                </span>
              </Link>
            </div>
          </div>
        ) : step === 'checkout' ? (
          <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            {generalError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Summary Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>
                  {totalItemsCount} part(s) • {totalWeightKg.toFixed(2)} kg
                </span>
                <span className="font-mono text-white font-semibold">
                  {formatLKR(subtotal, locale)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>
                  {deliveryDetails.isStickerSpeedPost
                    ? 'SL Speed Post (< 250g)'
                    : `Courier (${district})`}
                </span>
                <span className="font-mono text-white font-semibold">
                  {formatLKR(deliveryCost, locale)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="font-mono text-[#ccff00] text-base">
                  {formatLKR(grandTotal, locale)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {tModal('fullName')} *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={tModal('fullNamePlaceholder')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#ccff00] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {tModal('phone')} *
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
                placeholder={tModal('phonePlaceholder')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#ccff00] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
              {phoneError && <p className="text-[11px] text-rose-400 mt-1">{phoneError}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {tModal('district')} *
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#ccff00] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              >
                {SEED_DELIVERY_ZONES.map((z) => (
                  <option key={z.id} value={z.district}>
                    {z.district} ({z.province} Province - Rs. {z.base_fee})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {tModal('address')} *
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={tModal('addressPlaceholder')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#ccff00] rounded-xl px-3.5 py-2 text-sm text-white outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {tModal('notes')}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tModal('notesPlaceholder')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#ccff00] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-black font-black py-3.5 px-6 rounded-2xl text-sm shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{tModal('processing')}</span>
                  </>
                ) : (
                  <>
                    <WhatsAppIcon className="w-5 h-5 text-black" />
                    <span>{tModal('submitBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-base">Your Cart is Empty</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Browse our motorbike spare parts catalog and add multiple items to combine shipping.
              </p>
            </div>
            <Link
              href="/products"
              onClick={handleClose}
              className="bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs px-5 py-2.5 rounded-xl transition-all"
            >
              Browse Spare Parts
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="p-3 rounded-2xl bg-[#0d1320] border border-[#1d273a] flex gap-3 items-center"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                    <Image
                      src={
                        item.image ||
                        'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={item.name}
                      fill
                      sizes="64px"
                      unoptimized={
                        item.image?.includes('localhost') || item.image?.includes('127.0.0.1')
                      }
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={handleClose}
                      className="text-xs font-bold text-white hover:text-[#ccff00] line-clamp-1 transition-colors"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-[#ccff00]">
                        #{item.partNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatLKR(item.sellingPrice, locale)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQty(item.productId, item.qty - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-white">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.productId, item.qty + 1)}
                          disabled={item.qty >= item.stockQty}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-white">
                          {formatLKR(item.sellingPrice * item.qty, locale)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Footer Summary & Checkout Trigger */}
            <div className="p-4 border-t border-[#1c2436] bg-[#05070c] space-y-3">
              {/* District Selector for Live Shipping */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#ccff00]" />
                  <span>{tProd('selectDistrict')}:</span>
                </span>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#ccff00] outline-none"
                >
                  {SEED_DELIVERY_ZONES.map((z) => (
                    <option key={z.id} value={z.district}>
                      {z.district}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-[#0b101b] border border-[#1d273a] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{tProd('subtotal')}</span>
                  <span className="font-mono text-white font-semibold">
                    {formatLKR(subtotal, locale)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Scale className="w-3 h-3 text-slate-500" />
                    <span>
                      {deliveryDetails.isStickerSpeedPost
                        ? 'SL Speed Post (< 250g)'
                        : `Courier (${totalWeightKg.toFixed(2)} kg)`}
                    </span>
                  </span>
                  <span className="font-mono text-white font-semibold">
                    {formatLKR(deliveryCost, locale)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-[#1d273a] text-sm">
                  <span className="font-bold text-white">{tProd('total')}</span>
                  <span className="font-mono font-black text-lg text-[#ccff00]">
                    {formatLKR(grandTotal, locale)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCart}
                  className="px-3 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-black font-black py-3 px-4 rounded-xl text-xs sm:text-sm shadow-lg transition-all cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4 text-black" />
                  <span>Checkout via WhatsApp</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
