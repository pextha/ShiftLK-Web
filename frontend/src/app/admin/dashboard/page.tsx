'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Package,
  Plus,
  ArrowRight,
  Boxes,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { apiClient } from '@/lib/api-client';
import { formatLKR } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch Overview Stats
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => apiClient<any>('/api/v1/admin/analytics/overview'),
  });

  // Fetch Sales Timeline (last 30 days)
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['admin-sales-timeline'],
    queryFn: () => apiClient<any[]>('/api/v1/admin/analytics/sales?days=30'),
  });

  // Fetch Top Products
  const { data: topProducts, isLoading: topLoading } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: () => apiClient<any[]>('/api/v1/admin/analytics/top-products?limit=5'),
  });

  // Fetch Low Stock Products
  const { data: lowStock, isLoading: stockLoading } = useQuery({
    queryKey: ['admin-low-stock'],
    queryFn: () => apiClient<any[]>('/api/v1/admin/analytics/low-stock?threshold=5'),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Greetings */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome back, <span className="text-brand-neon">{user?.name || 'Admin'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Store performance and inventory metrics across Sri Lanka.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/products/new">
            <Button size="sm" className="gap-2 font-bold shadow-lg shadow-brand-neon/20">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </Link>
          <Link href="/admin/stock">
            <Button size="sm" variant="outline" className="gap-2">
              <Boxes className="w-4 h-4" />
              Stock Overview
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Revenue
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
                {formatLKR(overview?.revenue || 0)}
              </h2>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Confirmed & delivered orders</p>
          </div>
        </Card>

        {/* Gross Profit */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Gross Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {overviewLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-black text-brand-neon">
                  {formatLKR(overview?.grossProfit || 0)}
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  ({overview?.grossMarginPercent || 0}%)
                </span>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Revenue minus COGS</p>
          </div>
        </Card>

        {/* Orders Count & Pending */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white">
                  {overview?.totalOrders || 0}
                </h2>
                {overview?.pendingOrders > 0 && (
                  <Badge variant="warning" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {overview.pendingOrders} Pending
                  </Badge>
                )}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">All processed shipments</p>
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Low Stock Alerts
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {overviewLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-amber-400">
                  {overview?.lowStockAlerts || 0}
                </h2>
                {overview?.lowStockAlerts > 0 ? (
                  <Link href="/admin/stock">
                    <Badge variant="danger" className="cursor-pointer hover:opacity-80">
                      Restock needed
                    </Badge>
                  </Link>
                ) : (
                  <Badge variant="success">Healthy</Badge>
                )}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Qty at or below threshold</p>
          </div>
        </Card>
      </div>

      {/* Revenue Chart (30 Days) */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Sales Revenue (Last 30 Days)</h3>
            <p className="text-xs text-slate-400">Daily confirmed and delivered order totals (LKR)</p>
          </div>
          <Link href="/admin/reports">
            <Button variant="ghost" size="sm" className="text-xs text-brand-neon hover:text-brand-neon gap-1">
              Detailed Reports <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="h-72 w-full">
          {salesLoading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Loading chart data...
            </div>
          ) : sales && sales.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
                  }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
                          <p className="text-slate-400 font-medium mb-1">{item.date}</p>
                          <p className="text-emerald-400 font-black text-sm">
                            {formatLKR(item.revenue)}
                          </p>
                          <p className="text-slate-300 mt-1">{item.ordersCount} orders</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No sales data recorded yet in the last 30 days.
            </div>
          )}
        </div>
      </Card>

      {/* Two Column Grid: Low Stock Alert & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">Critical Low Stock Items</h3>
            </div>
            <Link href="/admin/stock">
              <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {stockLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))
            ) : lowStock && lowStock.length > 0 ? (
              lowStock.slice(0, 5).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">
                      Part: {item.partNumber || 'N/A'} • {item.brand || 'Generic'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <Badge variant={item.stockQty <= 2 ? 'danger' : 'warning'}>
                      {item.stockQty} left
                    </Badge>
                    <Link href={`/admin/products/${item.id}/edit`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                        Restock
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-200">
                  Stock levels are healthy
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No products are currently at or below low stock thresholds.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Top Selling Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-neon" />
              <h3 className="text-base font-bold text-white">Top Moving Products</h3>
            </div>
            <Link href="/admin/reports">
              <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                View Details
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {topLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))
            ) : topProducts && topProducts.length > 0 ? (
              topProducts.map((p: any, idx: number) => (
                <div
                  key={p.productId || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-black shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{p.productName}</p>
                      <p className="text-[10px] text-slate-400">
                        {p.brand || 'Generic'} • {p.currentStock} in stock
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-xs font-black text-brand-neon">
                      {p.unitsSold} units
                    </span>
                    <p className="text-[10px] text-slate-400">Sold</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
                <ShoppingBag className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-200">
                  No sales recorded yet
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Top selling products will appear here once orders are confirmed.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
