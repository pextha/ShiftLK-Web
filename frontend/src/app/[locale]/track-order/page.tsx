'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { AppLocale } from '@/lib/db/schema.types';
import { formatLKR } from '@/lib/utils/currency';
import { validateSriLankanPhone } from '@/lib/utils/phone-validator';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Phone,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  Hash,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';

interface TrackedOrder {
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  district: string;
  deliveryCost: number;
  subtotal: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  courierTrackingNo?: string | null;
  customerLanguage?: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: Array<{
    productId: string;
    qty: number;
    unitPrice: number;
    productName: string;
    partNumber?: string;
    slug?: string;
  }>;
}

const ORDER_STEPS = [
  { key: 'PENDING', icon: Clock },
  { key: 'CONFIRMED', icon: Package },
  { key: 'SHIPPED', icon: Truck },
  { key: 'DELIVERED', icon: CheckCircle2 },
] as const;

function TrackOrderContent() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('trackOrder');
  const tProd = useTranslations('product');
  const searchParams = useSearchParams();

  const initialCode = searchParams.get('code') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [orderCode, setOrderCode] = useState(initialCode);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const performLookup = async (codeToLookup: string, phoneToLookup: string) => {
    setError(null);

    const trimmedCode = codeToLookup.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Please enter your Order ID (e.g. SLK-000101)');
      return;
    }

    const phoneRes = validateSriLankanPhone(phoneToLookup);
    if (!phoneRes.isValid) {
      setError(phoneRes.error || 'Please enter a valid Sri Lankan mobile number (e.g. 077 087 1018)');
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.getOrderStatus(trimmedCode, phoneRes.cleanNumber);
      setOrder(data as TrackedOrder);
    } catch (err: unknown) {
      setOrder(null);
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Unable to locate order. Please verify your Order ID and phone number.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode && initialPhone) {
      performLookup(initialCode, initialPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, initialPhone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(orderCode, phone);
  };

  const handleCopyTracking = (trackingNo: string) => {
    navigator.clipboard.writeText(trackingNo);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const getCurrentStepIndex = (status: TrackedOrder['status']) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'SHIPPED':
        return 2;
      case 'DELIVERED':
        return 3;
      default:
        return -1;
    }
  };

  const currentStepIndex = order ? getCurrentStepIndex(order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      {/* Page Hero */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
          <Truck className="w-3.5 h-3.5" />
          <span>{t('badge')}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          {t('title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          {t('subtitle')}
        </p>
      </div>

      {/* Search Card */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#ccff00]" />
              <span>{t('orderCodeLabel')} *</span>
            </label>
            <input
              type="text"
              required
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
              placeholder={t('orderCodePlaceholder')}
              className="w-full bg-[#06080d] border border-[#212c42] focus:border-[#ccff00] rounded-2xl px-4 py-3 text-sm font-mono font-bold text-white placeholder-slate-500 outline-none transition-all uppercase"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#ccff00]" />
              <span>{t('phoneLabel')} *</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
              className="w-full bg-[#06080d] border border-[#212c42] focus:border-[#ccff00] rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#ccff00]/15 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span className="sm:hidden lg:inline">Track</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Order Status Result */}
      {order && (
        <div className="space-y-6 animate-in fade-in">
          {/* Status Timeline Card */}
          <div className="bg-[#0b101b] border border-[#1e293b] rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1e293b]">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl font-black text-[#ccff00]">
                    {order.orderCode}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      order.status === 'DELIVERED'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : order.status === 'SHIPPED'
                        ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                        : order.status === 'CONFIRMED'
                        ? 'bg-[#ccff00]/15 text-[#ccff00] border-[#ccff00]/30'
                        : order.status === 'CANCELLED'
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {t('placedOn')}:{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-LK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 block">{tProd('total')}</span>
                <span className="text-xl font-black text-white font-mono">
                  {formatLKR(order.total, locale)}
                </span>
              </div>
            </div>

            {/* Cancelled State vs 4-Step Progression */}
            {order.status === 'CANCELLED' ? (
              <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-300">{t('cancelledTitle')}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {t('cancelledDesc')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {ORDER_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  const stepTitle =
                    step.key === 'PENDING'
                      ? t('stepPending')
                      : step.key === 'CONFIRMED'
                      ? t('stepConfirmed')
                      : step.key === 'SHIPPED'
                      ? t('stepShipped')
                      : t('stepDelivered');

                  const stepDesc =
                    step.key === 'PENDING'
                      ? t('stepPendingDesc')
                      : step.key === 'CONFIRMED'
                      ? t('stepConfirmedDesc')
                      : step.key === 'SHIPPED'
                      ? t('stepShippedDesc')
                      : t('stepDeliveredDesc');

                  return (
                    <div
                      key={step.key}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-[#ccff00]/10 border-[#ccff00] shadow-lg shadow-[#ccff00]/10'
                          : isCompleted
                          ? 'bg-emerald-950/25 border-emerald-500/40'
                          : 'bg-[#06080d] border-[#1c2436] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                            isCurrent
                              ? 'bg-[#ccff00] text-black border-[#ccff00]'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          0{index + 1}
                        </span>
                      </div>
                      <h4
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-[#ccff00]'
                            : isCompleted
                            ? 'text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {stepTitle}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {stepDesc}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Courier Waybill / Tracking Number Box */}
            <div className="p-4 rounded-2xl bg-[#06080d] border border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {t('courierTrackingTitle')}
                  </span>
                  {order.courierTrackingNo ? (
                    <span className="font-mono text-sm font-black text-[#ccff00]">
                      {order.courierTrackingNo}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">{t('courierPending')}</span>
                  )}
                </div>
              </div>

              {order.courierTrackingNo && (
                <button
                  type="button"
                  onClick={() => handleCopyTracking(order.courierTrackingNo!)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors self-start sm:self-auto cursor-pointer"
                >
                  {copiedTracking ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Waybill</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Two Column Details: Ordered Parts & Customer Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ordered Items */}
            <div className="lg:col-span-2 bg-[#0b101b] border border-[#1e293b] rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-[#ccff00]" />
                <span>{t('orderedItems')}</span>
              </h3>

              <div className="divide-y divide-[#1e293b]">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      {item.slug ? (
                        <Link
                          href={`/products/${item.slug}`}
                          className="text-sm font-bold text-white hover:text-[#ccff00] transition-colors flex items-center gap-1.5 truncate"
                        >
                          <span className="truncate">{item.productName}</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        </Link>
                      ) : (
                        <p className="text-sm font-bold text-white truncate">{item.productName}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {item.partNumber && (
                          <span className="font-mono text-[11px] text-[#ccff00] bg-[#06080d] px-2 py-0.5 rounded border border-[#1e293b]">
                            #{item.partNumber}
                          </span>
                        )}
                        <span>
                          {formatLKR(item.unitPrice, locale)} × {item.qty}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono font-bold text-sm text-white">
                      {formatLKR(item.unitPrice * item.qty, locale)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#1e293b] space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{tProd('subtotal')}</span>
                  <span className="font-mono text-slate-200">{formatLKR(order.subtotal, locale)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>
                    {tProd('deliveryCost')} ({order.district})
                  </span>
                  <span className="font-mono text-slate-200">
                    {formatLKR(order.deliveryCost, locale)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-[#1e293b]">
                  <span>{tProd('total')}</span>
                  <span className="font-mono text-[#ccff00] text-base">
                    {formatLKR(order.total, locale)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery & Support Sidebar */}
            <div className="space-y-6">
              <div className="bg-[#0b101b] border border-[#1e293b] rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#ccff00]" />
                  <span>{t('orderDetails')}</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">{t('customer')}</span>
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {order.customerName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">{t('district')}</span>
                    <span className="font-semibold text-[#ccff00]">{order.district}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">{t('address')}</span>
                    <span className="text-slate-200 leading-relaxed block">{order.address}</span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Order Help */}
              <div className="bg-[#0b101b] border border-[#1e293b] rounded-3xl p-6 space-y-3">
                <h4 className="text-xs font-bold text-white">{t('needHelpTitle')}</h4>
                <a
                  href={`https://wa.me/94770871018?text=${encodeURIComponent(
                    `Hello ShiftLK Spares, I am checking the status of my order ${order.orderCode} (${order.customerName}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-black font-black text-xs py-3 px-4 rounded-2xl transition-all shadow-lg"
                >
                  <WhatsAppIcon className="w-4 h-4 text-black" />
                  <span>{t('needHelpBtn')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">
          Loading Order Tracker...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
