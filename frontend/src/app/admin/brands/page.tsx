'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Globe,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/common/Toast';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { BrandModal } from '@/components/admin/brands/BrandModal';

export interface AdminBrand {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  isActive: boolean;
  createdAt?: string;
  productsCount: number;
}

export default function AdminBrandsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const { isAdmin } = useAuth();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<AdminBrand | null>(null);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<AdminBrand | null>(null);

  // Fetch admin brands
  const {
    data: brands = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<AdminBrand[]>({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      const res = await apiClient<any>('/api/v1/admin/brands');
      return Array.isArray(res) ? res : (res?.data || []);
    },
  });

  // Filter brands
  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      if (statusFilter === 'active' && !b.isActive) return false;
      if (statusFilter === 'disabled' && b.isActive) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const name = (b.name || '').toLowerCase();
        const slug = (b.slug || '').toLowerCase();
        const country = (b.country || '').toLowerCase();

        return name.includes(query) || slug.includes(query) || country.includes(query);
      }

      return true;
    });
  }, [brands, statusFilter, searchTerm]);

  // Status Toggle Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiClient(`/api/v1/admin/brands/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      success('Brand status updated');
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to update brand status');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/api/v1/admin/brands/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      success('Brand deleted successfully');
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to delete brand');
    },
  });

  // Metrics
  const activeCount = brands.filter((b) => b.isActive).length;
  const disabledCount = brands.filter((b) => !b.isActive).length;
  const totalProducts = brands.reduce((acc, b) => acc + (b.productsCount || 0), 0);

  const handleOpenCreate = () => {
    setSelectedBrand(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (brand: AdminBrand) => {
    setSelectedBrand(brand);
    setModalOpen(true);
  };

  const handleOpenDelete = (brand: AdminBrand) => {
    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Award className="w-6 h-6 text-brand-neon" />
              Brand Management
            </h1>
            <Badge
              variant="outline"
              className="bg-brand-neon/10 text-brand-neon border-brand-neon/30 text-xs px-2.5 py-0.5"
            >
              {brands.length} Brands
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage OEM manufacturers and aftermarket motorbike spare part brands (Bajaj, Yamaha, TVS, Honda, Minda, etc.)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 text-xs"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isRefetching && 'animate-spin')} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="bg-brand-neon text-slate-950 font-bold hover:bg-brand-neon/90 text-xs px-4 shadow-lg shadow-brand-neon/20 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Brand
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/60 border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Brands</span>
            <Award className="w-4 h-4 text-brand-neon" />
          </div>
          <p className="text-xl font-bold text-white mt-1">{brands.length}</p>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Active In Catalog</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-1">{activeCount}</p>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Disabled</span>
            <XCircle className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-bold text-slate-400 mt-1">{disabledCount}</p>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Assigned Parts</span>
            <Package className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-bold text-sky-400 mt-1">{totalProducts}</p>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by brand name, slug, or country of origin..."
              className="pl-9 bg-slate-950 border-slate-800 text-xs text-white focus:border-brand-neon w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-none',
                  statusFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                All ({brands.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-none',
                  statusFilter === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('disabled')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-none',
                  statusFilter === 'disabled'
                    ? 'bg-slate-800 text-slate-300'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                Disabled ({disabledCount})
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Brands Table */}
      <Card className="border-slate-800/80 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Brand Name & Slug</th>
                <th className="py-3 px-4">Country of Origin</th>
                <th className="py-3 px-4 text-center">Linked Products</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-xl bg-slate-800" />
                        <div className="space-y-1.5">
                          <Skeleton className="w-32 h-3.5 bg-slate-800" />
                          <Skeleton className="w-20 h-2.5 bg-slate-800" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><Skeleton className="w-24 h-4 bg-slate-800" /></td>
                    <td className="py-3 px-4 text-center"><Skeleton className="w-12 h-4 mx-auto bg-slate-800" /></td>
                    <td className="py-3 px-4 text-center"><Skeleton className="w-16 h-5 mx-auto bg-slate-800" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="w-16 h-7 ml-auto bg-slate-800" /></td>
                  </tr>
                ))
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Award className="w-8 h-8 mx-auto text-slate-600" />
                      <p className="font-semibold text-slate-300">No brands found</p>
                      <p className="text-xs text-slate-500">
                        {searchTerm
                          ? 'Try adjusting your search terms or filters.'
                          : 'Get started by adding your first motorbike spare parts brand.'}
                      </p>
                      {!searchTerm && (
                        <Button
                          size="sm"
                          onClick={handleOpenCreate}
                          className="bg-brand-neon text-slate-950 font-bold hover:bg-brand-neon/90 text-xs mt-2"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Brand
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Brand & Initial Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-brand-neon font-black text-sm shrink-0 shadow-sm group-hover:border-brand-neon/40 transition-colors">
                          {(brand.name || 'B').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-brand-neon transition-colors">
                            {brand.name}
                          </p>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            /{brand.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Country */}
                    <td className="py-3 px-4">
                      {brand.country ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-300 font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          <Globe className="w-3 h-3 text-brand-neon" />
                          {brand.country}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-600 italic">Not specified</span>
                      )}
                    </td>

                    {/* Linked Products Count */}
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs px-2 py-0.5 font-bold',
                          brand.productsCount > 0
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        )}
                      >
                        {brand.productsCount} parts
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          toggleStatusMutation.mutate({ id: brand.id, isActive: brand.isActive })
                        }
                        disabled={toggleStatusMutation.isPending}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all hover:scale-105',
                          brand.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            brand.isActive ? 'bg-emerald-400' : 'bg-rose-400'
                          )}
                        />
                        {brand.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(brand)}
                          className="h-8 px-2.5 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>

                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDelete(brand)}
                            className="h-8 px-2 border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/30 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Brand Create/Edit Modal */}
      <BrandModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        brand={selectedBrand}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => !open && setDeleteDialogOpen(false)}
        className="max-w-md bg-slate-950 border-slate-800 text-white rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">Delete Brand</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete{' '}
              <strong className="text-white">
                "{brandToDelete?.name || brandToDelete?.slug}"
              </strong>
              ?
            </p>
          </div>
        </div>

        {/* Warning if products are linked */}
        {(brandToDelete?.productsCount ?? 0) > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              Cannot Delete: {brandToDelete?.productsCount} Linked Product(s)
            </p>
            <p className="text-amber-300/80 text-[11px] leading-relaxed">
              This brand currently contains active products in your catalog. To maintain catalog integrity, you must reassign or remove these products before deleting this brand.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800/80">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            className="border-slate-800 text-slate-300 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => brandToDelete && deleteMutation.mutate(brandToDelete.id)}
            loading={deleteMutation.isPending}
            disabled={(brandToDelete?.productsCount ?? 0) > 0}
            className="bg-rose-600 text-white font-bold hover:bg-rose-500 text-xs px-4"
          >
            Confirm Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

