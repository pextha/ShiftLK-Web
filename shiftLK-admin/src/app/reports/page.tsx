'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Download,
  Printer,
  Calendar,
  DollarSign,
  Package,
  ShoppingBag,
  Percent,
  Receipt,
  Layers,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { apiClient } from '@/lib/api-client';
import { formatLKR, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['admin-reports', period],
    queryFn: () => apiClient<any>(`/api/v1/admin/analytics/reports?period=${period}`),
  });

  const summary = reportData?.summary;
  const timeline = reportData?.timeline || [];
  const topProducts = reportData?.mostProfitableProducts || [];
  const districts = reportData?.ordersByDistrict || [];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!summary) return;
    const rows = [
      ['Metric', 'Value'],
      ['Period', period],
      ['Total Delivered Orders', summary.totalOrders],
      ['Total Items Sold', summary.totalItemsSold],
      ['Merchandise Revenue (LKR)', summary.revenue],
      ['Cost of Goods Sold (COGS)', summary.cogs],
      ['Gross Profit (LKR)', summary.grossProfit],
      ['Gross Margin %', `${summary.grossMarginPercent}%`],
      ['Total Operating Expenses (LKR)', summary.totalExpenses],
      ['Net Profit (LKR)', summary.netProfit],
      ['Net Margin %', `${summary.netMarginPercent}%`],
      [],
      ['Product Part Number', 'Product Name', 'Units Sold', 'Revenue', 'Cost', 'Profit'],
      ...topProducts.map((p: any) => [
        p.partNumber,
        `"${p.name.replace(/"/g, '""')}"`,
        p.unitsSold,
        p.revenue,
        p.cost,
        p.profit,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ShiftLK_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-brand-neon" />
            Financial & Profit Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Revenue, cost of goods sold, operating expenses, and net profit margins.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Period Selector Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setPeriod('daily')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                period === 'daily'
                  ? 'bg-brand-neon text-black'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                period === 'weekly'
                  ? 'bg-brand-neon text-black'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                period === 'monthly'
                  ? 'bg-brand-neon text-black'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Last 30 Days
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Merchandise Revenue */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Merchandise Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <h2 className="text-2xl font-black text-white">
                {formatLKR(summary?.revenue ?? 0)}
              </h2>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              From {summary?.totalOrders ?? 0} confirmed shipments
            </p>
          </div>
        </Card>

        {/* Cost of Goods Sold (COGS) */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cost of Goods (COGS)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <h2 className="text-2xl font-black text-slate-300 font-mono">
                {formatLKR(summary?.cogs ?? 0)}
              </h2>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Supplier purchase cost of sold items
            </p>
          </div>
        </Card>

        {/* Gross Profit & Margin */}
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
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-black text-brand-neon">
                  {formatLKR(summary?.grossProfit ?? 0)}
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  ({summary?.grossMarginPercent ?? 0}%)
                </span>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Revenue minus inventory cost</p>
          </div>
        </Card>

        {/* Net Profit (After Expenses) */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Net Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h2 className={cn('text-2xl font-black', (summary?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {formatLKR(summary?.netProfit ?? 0)}
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  ({summary?.netMarginPercent ?? 0}%)
                </span>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              After {formatLKR(summary?.totalExpenses ?? 0)} expenses
            </p>
          </div>
        </Card>
      </div>

      {/* Financial Comparison Chart */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-base font-bold text-white">Daily Financial Breakdown</h2>
          <p className="text-xs text-slate-400">
            Comparison of merchandise revenue, gross profit, and operational expenses over time.
          </p>
        </div>

        <div className="h-80 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Loading report timeline...
            </div>
          ) : timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => {
                    const p = val.split('-');
                    return p.length === 3 ? `${p[1]}/${p[2]}` : val;
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
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="text-slate-400 font-bold mb-1.5">{item.date}</p>
                          <p className="text-white">
                            Revenue: <span className="font-mono font-bold">{formatLKR(item.revenue)}</span>
                          </p>
                          <p className="text-brand-neon">
                            Gross Profit: <span className="font-mono font-bold">{formatLKR(item.grossProfit)}</span>
                          </p>
                          <p className="text-purple-400">
                            Expenses: <span className="font-mono font-bold">{formatLKR(item.expenses)}</span>
                          </p>
                          <p className="text-emerald-400 font-black pt-1 border-t border-slate-800">
                            Net Profit: {formatLKR(item.netProfit)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="grossProfit" name="Gross Profit" fill="#ccff00" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netProfit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No orders or expense data for this selected timeframe.
            </div>
          )}
        </div>
      </Card>

      {/* Two Column Grid: Most Profitable Parts & District Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Profitable Products */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-neon" />
            Top Profitable Products
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Ranked by total net cash profit generated in this period.
          </p>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No product profit data available yet.
              </p>
            ) : (
              topProducts.map((p: any, idx: number) => (
                <div
                  key={p.id || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {p.partNumber} • {p.unitsSold} units sold
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-xs font-mono font-black text-brand-neon">
                      {formatLKR(p.profit)}
                    </span>
                    <p className="text-[10px] text-slate-400">Total Profit</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* District Breakdown */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            Sales by Sri Lankan District
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Geographic volume across all 25 postal districts.
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {districts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No district sales data recorded yet.
              </p>
            ) : (
              districts.map((d: any) => (
                <div
                  key={d.district}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{d.district}</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {formatLKR(d.totalSpent)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{d.orderCount} {d.orderCount === 1 ? 'order' : 'orders'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
