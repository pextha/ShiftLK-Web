'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Boxes,
  ArrowUpDown,
  MoreVertical,
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatLKR, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/common/Toast';
import { useAuth } from '@/lib/auth-context';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const { isAdmin } = useAuth();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [condition, setCondition] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Selection & Bulk state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Restock Quick Modal state
  const [restockProduct, setRestockProduct] = useState<any | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [restockSubmitting, setRestockSubmitting] = useState(false);

  // Inline Stock Edit state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineQty, setInlineQty] = useState<number>(0);

  // Delete confirmation
  const [productToDelete, setProductToDelete] = useState<any | null>(null);

  // Fetch Categories for dropdown
  const { data: rawCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient<any[]>('/api/v1/categories'),
  });
  const categories: any[] = Array.isArray(rawCategories)
    ? rawCategories
    : Array.isArray((rawCategories as any)?.data)
    ? (rawCategories as any).data
    : [];

  // Fetch Products with pagination & filters
  const { data: productData, isLoading, refetch } = useQuery({
    queryKey: ['admin-products', { page, limit, search, category, condition }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search.trim()) params.set('search', search.trim());
      if (category !== 'all') params.set('category', category);
      if (condition !== 'all') params.set('condition', condition);
      return apiClient<{ data: any[]; pagination: any }>(`/api/v1/admin/products?${params.toString()}`);
    },
  });

  const getMediaUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${base.replace(/\/api\/v1\/?$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const products: any[] = Array.isArray(productData)
    ? productData
    : Array.isArray(productData?.data)
    ? productData.data
    : [];
  const pagination = productData?.pagination || { page: 1, totalPages: 1, total: products.length };

  // Mutations
  const inlineStockMutation = useMutation({
    mutationFn: ({ id, newQty }: { id: string; newQty: number }) =>
      apiClient(`/api/v1/admin/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ newQty }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      success('Stock quantity updated');
      setInlineEditingId(null);
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to update stock');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient(`/api/v1/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      success('Product status updated');
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to update product');
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ action }: { action: 'ACTIVATE' | 'DEACTIVATE' }) =>
      apiClient('/api/v1/admin/products/bulk', {
        method: 'POST',
        body: JSON.stringify({ action, productIds: selectedIds }),
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      success(`Successfully ${vars.action.toLowerCase()}d ${selectedIds.length} products`);
      setSelectedIds([]);
    },
    onError: (err: any) => {
      toastError(err.message || 'Bulk operation failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/admin/products/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      success('Product deleted successfully');
      setProductToDelete(null);
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to delete product');
    },
  });

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    setRestockSubmitting(true);

    try {
      await apiClient(`/api/v1/admin/products/${restockProduct.id}/restock`, {
        method: 'POST',
        body: JSON.stringify({
          quantityAdded: Number(restockQty),
          newCostPrice: restockCost ? Number(restockCost) : undefined,
          note: restockNote || undefined,
        }),
      });

      success(`Successfully added ${restockQty} units to ${restockProduct.partNumber}`);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setRestockProduct(null);
      setRestockQty('');
      setRestockCost('');
      setRestockNote('');
    } catch (err: any) {
      toastError(err.message || 'Restock failed');
    } finally {
      setRestockSubmitting(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportCsv = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    window.open(`${apiUrl}/admin/products/export-csv`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-brand-neon" />
            Products & Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage catalogue, stock quantities, cost/selling margins, and bike compatibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-2 text-xs font-semibold"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>

          <Link href="/admin/products/new">
            <Button size="sm" className="gap-2 font-bold shadow-lg shadow-brand-neon/20">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by part #, name, slug..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-neon"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
          >
            <option value="all">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Condition Filter */}
          <select
            value={condition}
            onChange={(e) => {
              setCondition(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
          >
            <option value="all">All Conditions</option>
            <option value="NEW">Brand New</option>
            <option value="RECONDITIONED">Reconditioned</option>
            <option value="USED">Used</option>
          </select>

          {/* Quick Refresh */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="w-full gap-2 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Bulk Action Bar (when rows are selected) */}
        {selectedIds.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between animate-in fade-in">
            <span className="text-xs font-semibold text-brand-neon">
              {selectedIds.length} {selectedIds.length === 1 ? 'product' : 'products'} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkMutation.mutate({ action: 'ACTIVATE' })}
                disabled={bulkMutation.isPending}
                className="text-xs text-emerald-400 border-emerald-900 hover:bg-emerald-950/40"
              >
                Set Active
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkMutation.mutate({ action: 'DEACTIVATE' })}
                disabled={bulkMutation.isPending}
                className="text-xs text-rose-400 border-rose-900 hover:bg-rose-950/40"
              >
                Set Inactive
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-400"
              >
                Deselect All
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === products.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-700 bg-slate-900 text-brand-neon focus:ring-brand-neon"
                  />
                </th>
                <th className="p-3">Product / Part</th>
                <th className="p-3">Category</th>
                <th className="p-3">Condition</th>
                <th className="p-3 text-right">Cost Price</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-right">Margin</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-center">Active</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={10} className="p-4">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300">No products found</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Try clearing filters or add a new product.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const enName =
                    p.translations?.find((t: any) => t.language === 'en')?.name ||
                    p.slug;
                  const hasSi = p.translations?.some((t: any) => t.language === 'si');
                  const hasTa = p.translations?.some((t: any) => t.language === 'ta');
                  const primaryImg =
                    p.images?.find((img: any) => img.isPrimary)?.imageUrl ||
                    p.images?.[0]?.imageUrl ||
                    null;

                  const isLow = p.stockQty <= (p.lowStockThreshold || 5);
                  const isOut = p.stockQty === 0;

                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        'hover:bg-slate-900/40 transition-colors',
                        selectedIds.includes(p.id) && 'bg-brand-neon/5'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleSelectOne(p.id)}
                          className="rounded border-slate-700 bg-slate-900 text-brand-neon focus:ring-brand-neon"
                        />
                      </td>

                      {/* Product Thumbnail & Details */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 relative">
                            {primaryImg ? (
                              <img
                                src={getMediaUrl(primaryImg) || ''}
                                alt={enName}
                                className="object-cover w-full h-full"
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-600" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <Link
                              href={`/admin/products/${p.id}/edit`}
                              className="font-bold text-white hover:text-brand-neon transition-colors truncate block text-xs"
                            >
                              {enName}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {p.partNumber}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="text-[10px] text-slate-400">
                                {p.brand?.name || 'Generic'}
                              </span>
                              <div className="flex items-center gap-0.5 ml-1">
                                <span className={cn('text-[9px] font-black px-1 rounded', hasSi ? 'bg-slate-800 text-slate-300' : 'text-slate-600')}>SI</span>
                                <span className={cn('text-[9px] font-black px-1 rounded', hasTa ? 'bg-slate-800 text-slate-300' : 'text-slate-600')}>TA</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                          {p.category?.slug || 'General'}
                        </span>
                      </td>

                      {/* Condition */}
                      <td className="p-3">
                        <Badge
                          variant={
                            p.condition === 'NEW'
                              ? 'success'
                              : p.condition === 'RECONDITIONED'
                              ? 'info'
                              : 'default'
                          }
                        >
                          {p.condition}
                        </Badge>
                      </td>

                      {/* Cost Price */}
                      <td className="p-3 text-right font-mono text-slate-400">
                        {formatLKR(p.costPrice)}
                      </td>

                      {/* Selling Price */}
                      <td className="p-3 text-right font-mono font-bold text-white">
                        {formatLKR(p.sellingPrice)}
                      </td>

                      {/* Margin % */}
                      <td className="p-3 text-right">
                        <span
                          className={cn(
                            'font-black',
                            p.profitMarginPercent >= 30
                              ? 'text-emerald-400'
                              : p.profitMarginPercent >= 15
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          )}
                        >
                          {p.profitMarginPercent}%
                        </span>
                      </td>

                      {/* Stock Quantity & Inline Editor */}
                      <td className="p-3 text-center">
                        {inlineEditingId === p.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={inlineQty}
                              onChange={(e) => setInlineQty(Number(e.target.value))}
                              className="w-16 px-1.5 py-0.5 text-center bg-slate-900 border border-brand-neon rounded text-white font-mono text-xs"
                              autoFocus
                            />
                            <button
                              onClick={() =>
                                inlineStockMutation.mutate({ id: p.id, newQty: inlineQty })
                              }
                              className="p-1 text-emerald-400 hover:text-emerald-300"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setInlineEditingId(null)}
                              className="p-1 text-slate-400 hover:text-slate-300"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              onClick={() => {
                                setInlineEditingId(p.id);
                                setInlineQty(p.stockQty);
                              }}
                              className={cn(
                                'font-mono font-black cursor-pointer px-2 py-0.5 rounded-lg border hover:scale-105 transition-transform',
                                isOut
                                  ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                                  : isLow
                                  ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                                  : 'bg-slate-900 border-slate-800 text-slate-200'
                              )}
                              title="Click to inline edit stock"
                            >
                              {p.stockQty}
                            </span>
                            <button
                              onClick={() => {
                                setRestockProduct(p);
                                setRestockCost(String(p.costPrice));
                              }}
                              className="p-1 text-slate-400 hover:text-brand-neon transition-colors"
                              title="Quick Restock"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Active Status Switch */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() =>
                            toggleActiveMutation.mutate({ id: p.id, isActive: !p.isActive })
                          }
                          className="cursor-pointer"
                          title={p.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {p.isActive ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-600 mx-auto" />
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/products/${p.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                              title="Edit product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProductToDelete(p)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
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
            Showing {products.length} of {pagination.total} products
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

      {/* Restock Modal */}
      {restockProduct && (
        <Dialog
          open={!!restockProduct}
          onOpenChange={(open) => !open && setRestockProduct(null)}
          title={`Restock: ${restockProduct.partNumber}`}
          description={`Add incoming inventory units for ${
            restockProduct.translations?.find((t: any) => t.language === 'en')?.name ||
            restockProduct.slug
          }. Current stock: ${restockProduct.stockQty} units.`}
        >
          <form onSubmit={handleRestockSubmit} className="space-y-4">
            <Input
              label="Quantity to Add"
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
              placeholder={`Current: ${restockProduct.costPrice}`}
              value={restockCost}
              onChange={(e) => setRestockCost(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Restock Note / Supplier Info (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Shipment batch #LK-99 from Colombo importer"
                value={restockNote}
                onChange={(e) => setRestockNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRestockProduct(null)}
                disabled={restockSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={restockSubmitting} className="font-bold">
                Confirm Restock
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <Dialog
          open={!!productToDelete}
          onOpenChange={(open) => !open && setProductToDelete(null)}
          title="Delete Product"
          description={`Are you sure you want to permanently delete part "${productToDelete.partNumber}" (${
            productToDelete.translations?.find((t: any) => t.language === 'en')?.name ||
            productToDelete.slug
          })? This action cannot be undone.`}
        >
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProductToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(productToDelete.id)}
              loading={deleteMutation.isPending}
            >
              Delete Product
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
