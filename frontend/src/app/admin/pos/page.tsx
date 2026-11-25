'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Copy,
  Check,
  MessageCircle,
  CheckCircle2,
  ShoppingBag,
  User,
  Phone,
  Banknote,
  Landmark,
  CreditCard,
  FileText,
  RefreshCw,
  Package,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatLKR, formatDateTime, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/common/Toast';

interface BillLineItem {
  productId: string;
  partNumber: string;
  name: string;
  brand: string;
  maxStock: number;
  qty: number;
  unitPrice: number;
}

interface GeneratedBillData {
  id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  secondaryPhone?: string | null;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD_QR';
  rawSubtotal: number;
  discountAmount: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  items: Array<{
    productId: string;
    productName: string;
    partNumber: string;
    brandName: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export default function InShopPosPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  // Product Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Current Bill State
  const [billItems, setBillItems] = useState<BillLineItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD_QR'>('CASH');
  const [discountInput, setDiscountInput] = useState('0');
  const [notes, setNotes] = useState('');

  // Completed Bill Receipt State
  const [generatedBill, setGeneratedBill] = useState<GeneratedBillData | null>(null);
  const [whatsappTargetPhone, setWhatsappTargetPhone] = useState('');
  const [copiedBill, setCopiedBill] = useState(false);

  // Fetch Products for POS search
  const { data: productsRes, isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-pos-products', searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('limit', '60');
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      return apiClient<any>(`/api/v1/admin/products?${params.toString()}`);
    },
  });

  const products: any[] = useMemo(() => {
    if (Array.isArray(productsRes)) return productsRes;
    if (Array.isArray(productsRes?.data)) return productsRes.data;
    if (Array.isArray(productsRes?.items)) return productsRes.items;
    return [];
  }, [productsRes]);

  // Add Product to Bill
  const handleAddProductToBill = (prod: any) => {
    const stock = Number(prod.stockQty ?? prod.stock_qty ?? 0);
    if (stock <= 0) {
      toastError('This item is currently out of stock');
      return;
    }

    const enName =
      prod.translations?.find((t: any) => t.language === 'en')?.name ||
      prod.name ||
      prod.slug;
    const brandName = prod.brand?.name || prod.brand || '';
    const price = Number(prod.sellingPrice ?? prod.selling_price ?? 0);

    setBillItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === prod.id);
      if (existingIdx > -1) {
        const existing = prev[existingIdx];
        if (existing.qty >= stock) {
          toastError(`Maximum available stock (${stock}) reached for ${enName}`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = { ...existing, qty: existing.qty + 1 };
        return updated;
      }
      return [
        ...prev,
        {
          productId: prod.id,
          partNumber: prod.partNumber || prod.part_number || '',
          name: enName,
          brand: brandName,
          maxStock: stock,
          qty: 1,
          unitPrice: price,
        },
      ];
    });
  };

  const handleUpdateQty = (productId: string, nextQty: number) => {
    setBillItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const clamped = Math.max(1, Math.min(item.maxStock, nextQty));
        return { ...item, qty: clamped };
      })
    );
  };

  const handleUpdateUnitPrice = (productId: string, nextPrice: number) => {
    setBillItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, unitPrice: Math.max(0, nextPrice) }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setBillItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Totals
  const rawSubtotal = billItems.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);
  const discountAmount = Math.min(rawSubtotal, Math.max(0, Number(discountInput) || 0));
  const grandTotal = Math.max(0, rawSubtotal - discountAmount);

  // Create POS Sale Mutation
  const createPosOrderMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient<GeneratedBillData>('/api/v1/admin/orders/pos', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (resData: any) => {
      const bill: GeneratedBillData = resData?.data || resData;
      setGeneratedBill(bill);
      setWhatsappTargetPhone(
        bill.phone && bill.phone !== 'In-Shop Walk-In' ? bill.phone : phone
      );
      queryClient.invalidateQueries({ queryKey: ['admin-pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stock-overview'] });
      success(`Sale ${bill.orderCode} recorded & stock updated!`);
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to record in-shop sale');
    },
  });

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (billItems.length === 0) {
      toastError('Please add at least one spare part to the bill');
      return;
    }

    createPosOrderMutation.mutate({
      customerName: customerName.trim() || 'Walk-In Customer',
      phone: phone.trim() || undefined,
      secondaryPhone: secondaryPhone.trim() || undefined,
      paymentMethod,
      discountAmount,
      notes: notes.trim() || undefined,
      items: billItems.map((i) => ({
        productId: i.productId,
        qty: i.qty,
        customUnitPrice: i.unitPrice,
      })),
    });
  };

  const handleStartNewSale = () => {
    setGeneratedBill(null);
    setBillItems([]);
    setCustomerName('');
    setPhone('');
    setSecondaryPhone('');
    setDiscountInput('0');
    setNotes('');
    setPaymentMethod('CASH');
    setCopiedBill(false);
  };

  // Format clean text receipt for Copy & WhatsApp
  const buildBillText = (bill: GeneratedBillData) => {
    const paymentLabel =
      bill.paymentMethod === 'CASH'
        ? 'Cash'
        : bill.paymentMethod === 'BANK_TRANSFER'
        ? 'Bank Transfer'
        : 'Card / QR';

    const lines = [
      '🧾 *SHIFTLK SPARES — OFFICIAL RECEIPT*',
      '📍 53/1, Palagama Road, Undurugoda, Polgasowita',
      '📞 Hotline / WhatsApp: 077 087 1018',
      '----------------------------------------',
      `*Bill No:* ${bill.orderCode}`,
      `*Date:* ${formatDateTime(bill.createdAt)}`,
      `*Customer:* ${bill.customerName}`,
      ...(bill.phone && bill.phone !== 'In-Shop Walk-In' ? [`*Phone:* ${bill.phone}`] : []),
      ...(bill.secondaryPhone ? [`*Alt Phone:* ${bill.secondaryPhone}`] : []),
      `*Payment:* ${paymentLabel} (Paid)`,
      '----------------------------------------',
      '*PURCHASED ITEMS:*',
      ...bill.items.map(
        (item, idx) =>
          `${idx + 1}. *${item.productName}* (#${item.partNumber})\n   ${item.qty} × ${formatLKR(
            item.unitPrice
          )} = *${formatLKR(item.lineTotal)}*`
      ),
      '----------------------------------------',
      ...(bill.discountAmount > 0
        ? [
            `Subtotal: ${formatLKR(bill.rawSubtotal)}`,
            `Discount: -${formatLKR(bill.discountAmount)}`,
          ]
        : []),
      `💳 *TOTAL PAID: ${formatLKR(bill.total)}*`,
      ...(bill.notes ? [`📝 *Note:* ${bill.notes}`] : []),
      '----------------------------------------',
      'Thank you for purchasing from *ShiftLK Spares*! 🏍️⚡',
    ];

    return lines.join('\n');
  };

  const handleCopyBillText = () => {
    if (!generatedBill) return;
    const text = buildBillText(generatedBill);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBill(true);
      success('Bill copied to clipboard!');
      setTimeout(() => setCopiedBill(false), 2500);
    }
  };

  const handleSendViaWhatsApp = () => {
    if (!generatedBill) return;
    const text = buildBillText(generatedBill);
    const rawTarget = whatsappTargetPhone.trim();

    let cleanPhone = rawTarget.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '94' + cleanPhone.slice(1);
    if (cleanPhone.length === 9 && !cleanPhone.startsWith('94')) {
      cleanPhone = '94' + cleanPhone;
    }

    const waUrl =
      cleanPhone.length >= 11
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Top Page Header (Hidden when printing receipt) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Store className="w-7 h-7 text-brand-neon" />
            In-Shop POS & Walk-In Billing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Record walk-in customer purchases at the Polgasowita shop, deduct inventory automatically, and print, copy, or WhatsApp the receipt bill.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {generatedBill && (
            <Button
              size="sm"
              onClick={handleStartNewSale}
              className="gap-1.5 font-bold bg-brand-neon text-black hover:bg-brand-neon/90"
            >
              <Plus className="w-4 h-4" />
              New Walk-In Sale
            </Button>
          )}
          <Link href="/admin/orders">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ShoppingBag className="w-3.5 h-3.5" />
              View All Orders
            </Button>
          </Link>
        </div>
      </div>

      {generatedBill ? (
        /* =====================================================================
           GENERATED BILL / RECEIPT VIEW (With Print, Copy & Send via WhatsApp)
           ===================================================================== */
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Action Toolbar (Hidden on Print) */}
          <Card className="print:hidden p-4 border-brand-neon/40 bg-slate-900/90 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">
                    Sale Recorded & Bill Generated ({generatedBill.orderCode})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Stock deducted & added to Daily/Monthly Sales and Profit reports.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Print Bill Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs font-bold border-slate-700 hover:border-brand-neon"
                >
                  <Printer className="w-4 h-4 text-brand-neon" />
                  Print Bill
                </Button>

                {/* 2. Copy Bill Text Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyBillText}
                  className="gap-1.5 text-xs font-bold border-slate-700 hover:border-brand-neon"
                >
                  {copiedBill ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-brand-neon" />
                      <span>Copy Bill</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 3. Send via WhatsApp Row */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={whatsappTargetPhone}
                  onChange={(e) => setWhatsappTargetPhone(e.target.value)}
                  placeholder="Customer WhatsApp Number (e.g. 077 123 4567)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white font-mono outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSendViaWhatsApp}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-black text-xs shadow-lg transition-all cursor-pointer shrink-0"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>Send Bill via WhatsApp</span>
              </button>
            </div>
          </Card>

          {/* Printable Receipt / Invoice Slip Card */}
          <Card className="p-6 sm:p-8 bg-slate-950 border-slate-800 print:bg-white print:text-black print:border-gray-300 print:shadow-none space-y-6">
            {/* Receipt Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-800 print:border-gray-300">
              <div>
                <div className="text-xl font-black tracking-tight text-white print:text-black">
                  SHIFTLK <span className="text-brand-neon print:text-black">SPARES</span>
                </div>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                  53/1, Palagama Road, Undurugoda, Polgasowita
                </p>
                <p className="text-xs text-slate-400 print:text-gray-600 font-mono">
                  Hotline / WhatsApp: 077 087 1018
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 print:text-gray-600 block">
                  Official Sales Receipt
                </span>
                <div className="font-mono text-lg font-black text-brand-neon print:text-black">
                  {generatedBill.orderCode}
                </div>
                <div className="text-xs text-slate-400 print:text-gray-600 font-mono">
                  {formatDateTime(generatedBill.createdAt)}
                </div>
              </div>
            </div>

            {/* Customer & Payment Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/70 print:bg-gray-100 p-4 rounded-2xl border border-slate-800 print:border-gray-300">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 print:text-gray-600 block">
                  Customer Details
                </span>
                <div className="font-bold text-white print:text-black text-sm">
                  {generatedBill.customerName}
                </div>
                {generatedBill.phone && generatedBill.phone !== 'In-Shop Walk-In' && (
                  <div className="font-mono text-slate-300 print:text-black">
                    Tel 1: {generatedBill.phone}
                  </div>
                )}
                {generatedBill.secondaryPhone && (
                  <div className="font-mono text-slate-300 print:text-black">
                    Tel 2: {generatedBill.secondaryPhone}
                  </div>
                )}
              </div>

              <div className="sm:text-right space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 print:text-gray-600 block">
                  Payment & Channel
                </span>
                <div className="font-bold text-emerald-400 print:text-black">
                  PAID —{' '}
                  {generatedBill.paymentMethod === 'CASH'
                    ? 'Cash Payment'
                    : generatedBill.paymentMethod === 'BANK_TRANSFER'
                    ? 'Bank Transfer'
                    : 'Card / LankaQR'}
                </div>
                <div className="text-slate-400 print:text-gray-600">
                  In-Shop Purchase (Polgasowita)
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 print:bg-gray-100 text-slate-400 print:text-black uppercase font-bold border-b border-slate-800 print:border-gray-400">
                  <tr>
                    <th className="py-2.5 px-3"># / Part Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 print:divide-gray-300">
                  {generatedBill.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white print:text-black">
                          {item.productName}
                        </div>
                        <div className="font-mono text-[11px] text-brand-neon print:text-gray-700">
                          Part #{item.partNumber} {item.brandName ? `• ${item.brandName}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-white print:text-black">
                        {item.qty}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300 print:text-black">
                        {formatLKR(item.unitPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white print:text-black">
                        {formatLKR(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Footer */}
            <div className="pt-4 border-t border-slate-800 print:border-gray-400 space-y-2 text-xs">
              {generatedBill.discountAmount > 0 && (
                <>
                  <div className="flex justify-between text-slate-400 print:text-black">
                    <span>Merchandise Subtotal</span>
                    <span className="font-mono">{formatLKR(generatedBill.rawSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-amber-400 print:text-black">
                    <span>Special Shop Discount</span>
                    <span className="font-mono">-{formatLKR(generatedBill.discountAmount)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 print:border-gray-300">
                <span className="text-sm font-black uppercase text-white print:text-black">
                  Total Paid (LKR)
                </span>
                <span className="text-2xl font-black font-mono text-brand-neon print:text-black">
                  {formatLKR(generatedBill.total)}
                </span>
              </div>

              {generatedBill.notes && (
                <div className="pt-2 text-[11px] text-slate-400 print:text-gray-700">
                  <strong>Notes:</strong> {generatedBill.notes}
                </div>
              )}
            </div>

            {/* Receipt Thank You Footer */}
            <div className="pt-4 border-t border-dashed border-slate-800 print:border-gray-400 text-center space-y-1 text-[11px] text-slate-400 print:text-gray-600">
              <p className="font-bold text-slate-200 print:text-black">
                Thank you for shopping at ShiftLK Spares!
              </p>
              <p>
                Genuine Motorbike Spares • Modifications • Body Stickers • SLS Helmets
              </p>
            </div>
          </Card>
        </div>
      ) : (
        /* =====================================================================
           IN-SHOP POS BUILDER (Left: Product Catalog Search | Right: Active Bill)
           ===================================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Product Search & Quick Add */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-4 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search part by OEM Part Number, Name, or Bike Model..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-brand-neon rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none"
                />
              </div>

              <div className="max-h-[620px] overflow-y-auto divide-y divide-slate-800/60 pr-1">
                {loadingProducts ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="py-3">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))
                ) : products.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <Package className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    No matching products found.
                  </div>
                ) : (
                  products.map((prod: any) => {
                    const stock = Number(prod.stockQty ?? prod.stock_qty ?? 0);
                    const enName =
                      prod.translations?.find((t: any) => t.language === 'en')?.name ||
                      prod.name ||
                      prod.slug;
                    const partNo = prod.partNumber || prod.part_number || '';
                    const brandName = prod.brand?.name || prod.brand || '';
                    const price = Number(prod.sellingPrice ?? prod.selling_price ?? 0);
                    const inBillItem = billItems.find((i) => i.productId === prod.id);

                    return (
                      <div
                        key={prod.id}
                        className="py-3 px-2 hover:bg-slate-900/50 rounded-xl flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-brand-neon bg-brand-neon/10 border border-brand-neon/25 px-2 py-0.5 rounded">
                              #{partNo}
                            </span>
                            {brandName && (
                              <span className="text-[11px] font-semibold text-slate-400">
                                {brandName}
                              </span>
                            )}
                            <Badge variant={stock > 0 ? 'success' : 'danger'}>
                              {stock > 0 ? `${stock} in stock` : 'Out of Stock'}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-white truncate mt-1">
                            {enName}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="font-mono text-sm font-black text-white">
                              {formatLKR(price)}
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            disabled={stock <= 0}
                            onClick={() => handleAddProductToBill(prod)}
                            className={cn(
                              'h-8 px-3 text-xs font-bold gap-1',
                              inBillItem
                                ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                                : ''
                            )}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {inBillItem ? `Added (${inBillItem.qty})` : 'Add'}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Right Column (5 cols): Active Walk-In Bill & Customer Input */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleCompleteSale}>
              <Card className="p-5 space-y-5 border-brand-neon/30">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-neon" />
                    Current Shop Bill ({billItems.length})
                  </h2>
                  {billItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBillItems([])}
                      className="text-[11px] text-rose-400 hover:underline font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Selected Bill Items */}
                {billItems.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-2xl text-xs text-slate-400 space-y-1">
                    <Store className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                    <p className="font-semibold text-slate-300">No items added to bill yet</p>
                    <p className="text-[11px] text-slate-500">
                      Click &ldquo;Add&rdquo; on any spare part from the left list.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {billItems.map((item) => (
                      <div
                        key={item.productId}
                        className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-mono text-[10px] text-brand-neon font-bold block">
                              #{item.partNumber}
                            </span>
                            <span className="font-bold text-white line-clamp-1">
                              {item.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          {/* Quantity Stepper */}
                          <div className="inline-flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.productId, item.qty - 1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-bold text-white">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.productId, item.qty + 1)}
                              disabled={item.qty >= item.maxStock}
                              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Editable Unit Price */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Rs.</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleUpdateUnitPrice(item.productId, Number(e.target.value))
                              }
                              className="w-24 px-2 py-1 bg-slate-950 border border-slate-800 focus:border-brand-neon rounded-lg text-right font-mono text-xs text-white outline-none"
                              title="Unit Price (LKR)"
                            />
                          </div>

                          {/* Line Total */}
                          <div className="font-mono font-bold text-brand-neon text-right min-w-[85px]">
                            {formatLKR(item.unitPrice * item.qty)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Walk-In Customer Details */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Walk-In Customer & Payment Details
                  </span>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Customer Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Walk-In Customer (or enter name)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-brand-neon rounded-xl text-xs text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        WhatsApp / Phone 1 (For Bill)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 077 123 4567"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-brand-neon rounded-xl text-xs text-white font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Phone 2 (Optional)
                      </label>
                      <input
                        type="tel"
                        value={secondaryPhone}
                        onChange={(e) => setSecondaryPhone(e.target.value)}
                        placeholder="e.g. 071 987 6543"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-brand-neon rounded-xl text-xs text-white font-mono outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'CASH', label: 'Cash', icon: Banknote },
                        { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Landmark },
                        { id: 'CARD_QR', label: 'Card / QR', icon: CreditCard },
                      ].map((pm) => {
                        const Icon = pm.icon;
                        const active = paymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id as any)}
                            className={cn(
                              'flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                              active
                                ? 'bg-brand-neon text-black border-brand-neon'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Discount (LKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-brand-neon rounded-xl text-xs text-white font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Bike No / Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. WP BCA-4521"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-brand-neon rounded-xl text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bill Calculation Summary */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal ({billItems.reduce((a, b) => a + b.qty, 0)} items)</span>
                    <span className="font-mono text-white font-semibold">
                      {formatLKR(rawSubtotal)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>Discount</span>
                      <span className="font-mono">-{formatLKR(discountAmount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="font-black text-white uppercase text-xs">
                      Total Payable
                    </span>
                    <span className="text-2xl font-black font-mono text-brand-neon">
                      {formatLKR(grandTotal)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={billItems.length === 0}
                  loading={createPosOrderMutation.isPending}
                  className="w-full py-3.5 text-sm font-black gap-2 shadow-xl shadow-brand-neon/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Sale & Generate Bill ({formatLKR(grandTotal)})
                </Button>
              </Card>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

