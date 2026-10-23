'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  Trash2,
  Filter,
  DollarSign,
  Calendar,
  Building,
  Zap,
  Users,
  Megaphone,
  Truck,
  Package,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
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

const EXPENSE_TYPES = [
  { value: 'RENT', label: 'Rent & Lease', icon: Building },
  { value: 'UTILITY', label: 'Utilities (Electricity, Water, Internet)', icon: Zap },
  { value: 'SALARY', label: 'Staff Salaries & Wages', icon: Users },
  { value: 'MARKETING', label: 'Marketing & Advertising', icon: Megaphone },
  { value: 'SHIPPING', label: 'Courier & Packaging Supplies', icon: Truck },
  { value: 'INVENTORY', label: 'Inventory Restock & Freight', icon: Package },
  { value: 'OTHER', label: 'Other Operational Expenses', icon: MoreHorizontal },
];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const { isAdmin } = useAuth();

  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Add Expense Dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expenseType, setExpenseType] = useState('UTILITY');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Delete Confirm Dialog
  const [expenseToDelete, setExpenseToDelete] = useState<any | null>(null);

  // Fetch Expenses
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['admin-expenses', { page, limit, type }],
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set('page', String(page));
      qs.set('limit', String(limit));
      if (type !== 'all') qs.set('type', type);
      return apiClient<any>(`/api/v1/admin/expenses?${qs.toString()}`);
    },
  });

  const expenses: any[] = Array.isArray(expensesData)
    ? expensesData
    : Array.isArray(expensesData?.data)
    ? expensesData.data
    : [];
  const pagination = expensesData?.pagination || { page: 1, totalPages: 1, total: expenses.length };

  // Calculate sum for loaded list
  const totalLoadedAmount = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient('/api/v1/admin/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      success('Expense record created successfully');
      setIsAddOpen(false);
      setAmount('');
      setNote('');
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to record expense');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/admin/expenses/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      success('Expense record deleted');
      setExpenseToDelete(null);
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to delete expense');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toastError('Please enter a valid expense amount');
      return;
    }

    createMutation.mutate({
      type: expenseType,
      amount: Number(amount),
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      note: note.trim() || undefined,
    });
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'RENT':
        return <Badge variant="info">Rent</Badge>;
      case 'UTILITY':
        return <Badge variant="warning">Utility</Badge>;
      case 'SALARY':
        return <Badge variant="neon">Salary</Badge>;
      case 'MARKETING':
        return <Badge variant="success">Marketing</Badge>;
      case 'SHIPPING':
        return <Badge variant="default">Shipping</Badge>;
      case 'INVENTORY':
        return <Badge variant="info">Inventory</Badge>;
      default:
        return <Badge variant="outline">{cat}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-brand-neon" />
            Operating Expenses
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Log store overheads, utilities, salaries, and shipping costs to calculate accurate net profit.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="gap-2 font-bold shadow-lg shadow-brand-neon/20"
        >
          <Plus className="w-4 h-4" />
          Record Expense
        </Button>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Expenses Recorded
            </span>
            <h2 className="text-2xl font-black text-white mt-1">
              {pagination.total} records
            </h2>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Receipt className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Amount (This Page)
            </span>
            <h2 className="text-2xl font-black text-brand-neon font-mono mt-1">
              {formatLKR(totalLoadedAmount)}
            </h2>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon">
            <DollarSign className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Primary Categories
            </span>
            <p className="text-xs text-slate-300 font-semibold mt-1">
              Rent, Utilities, Staff Wages, Courier
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Building className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300">Category:</span>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
          >
            <option value="all">All Categories</option>
            {EXPENSE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {type !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setType('all')}
            className="text-xs text-slate-400 hover:text-white"
          >
            Clear Filter
          </Button>
        )}
      </Card>

      {/* Expenses Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Description / Note</th>
                <th className="p-3 text-right">Amount (LKR)</th>
                <th className="p-3">Logged By</th>
                {isAdmin && <th className="p-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-200">No expenses recorded</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Click "Record Expense" to add monthly overhead or operational bills.
                    </p>
                  </td>
                </tr>
              ) : (
                expenses.map((e: any) => (
                  <tr key={e.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-mono text-slate-300">{formatDate(e.date)}</td>
                    <td className="p-3">{getCategoryBadge(e.type)}</td>
                    <td className="p-3 text-slate-300 font-medium">{e.note || '—'}</td>
                    <td className="p-3 text-right font-mono font-bold text-white text-sm">
                      {formatLKR(e.amount)}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {e.createdBy?.name || 'Administrator'}
                    </td>
                    {isAdmin && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setExpenseToDelete(e)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="gap-1 h-8"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
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

      {/* Add Expense Dialog */}
      <Dialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Record Operating Expense"
        description="Enter bill details, rent, salaries, or supplier packaging expenses."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Expense Category *
            </label>
            <select
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
            >
              {EXPENSE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Amount (LKR) *"
            type="number"
            step="0.01"
            min="1"
            required
            placeholder="e.g. 15000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />

          <Input
            label="Expense Date *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description / Supplier Note (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. CEB Electricity bill for Polgasowita store, receipt #4928"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending} className="font-bold">
              Save Expense
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {expenseToDelete && (
        <Dialog
          open={!!expenseToDelete}
          onOpenChange={(open) => !open && setExpenseToDelete(null)}
          title="Delete Expense Record"
          description={`Are you sure you want to delete this ${expenseToDelete.type} expense of ${formatLKR(
            expenseToDelete.amount
          )}? This will recalculate net profit figures.`}
        >
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpenseToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(expenseToDelete.id)}
              loading={deleteMutation.isPending}
            >
              Delete Expense
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
