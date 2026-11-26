import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Modal } from '../components/Modal';
import { Receipt, Plus, Trash2 } from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'RENT',
  'ELECTRICITY',
  'SALARY',
  'TRANSPORTATION',
  'MAINTENANCE',
  'PACKAGING',
  'INTERNET',
  'MARKETING',
  'MISCELLANEOUS'
];

export const ExpensesPage: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'MISCELLANEOUS',
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    recipient: '',
    notes: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', categoryFilter],
    queryFn: () => api.get(`/expenses?category=${encodeURIComponent(categoryFilter)}`)
  });

  const expenses: any[] = data?.data?.expenses || [];
  const totalAmount: number = data?.data?.totalAmount || 0;

  const addExpenseMutation = useMutation({
    mutationFn: (payload: any) => api.post('/expenses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      setIsAddModalOpen(false);
      setFormData({
        category: 'MISCELLANEOUS',
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        recipient: '',
        notes: ''
      });
    },
    onError: (err: any) => alert(`Failed to record expense: ${err.message}`)
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    addExpenseMutation.mutate({
      ...formData,
      amount: amt
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-xl border border-borderline shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DC4C4C]/10 text-[#DC4C4C] border border-[#DC4C4C]/20">
              <Receipt className="w-3.5 h-3.5" />
              Cash Outflow
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#142D4E] dark:text-white tracking-tight">
            {t('nav.expenses')}
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            Track daily operating shop costs (Rent, Salaries, Power, Transport)
          </p>
        </div>

        {/* Primary CTA (Amber) */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Expense</span>
        </button>
      </div>

      {/* Summary Strip & Category Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-xl border border-borderline shadow-card">
          <span className="text-[11px] font-bold text-content-secondary uppercase tracking-wider block">
            Total Filtered Expenses
          </span>
          <div className="text-2xl font-extrabold text-[#DC4C4C] mt-1">
            {formatCurrency(totalAmount)}
          </div>
          <span className="text-[11px] text-content-secondary block mt-1">
            {expenses.length} expense records found
          </span>
        </div>

        <div className="md:col-span-2 bg-surface p-5 rounded-xl border border-borderline shadow-card flex flex-col justify-center">
          <span className="text-[11px] font-bold text-content-secondary uppercase tracking-wider block mb-2">
            Filter by Expense Category
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoryFilter('All')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                categoryFilter === 'All'
                  ? 'bg-[#256D85] text-white shadow-sm'
                  : 'bg-[#F5F7FA] dark:bg-slate-800 text-content-secondary hover:text-content-primary'
              }`}
            >
              All Categories
            </button>
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[#256D85] text-white shadow-sm'
                    : 'bg-[#F5F7FA] dark:bg-slate-800 text-content-secondary hover:text-content-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-surface rounded-xl border border-borderline shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-content-secondary font-bold border-b border-borderline">
                <th className="p-4">Expense Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Date</th>
                <th className="p-4">Payment Mode</th>
                <th className="p-4 text-right">Amount (₹)</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderline">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-content-muted">Loading expenses...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-content-muted">No expenses recorded for this category</td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-content-primary">
                      <div>{exp.title}</div>
                      {exp.recipient && <div className="text-[11px] text-content-secondary">Paid to: {exp.recipient}</div>}
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F7FA] dark:bg-slate-800 text-content-secondary border border-borderline">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 text-content-secondary">{formatDate(exp.date)}</td>
                    <td className="p-4 text-content-secondary font-medium">{exp.paymentMethod}</td>
                    <td className="p-4 text-right font-extrabold text-[#DC4C4C] text-sm">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Delete expense "${exp.title}"?`)) {
                            deleteExpenseMutation.mutate(exp._id);
                          }
                        }}
                        className="p-1.5 text-content-muted hover:text-[#DC4C4C] transition-colors rounded"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Record Business Expense" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-content-secondary block mb-1">Expense Title / Description *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="vf-input"
              placeholder="e.g. October Shop Rent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-content-secondary block mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="vf-input"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">Amount (₹) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="vf-input font-bold"
                placeholder="₹"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-content-secondary block mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="vf-input"
              />
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="vf-input"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Paid To (Vendor / Person)</label>
            <input
              type="text"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              className="vf-input"
              placeholder="e.g. Landlord, Electric Company"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-borderline">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="vf-btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addExpenseMutation.isPending}
              className="vf-btn-primary"
            >
              Record Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
