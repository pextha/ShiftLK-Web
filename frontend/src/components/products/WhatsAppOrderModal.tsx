'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AppLocale, DeliveryZone, LocalizedProduct } from '@/lib/db/schema.types';
import { formatLKR } from '@/lib/utils/currency';
import { validateSriLankanPhone } from '@/lib/utils/phone-validator';
import { getDeliveryFeeDetails } from '@/services/deliveryService';
import { resolveProductImageUrl } from '@/lib/utils/image';
import {
  X,
  Truck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  PackageSearch,
  Clock,
  Landmark,
  Copy,
  Check,
  Upload,
  Camera,
  FileText,
  PlusCircle,
  Info,
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
  onStockReserved?: (remainingStock: number) => void;
  onStockReleased?: (restoredQty: number, currentStock?: number) => void;
  onOrderCompleted?: () => void;
}

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '');

const BANK_DETAILS = {
  bankName: 'BOC (Bank of Ceylon)',
  accountNumber: '89771480',
  accountName: 'K P T Premawansha',
  branch: 'Kesbawa',
};

export default function WhatsAppOrderModal({
  product,
  quantity,
  selectedDistrict,
  deliveryZones,
  isOpen,
  onClose,
  onDistrictChange,
  onStockReserved,
  onStockReleased,
  onOrderCompleted,
}: WhatsAppOrderModalProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const t = useTranslations('orderModal');
  const tNav = useTranslations('nav');

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState(selectedDistrict || 'Colombo');
  const [notes, setNotes] = useState('');

  // Stock Reservation & 10-Minute Countdown State
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [isReserving, setIsReserving] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [extendedCount, setExtendedCount] = useState(0);
  const [showExtendPopup, setShowExtendPopup] = useState(false);
  const [extendPopupDismissed, setExtendPopupDismissed] = useState(false);

  // Bank Slip / PDF Upload & Camera Capture State
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string>('');
  const [uploadedSlipName, setUploadedSlipName] = useState<string>('');
  const [uploadedSlipMime, setUploadedSlipMime] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Status & Validation State
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [secondaryPhoneError, setSecondaryPhoneError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{
    orderCode: string;
    whatsAppUrl?: string;
  } | null>(null);

  const reservationIdRef = useRef<string | null>(null);
  const orderCompletedRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    reservationIdRef.current = reservationId;
  }, [reservationId]);

  useEffect(() => {
    if (selectedDistrict) {
      setDistrict(selectedDistrict);
    }
  }, [selectedDistrict]);

  // Release temporary stock reservation on cancel or expiry
  const releaseActiveReservation = useCallback(
    async (resIdToRelease?: string | null) => {
      const targetId = resIdToRelease ?? reservationIdRef.current;
      if (!targetId || orderCompletedRef.current) return;

      reservationIdRef.current = null;
      setReservationId(null);

      try {
        const res = await fetch(`${API_BASE}/orders/reservations/${encodeURIComponent(targetId)}`, {
          method: 'DELETE',
        });
        const json = await res.json().catch(() => null);
        const currentStock = json?.data?.currentStock;
        if (onStockReleased) {
          onStockReleased(quantity, currentStock);
        }
      } catch {
        if (onStockReleased) {
          onStockReleased(quantity);
        }
      }
    },
    [onStockReleased, quantity]
  );

  // Create 10-minute stock reservation when the modal opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    orderCompletedRef.current = false;
    setSuccessOrder(null);
    setGeneralError(null);
    setShowExtendPopup(false);
    setExtendPopupDismissed(false);
    setExtendedCount(0);

    async function reserveStockNow() {
      setIsReserving(true);
      try {
        const res = await fetch(`${API_BASE}/orders/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            qty: quantity,
          }),
        });
        const json = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok) {
          const msg = json?.error?.message || 'Unable to reserve stock for this item.';
          setGeneralError(msg);
          return;
        }

        const data = json?.data || json;
        setReservationId(data.reservationId);
        reservationIdRef.current = data.reservationId;

        const targetExpiry = new Date(data.expiresAt).getTime();
        setExpiresAtMs(targetExpiry);
        setSecondsLeft(Math.max(1, Math.floor((targetExpiry - Date.now()) / 1000)));

        if (onStockReserved && typeof data.remainingStock === 'number') {
          onStockReserved(data.remainingStock);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Stock reservation error:', err);
        }
      } finally {
        if (!cancelled) {
          setIsReserving(false);
        }
      }
    }

    reserveStockNow();

    return () => {
      cancelled = true;
    };
  }, [isOpen, product.id, quantity]);

  // Live 1-second Countdown Timer + 60s Extension Popup + 00:00 Auto-Release & Refresh
  useEffect(() => {
    if (!isOpen || !expiresAtMs || successOrder) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setSecondsLeft(remaining);

      // Show "+5 Minutes" extension popup when <= 60 seconds left
      if (remaining > 0 && remaining <= 60 && !extendPopupDismissed && extendedCount < 3) {
        setShowExtendPopup(true);
      }

      // If countdown hits 00:00, release stock, close form, and refresh page
      if (remaining <= 0) {
        clearInterval(interval);
        const expiredId = reservationIdRef.current;
        releaseActiveReservation(expiredId).finally(() => {
          onClose();
          router.refresh();
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isOpen,
    expiresAtMs,
    successOrder,
    extendPopupDismissed,
    extendedCount,
    releaseActiveReservation,
    onClose,
    router,
  ]);

  // Stop live camera stream if open
  const stopCameraStream = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, stopCameraStream]);

  if (!isOpen) return null;

  // Extend reservation by +5 minutes
  const handleExtendReservation = async () => {
    if (!reservationId || isExtending) return;
    setIsExtending(true);
    setGeneralError(null);

    try {
      const res = await fetch(
        `${API_BASE}/orders/reservations/${encodeURIComponent(reservationId)}/extend`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Could not extend reservation timer');
      }

      const data = json?.data || json;
      const newExpiry = new Date(data.expiresAt).getTime();
      setExpiresAtMs(newExpiry);
      setSecondsLeft(Math.max(1, Math.floor((newExpiry - Date.now()) / 1000)));
      setExtendedCount(data.extendedCount ?? extendedCount + 1);
      setShowExtendPopup(false);
      setExtendPopupDismissed(false);
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to extend time');
    } finally {
      setIsExtending(false);
    }
  };

  // Close modal handler (releases reservation if order wasn't completed)
  const handleModalClose = async () => {
    stopCameraStream();
    if (!orderCompletedRef.current && reservationIdRef.current) {
      await releaseActiveReservation(reservationIdRef.current);
    }
    onClose();
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Selected Zone & Costs
  const currentZone =
    deliveryZones.find((z) => z.district.toLowerCase() === district.toLowerCase()) ||
    deliveryZones[0];

  const unitWeightKg = Number(product.weight_kg || 1);
  const totalWeightKg = Number((unitWeightKg * quantity).toFixed(3));

  const deliveryDetails = getDeliveryFeeDetails(
    currentZone,
    totalWeightKg,
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
      setPhone(res.formattedLocal);
    }
  };

  const handleSecondaryPhoneBlur = () => {
    if (!secondaryPhone.trim()) {
      setSecondaryPhoneError(null);
      return;
    }
    const res = validateSriLankanPhone(secondaryPhone);
    if (!res.isValid) {
      setSecondaryPhoneError(res.error || t('phoneError'));
    } else {
      setSecondaryPhoneError(null);
      setSecondaryPhone(res.formattedLocal);
    }
  };

  // Compress high-resolution mobile camera images on HTML5 canvas if > 1.5MB or > 2000px
  const compressImageIfNeeded = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;
    // Only compress if larger than 1.5MB or from camera capture
    if (file.size <= 1.5 * 1024 * 1024 && !file.name.startsWith('camera-slip')) {
      return file;
    }

    return new Promise((resolve) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIM = 1920;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '') + '.jpg',
              { type: 'image/jpeg' }
            );
            resolve(compressedFile);
          },
          'image/jpeg',
          0.86
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      img.src = objectUrl;
    });
  };

  // Core uploader for File / Camera Blob
  const uploadReceiptFile = async (rawFile: File) => {
    setGeneralError(null);

    const file = await compressImageIfNeeded(rawFile);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setGeneralError(t('invalidSlipTypeError'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setGeneralError(t('slipFileSizeError'));
      return;
    }

    setIsUploadingSlip(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/orders/upload-slip`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Failed to upload payment slip');
      }

      const uploaded = json?.data || json;
      setPaymentSlipUrl(uploaded.url);
      setUploadedSlipName(uploaded.originalName || file.name);
      setUploadedSlipMime(uploaded.mimeType || file.type);
    } catch (err: unknown) {
      setGeneralError(
        err instanceof Error ? err.message : 'Unable to upload bank slip. Please try again.'
      );
    } finally {
      setIsUploadingSlip(false);
    }
  };

  // Upload Bank Slip Image or PDF from file input / native phone camera input
  const handleSlipFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadReceiptFile(file);
    e.target.value = '';
  };

  // Open camera: on mobile or desktop with WebRTC camera access, opens live viewfinder; falls back to native phone camera input
  const handleStartCameraCapture = async () => {
    setGeneralError(null);

    // Check if WebRTC getUserMedia is supported
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        cameraStreamRef.current = stream;
        setIsCameraOpen(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 50);
        return;
      } catch {
        // Fallback to native mobile camera file input (`capture="environment"`)
        cameraInputRef.current?.click();
        return;
      }
    }

    cameraInputRef.current?.click();
  };

  // Snap photo from live camera video stream
  const handleSnapCameraPhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    stopCameraStream();

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], `camera-slip-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        await uploadReceiptFile(capturedFile);
      },
      'image/jpeg',
      0.88
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

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

    let cleanSecondaryPhone: string | undefined = undefined;
    if (secondaryPhone.trim()) {
      const secRes = validateSriLankanPhone(secondaryPhone.trim());
      if (!secRes.isValid) {
        setSecondaryPhoneError(secRes.error || t('phoneError'));
        return;
      }
      cleanSecondaryPhone = secRes.cleanNumber;
    }
    setSecondaryPhoneError(null);

    if (!address.trim()) {
      setGeneralError(t('addressRequired'));
      return;
    }

    if (!paymentSlipUrl) {
      setGeneralError(t('slipRequiredError'));
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
          secondaryPhone: cleanSecondaryPhone,
          address: address.trim(),
          district,
          notes: notes.trim(),
          locale,
          reservationId: reservationId || undefined,
          paymentSlipUrl,
          transferRemark: customerName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit order');
      }

      // Mark order completed so reservation isn't released when modal closes
      orderCompletedRef.current = true;
      reservationIdRef.current = null;
      setReservationId(null);

      setSuccessOrder({
        orderCode: data.orderCode,
        whatsAppUrl: data.whatsAppUrl,
      });

      if (onOrderCompleted) {
        onOrderCompleted();
      }
    } catch (err: unknown) {
      console.error('Order creation error:', err);
      const message =
        err instanceof Error ? err.message : 'Error creating order. Please try again.';
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUrgentCountdown = secondsLeft <= 120;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[94dvh] overflow-y-auto my-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  {successOrder ? t('successTitle') : t('title')}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {t('subtitleShort')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleModalClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live 10-Minute Temporary Stock Reservation Countdown Bar */}
          {!successOrder && (
            <div
              className={`px-4 sm:px-6 py-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
                isUrgentCountdown
                  ? 'bg-red-950/90 border-red-800/80 text-red-200'
                  : 'bg-[#0b1320] border-slate-800/90 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock
                  className={`w-4 h-4 shrink-0 ${
                    isUrgentCountdown ? 'text-red-400 animate-pulse' : 'text-[#ccff00]'
                  }`}
                />
                <span>
                  {isReserving
                    ? t('reservingStock')
                    : t('stockReservedLabel', { qty: quantity })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border ${
                    isUrgentCountdown
                      ? 'bg-red-900/80 border-red-500 text-white'
                      : 'bg-slate-950 border-[#ccff00]/40 text-[#ccff00]'
                  }`}
                >
                  {formatCountdown(secondsLeft)}
                </span>

                {reservationId && extendedCount < 3 && secondsLeft <= 300 && (
                  <button
                    type="button"
                    onClick={handleExtendReservation}
                    disabled={isExtending}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ccff00] hover:bg-[#d8ff33] text-black font-black text-[11px] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>{isExtending ? '...' : t('extend5MinShort')}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* +5 Minute Extension Popup Overlay when time <= 60s */}
        {showExtendPopup && !successOrder && (
          <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-2xl bg-amber-950/95 border-2 border-amber-500/80 shadow-xl space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-black text-white">
                  {t('extendPopupTitle')}
                </h4>
                <p className="text-xs text-amber-200 leading-relaxed">
                  {t('extendPopupDesc', { time: formatCountdown(secondsLeft) })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleExtendReservation}
                disabled={isExtending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#ccff00] hover:bg-[#d8ff33] text-black font-black py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {isExtending ? '...' : t('extendPopupConfirmBtn')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExtendPopup(false);
                  setExtendPopupDismissed(true);
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {t('extendPopupDismissBtn')}
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6">
          {successOrder ? (
            /* Website Order Confirmation & Receipt View */
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/40">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-xl font-black text-white mb-1">
                  {t('orderConfirmedHeading')}
                </h4>
                <div className="inline-block bg-slate-950 border border-[#ccff00]/40 px-4 py-1.5 rounded-xl font-mono text-base font-black text-[#ccff00] mb-2 shadow-sm">
                  {successOrder.orderCode}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  {t('successDescDirect')}
                </p>
              </div>

              <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('orderCodeLabel')}</span>
                  <span className="font-mono font-bold text-[#ccff00]">
                    {successOrder.orderCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('itemLabel')}</span>
                  <span className="font-semibold text-white truncate max-w-[230px]">
                    {product.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('qtyLabel')}</span>
                  <span className="font-semibold text-white">{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('transferRemarkLabel')}</span>
                  <span className="font-bold text-emerald-400">{customerName}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-800">
                  <span className="text-slate-300 font-bold">{t('totalPaidLabel')}</span>
                  <span className="font-black text-[#ccff00] text-sm">
                    {formatLKR(total, locale)}
                  </span>
                </div>
              </div>

              <div className="w-full pt-2 flex flex-col gap-2.5">
                <Link
                  href={`/track-order?code=${encodeURIComponent(successOrder.orderCode)}&phone=${encodeURIComponent(phone)}`}
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 bg-[#ccff00] hover:bg-[#d8ff33] text-black font-black py-3.5 px-6 rounded-2xl transition-all text-sm shadow-lg"
                >
                  <PackageSearch className="w-4 h-4" />
                  <span>{tNav('trackOrder')} ({successOrder.orderCode})</span>
                </Link>

                {successOrder.whatsAppUrl && (
                  <a
                    href={successOrder.whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-2xl transition-all text-xs"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
                    <span>{t('sendWhatsAppCopyOptional')}</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t('closeWindowBtn')}
                </button>
              </div>
            </div>
          ) : (
            /* Direct Buy & Bank Slip Upload Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {generalError && (
                <div className="p-3.5 rounded-xl bg-red-950/90 border border-red-700 text-red-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* 1. Order Total Breakdown Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-white line-clamp-1">{product.name}</div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>
                    {t('partLabel')}{' '}
                    <span className="font-mono text-[#ccff00] font-semibold">
                      #{product.part_number}
                    </span>{' '}
                    • {t('qty')}: {quantity}
                  </span>
                  <span className="text-slate-200 font-semibold font-mono">
                    {formatLKR(subtotal, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 border-t border-slate-800/80 pt-1.5">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#ccff00]" />
                    <span>
                      {deliveryDetails.isStickerSpeedPost
                        ? 'SL Speed Post (Stickers < 250g):'
                        : `${t('delivery')} (${district} • ${
                            totalWeightKg < 1
                              ? `${Math.round(totalWeightKg * 1000)}g`
                              : `${totalWeightKg} kg`
                          } ${t('packedLabel')}):`}
                    </span>
                  </span>
                  <span className="text-slate-300 font-semibold font-mono">
                    {formatLKR(deliveryCost, locale)}
                  </span>
                </div>
                {!deliveryDetails.isStickerSpeedPost && deliveryDetails.extraKg > 0 && (
                  <div className="text-[10.5px] text-slate-400 flex justify-between pl-5">
                    <span>
                      1kg ({formatLKR(deliveryDetails.baseFee, locale)}) + {deliveryDetails.extraKg}kg (@ Rs. {currentZone?.extra_per_kg ?? 100}/kg)
                    </span>
                    <span className="text-[#ccff00]">+{formatLKR(deliveryDetails.extraFee, locale)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-bold text-white border-t border-slate-800 pt-2">
                  <span>{t('totalToPay')}:</span>
                  <span className="text-[#ccff00] font-black text-lg font-mono">
                    {formatLKR(total, locale)}
                  </span>
                </div>
              </div>

              {/* 2. BOC Bank Account Details & Mandatory Transfer Remark Card */}
              <div className="p-4 rounded-2xl bg-[#070b14] border-2 border-[#ccff00]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-[#ccff00] uppercase tracking-wider">
                    <Landmark className="w-4 h-4" />
                    <span>{t('bankTransferTitle')}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#ccff00]/15 text-[#ccff00] px-2 py-0.5 rounded-md border border-[#ccff00]/30">
                    BOC
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-950/90 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">
                      {t('bankAndBranchLabel')}
                    </span>
                    <span className="font-bold text-white">
                      {BANK_DETAILS.bankName} — {BANK_DETAILS.branch}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">
                      {t('accountNameLabel')}
                    </span>
                    <span className="font-bold text-white">{BANK_DETAILS.accountName}</span>
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">
                        {t('accountNumberLabel')}
                      </span>
                      <span className="font-mono font-black text-base text-[#ccff00] tracking-wider">
                        {BANK_DETAILS.accountNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(BANK_DETAILS.accountNumber, 'acc')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      {copiedField === 'acc' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">{t('copiedLabel')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#ccff00]" />
                          <span>{t('copyAccountBtn')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Mandatory Remark = Customer Name Instruction */}
                <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs space-y-1">
                  <div className="font-black text-amber-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{t('remarkRuleTitle')}</span>
                  </div>
                  <p className="text-[11.5px] text-amber-100/90 leading-relaxed">
                    {t('remarkRuleDesc', {
                      name: customerName.trim()
                        ? `"${customerName.trim()}"`
                        : t('yourFullNamePlaceholder'),
                    })}
                  </p>
                </div>
              </div>

              {/* 3. Customer Details Fields */}
              <div className="space-y-3.5">
                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t('fullNameWithRemarkHint')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t('fullNamePlaceholder')}
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>

                {/* Two Telephone Numbers (Primary + Secondary) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Phone Number 1 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {t('phone1Label')} *
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
                      placeholder="077 123 4567"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-all outline-none ${
                        phoneError
                          ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20'
                          : 'border-slate-700/80 focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/40'
                      }`}
                    />
                    {phoneError && <p className="text-[11px] text-red-400 mt-1">{phoneError}</p>}
                  </div>

                  {/* Phone Number 2 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {t('phone2Label')}
                    </label>
                    <input
                      type="tel"
                      value={secondaryPhone}
                      onChange={(e) => {
                        setSecondaryPhone(e.target.value);
                        if (secondaryPhoneError) setSecondaryPhoneError(null);
                      }}
                      onBlur={handleSecondaryPhoneBlur}
                      placeholder={t('phone2Placeholder')}
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-all outline-none ${
                        secondaryPhoneError
                          ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20'
                          : 'border-slate-700/80 focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/40'
                      }`}
                    />
                    {secondaryPhoneError && (
                      <p className="text-[11px] text-red-400 mt-1">{secondaryPhoneError}</p>
                    )}
                  </div>
                </div>
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
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-[#ccff00] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none cursor-pointer"
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
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/40 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 resize-none transition-all outline-none"
                />
              </div>

              {/* 4. Bank Slip / PDF Upload & Camera Capture Dropzone */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black text-white">
                  {t('uploadSlipLabel')} *
                </label>

                {/* File / Gallery / PDF Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleSlipFileChange}
                  className="hidden"
                />

                {/* Native Mobile Camera Capture Input (Rear Camera) */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleSlipFileChange}
                  className="hidden"
                />

                {isCameraOpen ? (
                  /* Live In-App Camera Viewfinder */
                  <div className="rounded-2xl bg-slate-950 border-2 border-[#ccff00] p-3 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#ccff00] flex items-center gap-1.5">
                        <Camera className="w-4 h-4" />
                        <span>{t('cameraModalTitle')}</span>
                      </span>
                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="p-1 text-slate-400 hover:text-white rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-slate-800">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSnapCameraPhoto}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-[#ccff00] hover:bg-[#d8ff33] text-black font-black py-3 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-lg"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{t('takePhotoBtn')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          stopCameraStream();
                          cameraInputRef.current?.click();
                        }}
                        className="px-3 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                      >
                        {t('useNativeCameraBtn')}
                      </button>
                    </div>
                  </div>
                ) : !paymentSlipUrl ? (
                  <div className="border-2 border-dashed border-slate-700 hover:border-[#ccff00]/70 bg-slate-950/70 rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all">
                    {isUploadingSlip ? (
                      <div className="py-4 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-7 h-7 text-[#ccff00] animate-spin" />
                        <span className="text-xs font-bold text-slate-200">
                          {t('uploadingSlip')}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="text-center space-y-1">
                          <p className="text-xs font-bold text-white">
                            {t('uploadSlipClickTitle')}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {t('uploadSlipSubHint')}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Option 1: Upload File / Gallery / PDF */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#ccff00] text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            <Upload className="w-4 h-4 text-[#ccff00] shrink-0" />
                            <span>{t('uploadFromGalleryBtn')}</span>
                          </button>

                          {/* Option 2: Capture from Camera (Mobile-friendly) */}
                          <button
                            type="button"
                            onClick={handleStartCameraCapture}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ccff00]/15 hover:bg-[#ccff00] text-[#ccff00] hover:text-black border border-[#ccff00]/40 text-xs font-black transition-all cursor-pointer"
                          >
                            <Camera className="w-4 h-4 shrink-0" />
                            <span>{t('captureFromCameraBtn')}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {uploadedSlipMime === 'application/pdf' ||
                      paymentSlipUrl.toLowerCase().endsWith('.pdf') ? (
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-300 shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                      ) : (
                        <img
                          src={resolveProductImageUrl(paymentSlipUrl)}
                          alt="Uploaded Bank Slip"
                          className="w-12 h-12 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{t('slipUploadedTitle')}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 truncate">{uploadedSlipName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleStartCameraCapture}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-[#ccff00] cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{t('retakePhotoBtn')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-200 cursor-pointer"
                      >
                        {t('changeFileBtn')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Strict Anti-Fraud / Edited Slip & PDF Warning Banner */}
              <div className="p-3.5 rounded-2xl bg-red-950/80 border-2 border-red-600/70 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black text-red-300 uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{t('antiFraudTitle')}</span>
                </div>
                <p className="text-[11.5px] text-red-100 leading-relaxed">
                  {t('antiFraudDesc')}
                </p>
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
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-[#ccff00] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* Submit Direct Order Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingSlip || !paymentSlipUrl}
                  className="w-full flex items-center justify-center gap-2 bg-[#ccff00] hover:bg-[#d8ff33] text-black font-black py-4 px-6 rounded-2xl shadow-xl shadow-[#ccff00]/20 transition-all text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-black" />
                      <span>{t('processing')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-black" />
                      <span>
                        {t('submitDirectOrderBtn', { total: formatLKR(total, locale) })}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
