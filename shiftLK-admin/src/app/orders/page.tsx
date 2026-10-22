'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatLKR, formatDateTime, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/common/Toast';

const SRI_LANKA_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle',
];

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [district, setDistrict] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', { page, limit, status, district, search }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (status !== 'all') params.set('status', status);
      if (district !== 'all') params.set('district', district);
      if (search.trim()) params.set('search', search.trim());
      return apiClient<{ data: any[]; pagination: any }>(`/api/v1/admin/orders?${params.toString()}`);
    },
  });

  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination || { page: 1, totalPages: 1, total: 0 };

  const getStatusBadge = (orderStatus: string) => {
    switch (orderStatus) {
      case 'PENDING':
        return <Badge variant="warning">PENDING</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info">CONFIRMED</Badge>;
      case 'SHIPPED':
        return <Badge variant="neon">SHIPPED</Badge>;
      case 'DELIVERED':
        return <Badge variant="success">DELIVERED</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">CANCELLED</Badge>;
      default:
        return <Badge variant="default">{orderStatus}</Badge>;
    }
  };

  const getCleanPhone = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '94' + clean.slice(1);
    if (!clean.startsWith('94') && clean.length === 9) clean = '94' + clean;
    return clean;
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-brand-neon" />
            Customer Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track customer orders, confirm stock allocations, print invoices, and update delivery statuses.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search code, name, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-neon"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending (New)</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* District Filter */}
          <select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
          >
            <option value="all">All 25 Districts</option>
            {SRI_LANKA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatus('all');
              setDistrict('all');
              setPage(1);
            }}
            className="text-xs"
          >
            Reset Filters
          </Button>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Order Code</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer Details</th>
                <th className="p-3">Destination</th>
                <th className="p-3">Items</th>
                <th className="p-3 text-right">Total (LKR)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="p-4">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300">No orders found</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Orders placed on customer website will appear here in real time.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const cleanPhone = getCleanPhone(o.phone);
                  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hello ${o.customerName}, this is ShiftLK Spares regarding your order #${o.orderCode}.`
                  )}`;

                  return (
                    <tr key={o.id} className="hover:bg-slate-900/40 transition-colors">
                      {/* Order Code */}
                      <td className="p-3">
                        <Link
                          href={`/orders/${o.id}`}
                          className="font-mono font-bold text-white hover:text-brand-neon transition-colors"
                        >
                          {o.orderCode}
                        </Link>
                      </td>

                      {/* Date */}
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {formatDateTime(o.createdAt)}
                      </td>

                      {/* Customer Info */}
                      <td className="p-3">
                        <div className="font-bold text-white">{o.customerName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-400 font-mono">{o.phone}</span>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300"
                            title="Chat with customer on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                          {o.district}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="p-3">
                        <span className="text-slate-300 font-semibold">
                          {o.itemsCount} {o.itemsCount === 1 ? 'part' : 'parts'}
                        </span>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">
                          {o.items?.map((i: any) => `${i.productName} (x${i.qty})`).join(', ')}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="p-3 text-right font-mono font-bold text-brand-neon text-sm">
                        {formatLKR(o.total)}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">{getStatusBadge(o.status)}</td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <Link href={`/orders/${o.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5 gap-1 font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            Showing {orders.length} of {pagination.total} orders
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="gap-1 h-8"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <span className="font-semibold px-2 text-white">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="gap-1 h-8"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
