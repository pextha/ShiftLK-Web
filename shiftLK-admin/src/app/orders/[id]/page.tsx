'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Printer,
  MessageCircle,
  Truck,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  AlertTriangle,
  Send,
  FileText,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatLKR, formatDateTime, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/common/Toast';
import { useAuth } from '@/lib/auth-context';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const { isAdmin } = useAuth();

  // Status Change Dialog
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [trackingInput, setTrackingInput] = useState('');

  // Admin Notes
  const [adminNotes, setAdminNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);

  // Fetch Order
  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => apiClient<any>(`/api/v1/admin/orders/${orderId}`),
    enabled: !!orderId,
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      status,
      notes,
      trackingNumber,
    }: {
      status: string;
      notes?: string;
      trackingNumber?: string;
    }) =>
      apiClient(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes, trackingNumber }),
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stock-overview'] });
      success(`Order status updated to ${vars.status}`);
      setTargetStatus(null);
      setStatusNote('');
      setTrackingInput('');
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to update order status');
    },
  });

  // Update Notes Mutation
  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) =>
      apiClient(`/api/v1/admin/orders/${orderId}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ adminNotes: notes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      success('Admin notes saved');
      setEditingNotes(false);
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to save notes');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Package className="w-12 h-12 mx-auto text-slate-600 mb-2" />
        <p className="font-bold text-white text-lg">Order not found</p>
        <Link href="/orders">
          <Button variant="outline" size="sm" className="mt-4">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  // Clean phone for WhatsApp link
  let cleanPhone = order.phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '94' + cleanPhone.slice(1);
  if (!cleanPhone.startsWith('94') && cleanPhone.length === 9) cleanPhone = '94' + cleanPhone;

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello ${order.customerName}, this is ShiftLK Spares regarding your order #${order.orderCode}. Current status: ${order.status}.`
  )}`;

  // Gross profit calculation
  let totalCogs = 0;
  for (const item of order.items || []) {
    totalCogs += Number(item.unitCost || 0) * item.qty;
  }
  const orderProfit = Number(order.subtotal) - totalCogs;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-16">
      {/* Top Action Bar (Hidden during Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="p-2 h-9 w-9">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white font-mono tracking-tight">
                {order.orderCode}
              </h1>
              <Badge
                variant={
                  order.status === 'CONFIRMED'
                    ? 'info'
                    : order.status === 'SHIPPED'
                    ? 'neon'
                    : order.status === 'DELIVERED'
                    ? 'success'
                    : order.status === 'CANCELLED'
                    ? 'danger'
                    : 'warning'
                }
              >
                {order.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-emerald-400 border-emerald-900 hover:bg-emerald-950/40"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Customer
            </Button>
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Slip
          </Button>
        </div>
      </div>

      {/* Status Transition Control Card (Hidden during Print) */}
      <Card className="print:hidden p-5 border-brand-neon/30 bg-slate-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Order Fulfillment Stage
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              {order.status === 'PENDING' &&
                'New order received. Confirm to decrement warehouse stock and begin packing.'}
              {order.status === 'CONFIRMED' &&
                'Stock is reserved. Hand over to courier and add tracking code.'}
              {order.status === 'SHIPPED' &&
                'Package is with courier. Mark delivered once customer confirms receipt.'}
              {order.status === 'DELIVERED' && 'Order has been delivered and completed.'}
              {order.status === 'CANCELLED' && 'Order cancelled. Inventory has been restored.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {order.status === 'PENDING' && (
              <Button
                size="sm"
                onClick={() => setTargetStatus('CONFIRMED')}
                className="gap-1.5 font-bold shadow-lg shadow-brand-neon/20"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Order (-Stock)
              </Button>
            )}

            {order.status === 'CONFIRMED' && (
              <Button
                size="sm"
                onClick={() => setTargetStatus('SHIPPED')}
                className="gap-1.5 font-bold bg-brand-neon text-black hover:bg-brand-neon/90"
              >
                <Truck className="w-4 h-4" />
                Mark as Shipped
              </Button>
            )}

            {order.status === 'SHIPPED' && (
              <Button
                size="sm"
                onClick={() => setTargetStatus('DELIVERED')}
                className="gap-1.5 font-bold bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as Delivered
              </Button>
            )}

            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTargetStatus('CANCELLED')}
                className="text-xs text-rose-400 border-rose-900 hover:bg-rose-950/40"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel Order (+Stock)
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Order Content (Visible in UI and on Print Slip) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Left 2 Cols: Customer, Items, Shipping */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Delivery Card */}
          <Card className="p-6 space-y-4 print:border-none print:shadow-none print:p-0">
            <h2 className="text-base font-bold text-white flex items-center gap-2 print:text-black">
              <User className="w-4 h-4 text-brand-neon print:hidden" />
              Customer & Delivery Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 print:bg-white print:border-gray-300">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block print:text-gray-600">
                  Recipient Information
                </span>
                <p className="text-base font-bold text-white mt-1 print:text-black">
                  {order.customerName}
                </p>
                <p className="text-xs text-brand-neon font-mono font-bold mt-0.5 print:text-black">
                  {order.phone}
                </p>
                <p className="text-xs text-slate-400 mt-2 print:text-gray-600">
                  Preferred language: {order.customerLanguage?.toUpperCase() || 'EN'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 print:bg-white print:border-gray-300">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block print:text-gray-600">
                  Delivery Destination
                </span>
                <p className="text-sm font-semibold text-slate-200 mt-1 whitespace-pre-line print:text-black">
                  {order.address}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-white text-xs font-bold border border-slate-700 print:border-gray-400 print:text-black print:bg-gray-100">
                    {order.district} District
                  </span>
                  <span className="text-xs text-slate-400 print:text-gray-600">
                    Fee: {formatLKR(order.deliveryCost)}
                  </span>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 print:bg-gray-50 print:text-black print:border-gray-300">
                <span className="font-bold text-white block mb-0.5 print:text-black">Customer Instructions:</span>
                {order.notes}
              </div>
            )}
          </Card>

          {/* Ordered Products Table */}
          <Card className="p-6 space-y-4 print:border-none print:shadow-none print:p-0">
            <h2 className="text-base font-bold text-white flex items-center gap-2 print:text-black">
              <Package className="w-4 h-4 text-brand-neon print:hidden" />
              Ordered Spare Parts ({order.items?.length || 0})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 print:bg-gray-100 print:text-black print:border-gray-400">
                  <tr>
                    <th className="p-3">Part # / Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                  {order.items?.map((item: any) => {
                    const lineTotal = Number(item.unitPrice) * item.qty;
                    return (
                      <tr key={item.id} className="hover:bg-slate-900/30 print:hover:bg-transparent">
                        <td className="p-3">
                          <span className="font-mono font-bold text-brand-neon block print:text-black">
                            {item.partNumber}
                          </span>
                          <span className="font-bold text-white text-xs print:text-black">
                            {item.productName}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-white text-sm print:text-black">
                          {item.qty}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-300 print:text-black">
                          {formatLKR(item.unitPrice)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white print:text-black">
                          {formatLKR(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Col: Financials & Admin Notes */}
        <div className="space-y-6 print:mt-6">
          {/* Order Financials Card */}
          <Card className="p-6 space-y-4 print:border print:border-gray-300 print:p-4">
            <h2 className="text-base font-bold text-white print:text-black">Payment Summary (COD)</h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-400 print:text-black">
                <span>Merchandise Subtotal</span>
                <span className="font-mono text-white print:text-black font-semibold">
                  {formatLKR(order.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 print:text-black">
                <span>Islandwide Courier Fee</span>
                <span className="font-mono text-white print:text-black font-semibold">
                  {formatLKR(order.deliveryCost)}
                </span>
              </div>

              <div className="my-2 border-t border-slate-800 print:border-gray-400" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white print:text-black">
                  Total Payable (Cash On Delivery)
                </span>
                <span className="text-lg font-black font-mono text-brand-neon print:text-black">
                  {formatLKR(order.total)}
                </span>
              </div>

              {/* Admin Profit (Hidden during print) */}
              {isAdmin && (
                <div className="print:hidden mt-4 pt-3 border-t border-slate-800 text-[11px] flex items-center justify-between text-slate-400">
                  <span>Gross Order Profit (Merchandise - COGS)</span>
                  <span className="font-mono font-black text-emerald-400">
                    {formatLKR(orderProfit)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Tracking & Logistics (Hidden during print) */}
          <Card className="print:hidden p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-neon" />
              Tracking & Dispatch Notes
            </h2>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">
                Courier Tracking Number:
              </span>
              <p className="text-xs font-mono text-white p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                {order.trackingNumber || 'No tracking number assigned yet'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300">Internal Admin Notes:</span>
                {!editingNotes && (
                  <button
                    onClick={() => {
                      setAdminNotes(order.adminNotes || '');
                      setEditingNotes(true);
                    }}
                    className="text-xs text-brand-neon hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Staff notes, delivery attempts, customer remarks..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingNotes(false)}
                      className="text-xs h-7"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateNotesMutation.mutate(adminNotes)}
                      loading={updateNotesMutation.isPending}
                      className="text-xs h-7 font-bold"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 p-2.5 rounded-xl bg-slate-900 border border-slate-800 min-h-[60px]">
                  {order.adminNotes || 'No internal notes recorded.'}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Status Change Dialog */}
      {targetStatus && (
        <Dialog
          open={!!targetStatus}
          onOpenChange={(open) => !open && setTargetStatus(null)}
          title={`Update Order Status to ${targetStatus}`}
          description={
            targetStatus === 'CONFIRMED'
              ? 'Confirming this order will atomically deduct parts quantity from warehouse inventory.'
              : targetStatus === 'CANCELLED'
              ? 'Cancelling this order will automatically restore parts quantity back to warehouse inventory.'
              : `Change order status to ${targetStatus}.`
          }
        >
          <div className="space-y-4">
            {targetStatus === 'SHIPPED' && (
              <Input
                label="Courier Tracking Number"
                placeholder="e.g. PR-9948218LK (PromptX / Domex)"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                autoFocus
              />
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status Update Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Customer confirmed via WhatsApp call"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setTargetStatus(null)}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={targetStatus === 'CANCELLED' ? 'danger' : 'default'}
                onClick={() =>
                  updateStatusMutation.mutate({
                    status: targetStatus,
                    notes: statusNote || undefined,
                    trackingNumber: trackingInput || undefined,
                  })
                }
                loading={updateStatusMutation.isPending}
                className="font-bold"
              >
                Confirm {targetStatus}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
