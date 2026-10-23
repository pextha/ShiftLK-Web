'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  CheckCircle2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
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

export default function StockOverviewPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
  const [search, setSearch] = useState('');
  const [movementPage, setMovementPage] = useState(1);

  // Restock Modal
  const [restockItem, setRestockItem] = useState<any | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [restockLoading, setRestockLoading] = useState(false);

  // 1. Fetch Overview KPIs
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-stock-overview'],
    queryFn: () => apiClient<any>('/api/v1/admin/products/stock/overview'),
  });

  // 2. Fetch Products for Stock List
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products-stock', search],
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set('limit', '100');
      if (search.trim()) qs.set('search', search.trim());
      return apiClient<any>(`/api/v1/admin/products?${qs.toString()}`);
    },
  });

  // 3. Fetch Stock Movements Log
  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['admin-stock-movements', movementPage],
    queryFn: () =>
      apiClient<any>(`/api/v1/admin/products/stock/movements?page=${movementPage}&limit=20`),
  });

  const products = productsData?.data || [];
  const movements = movementsData?.data || [];
  const movementsPagination = movementsData?.pagination || { page: 1, totalPages: 1 };

  // Filter products by stock status
  const filteredProducts = products.filter((p: any) => {
    const isOut = p.stockQty <= 0;
    const isLow = p.stockQty <= (p.lowStockThreshold || 5);
    if (filterStatus === 'out') return isOut;
    if (filterStatus === 'low') return isLow;
    return true;
  });

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    setRestockLoading(true);

    try {
      await apiClient(`/api/v1/admin/products/${restockItem.id}/restock`, {
        method: 'POST',
        body: JSON.stringify({
          quantityAdded: Number(restockQty),
          newCostPrice: restockCost ? Number(restockCost) : undefined,
          note: restockNote || undefined,
        }),
      });

      success(`Restocked ${restockQty} units to ${restockItem.partNumber}`);
      queryClient.invalidateQueries({ queryKey: ['admin-stock-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products-stock'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stock-movements'] });
      setRestockItem(null);
      setRestockQty('');
      setRestockCost('');
      setRestockNote('');
    } catch (err: any) {
      toastError(err.message || 'Restock failed');
    } finally {
      setRestockLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-brand-neon" />
            Stock & Inventory Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time warehouse stock valuation, restock audits, and movement logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/products/new">
            <Button size="sm" className="gap-2 font-bold shadow-lg shadow-brand-neon/20">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Units */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Stock Units
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-black text-white">
                  {overview?.totalUnits ?? 0}
                </h2>
                <span className="text-xs text-slate-400 font-semibold">
                  across {overview?.totalProducts ?? 0} parts
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              {overview?.outOfStockCount > 0 ? (
                <Badge variant="danger">{overview.outOfStockCount} Out of stock</Badge>
              ) : null}
              {overview?.lowStockCount > 0 ? (
                <Badge variant="warning">{overview.lowStockCount} Low stock</Badge>
              ) : null}
            </div>
          </div>
        </Card>

        {/* Stock Value at Cost */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Valuation (At Cost)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {overviewLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <h2 className="text-2xl font-black text-white">
                {formatLKR(overview?.totalStockValueAtCost ?? 0)}
              </h2>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Capital invested in physical inventory</p>
          </div>
        </Card>

        {/* Stock Value at Retail */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Valuation (At Retail)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {overviewLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <h2 className="text-2xl font-black text-white">
                {formatLKR(overview?.totalStockValueAtSelling ?? 0)}
              </h2>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Gross potential store revenue</p>
          </div>
        </Card>

        {/* Expected Profit */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Expected Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {overviewLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <h2 className="text-2xl font-black text-brand-neon">
                {formatLKR(overview?.expectedProfitIfAllSold ?? 0)}
              </h2>
            )}
            <p className="text-[11px] text-slate-400 mt-1">When all active inventory is sold</p>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="space-y-4">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'inventory'
                ? 'bg-brand-neon/15 text-brand-neon border border-brand-neon/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            )}
          >
            <Boxes className="w-4 h-4" />
            Current Inventory ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'movements'
                ? 'bg-brand-neon/15 text-brand-neon border border-brand-neon/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            )}
          >
            <History className="w-4 h-4" />
            Stock Movement History Log
          </button>
        </div>

        {/* Tab 1: Current Inventory */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by part # or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-colors',
                    filterStatus === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  All Items
                </button>
                <button
                  onClick={() => setFilterStatus('low')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-colors',
                    filterStatus === 'low'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'text-slate-400 hover:text-amber-400'
                  )}
                >
                  Low Stock
                </button>
                <button
                  onClick={() => setFilterStatus('out')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-colors',
                    filterStatus === 'out'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'text-slate-400 hover:text-rose-400'
                  )}
                >
                  Out of Stock
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Part #</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Brand</th>
                      <th className="p-3 text-center">Stock Level</th>
                      <th className="p-3 text-right">Cost Value</th>
                      <th className="p-3 text-right">Retail Value</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {productsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} className="p-4">
                            <Skeleton className="h-8 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                          <p className="font-semibold text-slate-200">No matching products found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p: any) => {
                        const enName =
                          p.translations?.find((t: any) => t.language === 'en')?.name || p.slug;
                        const isOut = p.stockQty <= 0;
                        const isLow = p.stockQty <= (p.lowStockThreshold || 5);
                        const totalCostVal = p.stockQty * Number(p.costPrice);
                        const totalRetailVal = p.stockQty * Number(p.sellingPrice);

                        return (
                          <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-white">
                              {p.partNumber}
                            </td>
                            <td className="p-3">
                              <Link
                                href={`/admin/products/${p.id}/edit`}
                                className="font-semibold text-slate-200 hover:text-brand-neon transition-colors truncate block max-w-xs"
                              >
                                {enName}
                              </Link>
                            </td>
                            <td className="p-3 text-slate-400">{p.brand?.name || 'Generic'}</td>
                            <td className="p-3 text-center">
                              <Badge
                                variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}
                                className="font-mono"
                              >
                                {p.stockQty} in stock (min {p.lowStockThreshold || 5})
                              </Badge>
                            </td>
                            <td className="p-3 text-right font-mono text-slate-400">
                              {formatLKR(totalCostVal)}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-white">
                              {formatLKR(totalRetailVal)}
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRestockItem(p);
                                  setRestockCost(String(p.costPrice));
                                }}
                                className="h-7 text-xs px-2.5 font-bold gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Restock
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Stock Movement History Log */}
        {activeTab === 'movements' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Product / Part #</th>
                    <th className="p-3 text-center">Change</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Triggered By</th>
                    <th className="p-3">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {movementsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="p-4">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : movements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400">
                        <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="font-semibold text-slate-200">No stock movements recorded yet</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Movements are automatically logged on restocks, order confirmations, and cancellations.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    movements.map((m: any) => {
                      const isPositive = m.changeQty > 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 text-slate-400 font-mono text-[11px]">
                            {formatDateTime(m.createdAt)}
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-white block">
                              {m.product?.partNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block max-w-xs">
                              {m.product?.translations?.[0]?.name || m.product?.slug}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 font-mono font-black px-2 py-0.5 rounded-lg text-xs',
                                isPositive
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                  : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                              )}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              )}
                              {isPositive ? `+${m.changeQty}` : m.changeQty}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="uppercase font-mono text-[10px]">
                              {m.reason.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-slate-300">
                            {m.user?.name || 'System / Order'}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">
                            {m.note || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for movements */}
            <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {movementPage} of {movementsPagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={movementPage <= 1}
                  onClick={() => setMovementPage(movementPage - 1)}
                  className="gap-1 h-8"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={movementPage >= movementsPagination.totalPages}
                  onClick={() => setMovementPage(movementPage + 1)}
                  className="gap-1 h-8"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Restock Dialog */}
      {restockItem && (
        <Dialog
          open={!!restockItem}
          onOpenChange={(open) => !open && setRestockItem(null)}
          title={`Restock: ${restockItem.partNumber}`}
          description={`Add inventory units for ${
            restockItem.translations?.find((t: any) => t.language === 'en')?.name ||
            restockItem.slug
          }. Current stock: ${restockItem.stockQty} units.`}
        >
          <form onSubmit={handleRestockSubmit} className="space-y-4">
            <Input
              label="Quantity to Add *"
              type="number"
              min="1"
              required
              placeholder="e.g. 10"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              autoFocus
            />

            <Input
              label="New Unit Cost Price (LKR, optional)"
              type="number"
              step="0.01"
              placeholder={`Current: ${restockItem.costPrice}`}
              value={restockCost}
              onChange={(e) => setRestockCost(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Restock Note / Supplier Batch (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Received from importer container #4"
                value={restockNote}
                onChange={(e) => setRestockNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRestockItem(null)}
                disabled={restockLoading}
              >
                Cancel
              </Button>
              <Button type="submit" loading={restockLoading} className="font-bold">
                Confirm Restock
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
