'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Download,
  Printer,
  DollarSign,
  Package,
  Receipt,
  MapPin,
  Lock,
  Users,
  Rocket,
  ShieldAlert,
  Landmark,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Table as TableIcon,
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
import { Skeleton } from '@/components/ui/skeleton';

type ReportPeriod = 'daily' | 'weekly' | 'this_month' | 'monthly' | 'all';
type BreakdownGranularity = 'daily' | 'weekly' | 'monthly';

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('this_month');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [granularity, setGranularity] = useState<BreakdownGranularity>('daily');

  const queryParams = selectedMonth
    ? `month=${encodeURIComponent(selectedMonth)}`
    : `period=${period}`;

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['admin-reports', period, selectedMonth],
    queryFn: () => apiClient<any>(`/api/v1/admin/analytics/reports?${queryParams}`),
  });

  const summary = reportData?.summary;
  const allocation = summary?.allocation || {
    distributableProfit: 0,
    deficit: 0,
    reinvest50: 0,
    salaryTotal30: 0,
    pathumSalary15: 0,
    sachinSalary15: 0,
    reserve10: 0,
    taxBills10: 0,
  };
  const hideProfit = Boolean(reportData?.hideProfit);
  const dailyTimeline = reportData?.dailyTimeline || reportData?.timeline || [];
  const weeklyTimeline = reportData?.weeklyTimeline || [];
  const monthlyTimeline = reportData?.monthlyTimeline || [];
  const expensesByCategory = reportData?.expensesByCategory || [];
  const topProducts = reportData?.mostProfitableProducts || [];
  const districts = reportData?.ordersByDistrict || [];

  const activeTimeline =
    granularity === 'weekly'
      ? weeklyTimeline
      : granularity === 'monthly'
      ? monthlyTimeline
      : dailyTimeline;

  const periodLabel = selectedMonth
    ? `Month: ${selectedMonth}`
    : period === 'daily'
    ? 'Today (Daily)'
    : period === 'weekly'
    ? 'Last 7 Days (Weekly)'
    : period === 'this_month'
    ? 'This Calendar Month'
    : period === 'all'
    ? 'All-Time'
    : 'Last 30 Days';

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!summary) return;
    const rows = [
      ['ShiftLK Spares - Financial & Co-Founder Profit Allocation Report'],
      ['Period', periodLabel],
      ['Total Confirmed/Shipped/Delivered Orders', summary.totalOrders],
      ['Total Items Sold', summary.totalItemsSold],
      ['Merchandise Sales Revenue (LKR)', summary.revenue],
      ...(hideProfit
        ? []
        : [
            ['Cost of Goods Sold - COGS (LKR)', summary.cogs],
            ['Gross Profit (LKR)', summary.grossProfit],
            ['Gross Margin %', `${summary.grossMarginPercent}%`],
            ['Total Operating Expenses (LKR)', summary.totalExpenses],
            ['Net Profit / Shudda Labaya (LKR)', summary.netProfit],
            ['Net Margin %', `${summary.netMarginPercent}%`],
            [],
            ['--- 50 / 30 / 10 / 10 CO-FOUNDER PROFIT ALLOCATION ---', 'Amount (LKR)', 'Share %'],
            ['Reinvest (Stock, Marketing, Growth)', allocation.reinvest50, '50%'],
            ['Total Partner Salaries (Both Co-Founders)', allocation.salaryTotal30, '30%'],
            ['  -> Pathum Theekshana (Salary Share)', allocation.pathumSalary15, '15%'],
            ['  -> Sachin Jayangana (Salary Share)', allocation.sachinSalary15, '15%'],
            ['Reserve / Emergency Fund', allocation.reserve10, '10%'],
            ['Tax / Bills Reserve', allocation.taxBills10, '10%'],
          ]),
      [],
      [
        `--- ${granularity.toUpperCase()} BREAKDOWN ---`,
        'Orders',
        'Sales Revenue',
        ...(hideProfit
          ? []
          : [
              'COGS',
              'Gross Profit',
              'Expenses',
              'Net Profit',
              'Reinvest (50%)',
              'Pathum Salary (15%)',
              'Sachin Salary (15%)',
              'Emergency Reserve (10%)',
              'Tax/Bills Reserve (10%)',
            ]),
      ],
      ...activeTimeline.map((row: any) => [
        row.label || row.date,
        row.ordersCount,
        row.revenue,
        ...(hideProfit
          ? []
          : [
              row.cogs,
              row.grossProfit,
              row.expenses,
              row.netProfit,
              row.allocation?.reinvest50 ?? 0,
              row.allocation?.pathumSalary15 ?? 0,
              row.allocation?.sachinSalary15 ?? 0,
              row.allocation?.reserve10 ?? 0,
              row.allocation?.taxBills10 ?? 0,
            ]),
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `ShiftLK_Profit_Allocation_${selectedMonth || period}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-brand-neon" />
            Sales, Net Profit & Co-Founder Split
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Daily, weekly & monthly sales, net profit after all expenses, and 50/30/10/10 partner salary allocation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector Tabs */}
          <div className="flex flex-wrap items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            {[
              { id: 'daily', label: 'Daily (Today)' },
              { id: 'weekly', label: 'Weekly (7D)' },
              { id: 'this_month', label: 'This Month' },
              { id: 'monthly', label: 'Last 30 Days' },
              { id: 'all', label: 'All-Time' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedMonth('');
                  setPeriod(tab.id as ReportPeriod);
                  if (tab.id === 'daily' || tab.id === 'weekly') setGranularity('daily');
                  if (tab.id === 'all') setGranularity('monthly');
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                  !selectedMonth && period === tab.id
                    ? 'bg-brand-neon text-black'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Specific Calendar Month Picker */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-brand-neon shrink-0" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              title="Filter by specific calendar month"
            />
            {selectedMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonth('')}
                className="text-[10px] text-slate-400 hover:text-white ml-1"
              >
                Clear
              </button>
            )}
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

      {/* KPI Overview Grid (Sales -> COGS -> Gross Profit -> Net Profit After Expenses) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Merchandise Sales Revenue */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Sales Revenue ({periodLabel})
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
              {summary?.totalOrders ?? 0} confirmed orders • {summary?.totalItemsSold ?? 0} parts sold
            </p>
          </div>
        </Card>

        {/* 2. Cost of Goods Sold (COGS) */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Item Cost (COGS)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              {hideProfit ? <Lock className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : hideProfit ? (
              <span className="text-lg font-bold text-slate-500">Admin Only</span>
            ) : (
              <h2 className="text-2xl font-black text-slate-300 font-mono">
                - {formatLKR(summary?.cogs ?? 0)}
              </h2>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              {hideProfit ? 'Hidden for staff role' : 'Wholesale purchase cost of sold parts'}
            </p>
          </div>
        </Card>

        {/* 3. Gross Profit & Operating Expenses */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Gross Profit & Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon">
              {hideProfit ? <Lock className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : hideProfit ? (
              <span className="text-lg font-bold text-slate-500">Admin Only</span>
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
            <p className="text-[11px] text-rose-400 font-semibold mt-1">
              {hideProfit
                ? 'Hidden for staff role'
                : `Minus Operating Expenses: - ${formatLKR(summary?.totalExpenses ?? 0)}`}
            </p>
          </div>
        </Card>

        {/* 4. Net Profit (ශුද්ධ ලාභය) */}
        <Card className="p-5 flex flex-col justify-between border-emerald-500/40 bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              4. Net Profit (ශුද්ධ ලාභය)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              {hideProfit ? <Lock className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : hideProfit ? (
              <span className="text-lg font-bold text-slate-500">Admin Only</span>
            ) : (
              <div className="flex items-baseline gap-2">
                <h2
                  className={cn(
                    'text-2xl font-black',
                    (summary?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  )}
                >
                  {formatLKR(summary?.netProfit ?? 0)}
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  ({summary?.netMarginPercent ?? 0}%)
                </span>
              </div>
            )}
            <p className="text-[11px] text-slate-300 mt-1">
              {hideProfit
                ? 'Hidden for staff role'
                : 'Pure profit after COGS & all store expenses'}
            </p>
          </div>
        </Card>
      </div>

      {/* 50 / 30 / 10 / 10 Co-Founder Profit Allocation & Salary Split Section */}
      {!hideProfit && (
        <Card className="p-6 sm:p-7 border-brand-neon/30 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-neon/15 border border-brand-neon/30 text-brand-neon text-[10px] font-black uppercase tracking-wider mb-1.5">
                <Users className="w-3 h-3" />
                Co-Founder Profit Distribution ({periodLabel})
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                ශුද්ධ ලාභය බෙදී යන ආකාරය (50% / 30% / 10% / 10% Rule)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated from Net Profit ({formatLKR(summary?.netProfit ?? 0)}) after deducting item costs ({formatLKR(summary?.cogs ?? 0)}) and all expenses ({formatLKR(summary?.totalExpenses ?? 0)}).
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-right shrink-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Distributable Net Profit
              </div>
              <div className="text-xl font-black text-brand-neon font-mono">
                {formatLKR(allocation.distributableProfit)}
              </div>
            </div>
          </div>

          {/* Deficit Warning if Net Profit < 0 */}
          {allocation.deficit > 0 && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-700/50 flex items-center gap-3 text-xs text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-rose-300">
                  Net Deficit of {formatLKR(allocation.deficit)} in this period:
                </span>{' '}
                Operating expenses exceeded gross profit for the selected timeframe, so distributable partner salaries and reserves are Rs. 0 until net profit turns positive.
              </div>
            </div>
          )}

          {/* Visual Proportion Bar */}
          <div className="space-y-2">
            <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
              <div
                style={{ width: '50%' }}
                className="bg-brand-neon h-full"
                title="50% Reinvest (Stock, Marketing, Growth)"
              />
              <div
                style={{ width: '15%' }}
                className="bg-emerald-400 h-full border-l border-slate-950"
                title="15% Salary - Pathum Theekshana"
              />
              <div
                style={{ width: '15%' }}
                className="bg-cyan-400 h-full border-l border-slate-950"
                title="15% Salary - Sachin Jayangana"
              />
              <div
                style={{ width: '10%' }}
                className="bg-amber-400 h-full border-l border-slate-950"
                title="10% Reserve / Emergency Fund"
              />
              <div
                style={{ width: '10%' }}
                className="bg-purple-400 h-full border-l border-slate-950"
                title="10% Tax / Bills Reserve"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-neon inline-block" />
                50% Reinvest
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                15% Pathum Theekshana
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
                15% Sachin Jayangana
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                10% Emergency Reserve
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-400 inline-block" />
                10% Tax / Bills
              </span>
            </div>
          </div>

          {/* 4 Allocation Buckets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Bucket 1: 50% Reinvest */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-brand-neon/30 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-neon/20 text-brand-neon font-black text-xs">
                  50% Share
                </span>
                <Rocket className="w-5 h-5 text-brand-neon" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Reinvest (Stock, Marketing, Growth)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  අලුත් තොග, ප්‍රචාරණය සහ ව්‍යාපාර වර්ධනයට
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <div className="text-2xl font-black text-brand-neon font-mono">
                  {formatLKR(allocation.reinvest50)}
                </div>
              </div>
            </div>

            {/* Bucket 2: 30% Co-Founder Salaries (Pathum 15% + Sachin 15%) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 md:col-span-2 xl:col-span-1 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs">
                  30% Total (15% × 2)
                </span>
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Co-Founder Salaries (2 Partners)
                </h3>
                <div className="text-xl font-black text-white font-mono mt-0.5">
                  {formatLKR(allocation.salaryTotal30)}
                </div>
              </div>

              {/* Individual Partner Cards */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30">
                  <div>
                    <div className="text-xs font-bold text-white">Pathum Theekshana</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">
                      Co-Founder • 15% Net Profit
                    </div>
                  </div>
                  <div className="text-sm font-black text-emerald-400 font-mono">
                    {formatLKR(allocation.pathumSalary15)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30">
                  <div>
                    <div className="text-xs font-bold text-white">Sachin Jayangana</div>
                    <div className="text-[10px] text-cyan-400 font-semibold">
                      Co-Founder • 15% Net Profit
                    </div>
                  </div>
                  <div className="text-sm font-black text-cyan-400 font-mono">
                    {formatLKR(allocation.sachinSalary15)}
                  </div>
                </div>
              </div>
            </div>

            {/* Bucket 3: 10% Reserve / Emergency Fund */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs">
                  10% Share
                </span>
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Reserve / Emergency Fund
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  හදිසි අවශ්‍යතා සහ ආරක්ෂිත අරමුදල
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {formatLKR(allocation.reserve10)}
                </div>
              </div>
            </div>

            {/* Bucket 4: 10% Tax / Bills Reserve */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/30 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-black text-xs">
                  10% Share
                </span>
                <Landmark className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Tax / Bills Reserve
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  බදු, මාසික බිල්පත් සහ නීතිමය ගෙවීම් සඳහා
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <div className="text-2xl font-black text-purple-400 font-mono">
                  {formatLKR(allocation.taxBills10)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Interactive Financial Chart + Granularity Switcher (Daily / Weekly / Monthly) */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">
              Sales, Profit & Partner Salary Breakdown ({granularity.toUpperCase()})
            </h2>
            <p className="text-xs text-slate-400">
              Switch between Daily, Weekly, and Monthly views to inspect sales, expenses, net profit, and partner salaries.
            </p>
          </div>

          {/* Granularity Toggle: Daily | Weekly | Monthly */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 self-start">
            {(
              [
                { id: 'daily', label: 'Daily Breakdown' },
                { id: 'weekly', label: 'Weekly Breakdown' },
                { id: 'monthly', label: 'Monthly Breakdown' },
              ] as const
            ).map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGranularity(g.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                  granularity === g.id
                    ? 'bg-brand-neon text-black'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Loading report timeline...
            </div>
          ) : activeTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => {
                    const p = String(val).split('-');
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
                        <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[230px]">
                          <p className="text-slate-300 font-bold border-b border-slate-800 pb-1">
                            {item.label || item.date} ({item.ordersCount} orders)
                          </p>
                          <p className="text-white flex justify-between">
                            <span>Sales Revenue:</span>
                            <span className="font-mono font-bold">{formatLKR(item.revenue)}</span>
                          </p>
                          {!hideProfit && (
                            <>
                              <p className="text-slate-400 flex justify-between">
                                <span>Item Cost (COGS):</span>
                                <span className="font-mono">- {formatLKR(item.cogs)}</span>
                              </p>
                              <p className="text-brand-neon flex justify-between">
                                <span>Gross Profit:</span>
                                <span className="font-mono font-bold">{formatLKR(item.grossProfit)}</span>
                              </p>
                              <p className="text-rose-400 flex justify-between">
                                <span>Operating Expenses:</span>
                                <span className="font-mono">- {formatLKR(item.expenses)}</span>
                              </p>
                              <p className="text-emerald-400 font-black pt-1 border-t border-slate-800 flex justify-between">
                                <span>Net Profit:</span>
                                <span className="font-mono">{formatLKR(item.netProfit)}</span>
                              </p>
                              {item.allocation && (
                                <div className="pt-1.5 border-t border-slate-800/80 space-y-1 text-[11px]">
                                  <div className="flex justify-between text-brand-neon">
                                    <span>Reinvest (50%):</span>
                                    <span className="font-mono font-bold">
                                      {formatLKR(item.allocation.reinvest50)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-emerald-300">
                                    <span>Pathum Salary (15%):</span>
                                    <span className="font-mono font-bold">
                                      {formatLKR(item.allocation.pathumSalary15)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-cyan-300">
                                    <span>Sachin Salary (15%):</span>
                                    <span className="font-mono font-bold">
                                      {formatLKR(item.allocation.sachinSalary15)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-amber-300">
                                    <span>Emergency (10%):</span>
                                    <span className="font-mono">
                                      {formatLKR(item.allocation.reserve10)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-purple-300">
                                    <span>Tax/Bills (10%):</span>
                                    <span className="font-mono">
                                      {formatLKR(item.allocation.taxBills10)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Sales Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                {!hideProfit && (
                  <>
                    <Bar dataKey="grossProfit" name="Gross Profit" fill="#ccff00" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netProfit" name="Net Profit (ශුද්ධ ලාභය)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No orders or expense data for this selected timeframe.
            </div>
          )}
        </div>

        {/* Detailed Period Breakdown Table (Daily / Weekly / Monthly rows) */}
        {activeTimeline.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-brand-neon" />
              <span>
                {granularity === 'daily'
                  ? 'Daily Sales, Net Profit & Salary Split Table'
                  : granularity === 'weekly'
                  ? 'Weekly Sales, Net Profit & Salary Split Table'
                  : 'Monthly Sales, Net Profit & Salary Split Table'}
              </span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-3.5 py-3">Period</th>
                    <th className="px-3 py-3 text-right">Orders</th>
                    <th className="px-3.5 py-3 text-right">Sales</th>
                    {!hideProfit && (
                      <>
                        <th className="px-3.5 py-3 text-right">COGS</th>
                        <th className="px-3.5 py-3 text-right">Expenses</th>
                        <th className="px-3.5 py-3 text-right text-emerald-400">Net Profit</th>
                        <th className="px-3.5 py-3 text-right text-brand-neon">Reinvest (50%)</th>
                        <th className="px-3.5 py-3 text-right text-emerald-300">Pathum (15%)</th>
                        <th className="px-3.5 py-3 text-right text-cyan-300">Sachin (15%)</th>
                        <th className="px-3.5 py-3 text-right text-amber-300">Reserve (10%)</th>
                        <th className="px-3.5 py-3 text-right text-purple-300">Tax/Bills (10%)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {[...activeTimeline].reverse().map((row: any) => (
                    <tr key={row.date} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-3.5 py-2.5 font-sans font-bold text-white whitespace-nowrap">
                        {row.label || row.date}
                      </td>
                      <td className="px-3 py-2.5 text-right">{row.ordersCount}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-white">
                        {formatLKR(row.revenue)}
                      </td>
                      {!hideProfit && (
                        <>
                          <td className="px-3.5 py-2.5 text-right text-slate-400">
                            {formatLKR(row.cogs)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-rose-400">
                            {formatLKR(row.expenses)}
                          </td>
                          <td
                            className={cn(
                              'px-3.5 py-2.5 text-right font-black',
                              row.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            )}
                          >
                            {formatLKR(row.netProfit)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-brand-neon">
                            {formatLKR(row.allocation?.reinvest50 ?? 0)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-emerald-300">
                            {formatLKR(row.allocation?.pathumSalary15 ?? 0)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-cyan-300">
                            {formatLKR(row.allocation?.sachinSalary15 ?? 0)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-amber-300">
                            {formatLKR(row.allocation?.reserve10 ?? 0)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-purple-300">
                            {formatLKR(row.allocation?.taxBills10 ?? 0)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Three Column Grid: Expense Breakdown, Most Profitable Parts & District Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operating Expenses Deducted */}
        {!hideProfit && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-400" />
                Deducted Expenses
              </h2>
              <Link
                href="/admin/expenses"
                className="text-xs text-brand-neon hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Manage</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              All operational expenses deducted from Gross Profit in this period ({formatLKR(summary?.totalExpenses ?? 0)}).
            </p>

            <div className="space-y-3">
              {expensesByCategory.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No operating expenses recorded for this timeframe.
                </p>
              ) : (
                expensesByCategory.map((e: any) => (
                  <div
                    key={e.category}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">
                        {e.category} ({e.count})
                      </span>
                      <span className="font-mono font-bold text-rose-400">
                        {formatLKR(e.amount)} ({e.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, e.percent)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Most Profitable Products */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-neon" />
            {hideProfit ? 'Top Selling Products' : 'Top Profitable Products'}
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            {hideProfit
              ? 'Ranked by total units sold in this period.'
              : 'Ranked by total net cash profit generated in this period.'}
          </p>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No product data available yet.
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
                      {formatLKR(hideProfit ? p.revenue : p.profit)}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {hideProfit ? 'Total Revenue' : 'Gross Profit'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Orders by District */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-neon" />
            Sales by Sri Lankan District
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Regional distribution of confirmed orders across the 25 districts.
          </p>

          <div className="space-y-3">
            {districts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No district sales recorded in this period.
              </p>
            ) : (
              districts.slice(0, 8).map((d: any) => (
                <div
                  key={d.district}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{d.district}</p>
                    <p className="text-[10px] text-slate-400">{d.orderCount} orders</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {formatLKR(d.totalSpent)}
                    </span>
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
