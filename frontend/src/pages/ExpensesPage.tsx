import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Modal } from '../components/Modal';
import { Receipt, Plus, Search, Trash2, Calendar, Tag } from 'lucide-react';

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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-softgrey-border shadow-sm">
        <div>
          <h1 className="text-xl font-black text-navy flex items-center gap-2">
            <Receipt className="w-5 h-5 text-coral" />
            <span>{t('nav.expenses')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track daily operating shop costs (Rent, Salaries, Power, Transport)
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-coral hover:bg-coral-hover text-white text-xs font-bold rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Expense</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-navy text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-300 font-medium">Total Filtered Expenses</span>
          <div className="text-2xl font-black text-coral mt-0.5">{formatCurrency(totalAmount)}</div>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-navy-light text-white text-xs rounded-xl border border-navy-muted font-semibold focus:outline-none"
        >
          <option value="All">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-softgrey-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-pearl text-slate-600 font-bold border-b border-softgrey-border">
                <th className="p-3.5">Expense Title & Date</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Payment Mode</th>
                <th className="p-3.5">Recipient / Note</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-softgrey-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Loading expenses...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No expenses recorded for this filter</td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-pearl/50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-navy text-sm">{exp.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(exp.date)}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">{exp.paymentMethod}</td>
                    <td className="p-3.5 text-slate-500">{exp.recipient || exp.notes || '-'}</td>
                    <td className="p-3.5 text-right font-black text-navy text-sm">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          if (confirm('Delete this expense?')) {
                            deleteExpenseMutation.mutate(exp._id);
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-coral transition"
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

      {/* Add Expense Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Record Business Expense" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Expense Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
              placeholder="e.g. October Shop Rent, Electricity Bill"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-semibold"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Amount (₹) *</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-black text-coral text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-semibold"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Paid To / Recipient</label>
            <input
              type="text"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
              placeholder="e.g. Landlord, Electric Company"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-softgrey-border">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-softgrey hover:bg-softgrey-border text-navy font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addExpenseMutation.isPending}
              className="px-5 py-2 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl shadow"
            >
              Record Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
