'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Truck,
  Users,
  Shield,
  Save,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Search,
  Lock,
  Phone,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatLKR, formatDate, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/common/Toast';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'system' | 'delivery' | 'users'>('system');

  // System Settings State
  const [defaultLowStock, setDefaultLowStock] = useState('5');
  const [whatsappNumber, setWhatsappNumber] = useState('94770871018');
  const [hideProfitFromStaff, setHideProfitFromStaff] = useState(false);

  // Delivery Zones State
  const [districtSearch, setDistrictSearch] = useState('');
  const [editingZone, setEditingZone] = useState<any | null>(null);
  const [zoneBaseFee, setZoneBaseFee] = useState('');
  const [zoneExtraKg, setZoneExtraKg] = useState('');
  const [zoneDays, setZoneDays] = useState('');

  // Users State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<'ADMIN' | 'STAFF'>('STAFF');

  // 1. Fetch System Settings & Delivery Zones
  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => apiClient<any>('/api/v1/admin/settings'),
  });

  // 2. Fetch Users (if admin)
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiClient<any>('/api/v1/admin/users'),
    enabled: isAdmin,
  });

  const deliveryZones = settingsData?.deliveryZones || [];
  const usersList = usersData?.data || [];

  // Populate System Settings when data loads
  useEffect(() => {
    if (settingsData?.settings) {
      setDefaultLowStock(String(settingsData.settings.defaultLowStockAlert ?? 5));
      setWhatsappNumber(settingsData.settings.whatsappNumber || '94770871018');
      setHideProfitFromStaff(Boolean(settingsData.settings.hideProfitFromStaff));
    }
  }, [settingsData]);

  // Mutations
  const updateSystemMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient('/api/v1/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      success('System settings saved successfully');
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to save system settings');
    },
  });

  const updateZoneMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      apiClient(`/api/v1/admin/settings/delivery-zones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      success('Delivery zone updated');
      setEditingZone(null);
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to update delivery zone');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient('/api/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      success('Staff user created successfully');
      setIsAddUserOpen(false);
      setUserName('');
      setUserEmail('');
      setUserPassword('');
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to create user');
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient(`/api/v1/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      success('User status updated');
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to update user status');
    },
  });

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemMutation.mutate({
      defaultLowStockAlert: Number(defaultLowStock) || 5,
      whatsappNumber: whatsappNumber.trim(),
      hideProfitFromStaff,
    });
  };

  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;
    updateZoneMutation.mutate({
      id: editingZone.id,
      payload: {
        baseFee: Number(zoneBaseFee),
        extraPerKg: Number(zoneExtraKg),
        estimatedDays: zoneDays.trim() || editingZone.estimatedDays,
      },
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (userPassword.length < 8) {
      toastError('Password must be at least 8 characters long');
      return;
    }
    createUserMutation.mutate({
      name: userName.trim(),
      email: userEmail.trim(),
      password: userPassword,
      role: userRole,
    });
  };

  // Filter Delivery Zones
  const filteredZones = deliveryZones.filter(
    (z: any) =>
      z.district.toLowerCase().includes(districtSearch.toLowerCase()) ||
      z.province.toLowerCase().includes(districtSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-brand-neon" />
            Store Settings & Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure islandwide delivery fees, WhatsApp integration, and staff member permissions.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('system')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'system'
              ? 'bg-brand-neon/15 text-brand-neon border border-brand-neon/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          )}
        >
          <Settings className="w-4 h-4" />
          Store & System Parameters
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'delivery'
              ? 'bg-brand-neon/15 text-brand-neon border border-brand-neon/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          )}
        >
          <Truck className="w-4 h-4" />
          Delivery Fees (25 Districts)
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'users'
                ? 'bg-brand-neon/15 text-brand-neon border border-brand-neon/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            )}
          >
            <Users className="w-4 h-4" />
            Staff & Personnel ({usersList.length})
          </button>
        )}
      </div>

      {/* Tab 1: System Parameters */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveSystem} className="max-w-2xl space-y-6">
          <Card className="p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-neon" />
              General Store Configuration
            </h2>

            <Input
              label="Default Low Stock Alert Threshold (Units)"
              type="number"
              min="1"
              value={defaultLowStock}
              onChange={(e) => setDefaultLowStock(e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-400 -mt-3">
              Products with warehouse quantity below this value trigger instant dashboard warnings.
            </p>

            <Input
              label="Business WhatsApp Hotline Number"
              type="text"
              placeholder="e.g. 94770871018"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-400 -mt-3">
              Included in customer invoice links and order notification buttons (no leading 0, with 94 prefix).
            </p>

            <div className="pt-3 border-t border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideProfitFromStaff}
                  onChange={(e) => setHideProfitFromStaff(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-brand-neon focus:ring-brand-neon w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Hide Profit Figures from Staff Members
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    When checked, users with STAFF role cannot view unit margins or gross profit in reports.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <Button
                type="submit"
                loading={updateSystemMutation.isPending}
                className="gap-2 font-bold"
              >
                <Save className="w-4 h-4" />
                Save System Settings
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* Tab 2: Delivery Fees (25 Districts) */}
      {activeTab === 'delivery' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search district or province..."
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
              />
            </div>

            <span className="text-xs text-slate-400">
              Showing {filteredZones.length} of 25 districts
            </span>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">District</th>
                    <th className="p-3">Province</th>
                    <th className="p-3 text-right">Base Courier Fee (1st kg)</th>
                    <th className="p-3 text-right">Extra Fee (per additional kg)</th>
                    <th className="p-3">Estimated Time</th>
                    <th className="p-3 text-center">Active</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingSettings ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="p-4">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filteredZones.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No districts match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredZones.map((z: any) => (
                      <tr key={z.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-bold text-white">{z.district}</td>
                        <td className="p-3 text-slate-400">{z.province}</td>
                        <td className="p-3 text-right font-mono font-bold text-brand-neon">
                          {formatLKR(z.baseFee)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-300">
                          {formatLKR(z.extraPerKg)}
                        </td>
                        <td className="p-3 text-slate-300">{z.estimatedDays || '1-3 days'}</td>
                        <td className="p-3 text-center">
                          {z.isActive ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-600 mx-auto" />
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingZone(z);
                              setZoneBaseFee(String(z.baseFee));
                              setZoneExtraKg(String(z.extraPerKg));
                              setZoneDays(z.estimatedDays || '1-3 business days');
                            }}
                            className="h-7 text-xs px-2.5 gap-1 font-semibold"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Staff & Users */}
      {activeTab === 'users' && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Manage internal authorized team members who can access the ShiftLK admin portal.
            </span>
            <Button
              size="sm"
              onClick={() => setIsAddUserOpen(true)}
              className="gap-1.5 font-bold shadow-lg shadow-brand-neon/20"
            >
              <Plus className="w-4 h-4" />
              Add Staff Member
            </Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Member Since</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingUsers ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="p-4">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No staff members found.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-bold text-white">{u.name}</td>
                        <td className="p-3 text-slate-300 font-mono text-[11px]">{u.email}</td>
                        <td className="p-3">
                          <Badge
                            variant={u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'neon' : 'default'}
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">{formatDate(u.createdAt)}</td>
                        <td className="p-3 text-center">
                          <Badge variant={u.isActive ? 'success' : 'danger'}>
                            {u.isActive ? 'Active' : 'Disabled'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          {u.id !== user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                toggleUserStatusMutation.mutate({
                                  id: u.id,
                                  isActive: !u.isActive,
                                })
                              }
                              className={cn(
                                'h-7 text-xs px-2.5',
                                u.isActive
                                  ? 'text-rose-400 border-rose-900 hover:bg-rose-950/40'
                                  : 'text-emerald-400 border-emerald-900 hover:bg-emerald-950/40'
                              )}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Delivery Zone Dialog */}
      {editingZone && (
        <Dialog
          open={!!editingZone}
          onOpenChange={(open) => !open && setEditingZone(null)}
          title={`Edit Delivery Fee: ${editingZone.district} District`}
          description={`Update courier rates for ${editingZone.district} (${editingZone.province} Province).`}
        >
          <form onSubmit={handleSaveZone} className="space-y-4">
            <Input
              label="Base Fee (1st kg) in LKR *"
              type="number"
              min="0"
              required
              value={zoneBaseFee}
              onChange={(e) => setZoneBaseFee(e.target.value)}
              autoFocus
            />

            <Input
              label="Extra Fee (per additional kg) in LKR *"
              type="number"
              min="0"
              required
              value={zoneExtraKg}
              onChange={(e) => setZoneExtraKg(e.target.value)}
            />

            <Input
              label="Estimated Delivery Timeframe *"
              type="text"
              placeholder="e.g. 1-2 business days"
              value={zoneDays}
              onChange={(e) => setZoneDays(e.target.value)}
              required
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingZone(null)}
                disabled={updateZoneMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" loading={updateZoneMutation.isPending} className="font-bold">
                Update Fee
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Add Staff User Dialog */}
      <Dialog
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        title="Add Staff Member"
        description="Create credentials for a store employee to manage orders, products, and inventory."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Ruwan Silva"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="ruwan@shiftlk.com"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Assigned Role *
            </label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
            >
              <option value="STAFF">Staff (Orders & Products management)</option>
              <option value="ADMIN">Administrator (Full Access & Settings)</option>
            </select>
          </div>

          <Input
            label="Initial Password (minimum 8 characters) *"
            type="password"
            placeholder="••••••••••••"
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddUserOpen(false)}
              disabled={createUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createUserMutation.isPending} className="font-bold">
              Create User
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
