import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../lib/utils';
import { Modal } from '../components/Modal';
import { Users, Plus, Search, Phone, MapPin } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    creditLimit: 10000,
    notes: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get(`/customers?search=${encodeURIComponent(search)}`)
  });

  const customers: any[] = data?.data?.customers || [];

  const addCustomerMutation = useMutation({
    mutationFn: (payload: any) => api.post('/customers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddModalOpen(false);
      setFormData({ name: '', mobile: '', email: '', address: '', creditLimit: 10000, notes: '' });
    },
    onError: (err: any) => alert(`Failed to add customer: ${err.message}`)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomerMutation.mutate({
      ...formData,
      creditLimit: parseFloat(formData.creditLimit as any) || 10000
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-xl border border-borderline shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#256D85]/10 text-[#256D85] dark:text-[#368AA5] border border-[#256D85]/20">
              <Users className="w-3.5 h-3.5" />
              Customer CRM
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#142D4E] dark:text-white tracking-tight">
            {t('nav.customers')}
          </h1>
          <p className="text-xs text-content-secondary mt-1">Manage customer directory, purchases, and contact details</p>
        </div>

        {/* Primary CTA (Amber) */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-surface rounded-xl border border-borderline shadow-card overflow-hidden">
        <div className="p-4 border-b border-borderline">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, mobile, customer code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F5F7FA] dark:bg-slate-800 border border-borderline rounded-lg text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-[#256D85]/30 focus:border-[#256D85]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-content-secondary font-bold border-b border-borderline">
                <th className="p-4">Customer Name & Code</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4 text-right">Total Purchases</th>
                <th className="p-4 text-right">Outstanding Udhaar</th>
                <th className="p-4 text-center">Credit Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderline">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-content-muted">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-content-muted">No customers registered yet</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-content-primary text-sm">{c.name}</div>
                      <div className="text-[11px] text-content-secondary font-mono mt-0.5">{c.customerCode}</div>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <div className="font-semibold text-content-primary flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-content-muted" />
                        <span>{c.mobile}</span>
                      </div>
                      {c.address && (
                        <div className="text-[11px] text-content-secondary flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-content-muted" />
                          <span>{c.address}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right font-semibold text-content-primary">
                      {formatCurrency(c.totalPurchases)}
                    </td>
                    <td className="p-4 text-right font-extrabold text-sm">
                      <span className={c.currentBalance > 0 ? 'text-[#D97706]' : 'text-content-muted'}>
                        {formatCurrency(c.currentBalance)}
                      </span>
                    </td>
                    <td className="p-4 text-center text-content-secondary font-medium">
                      {formatCurrency(c.creditLimit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Customer" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-content-secondary block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="vf-input"
              placeholder="e.g. Amit Sharma"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">10-Digit Mobile Number *</label>
            <input
              type="tel"
              required
              pattern="[6-9][0-9]{9}"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="vf-input font-mono"
              placeholder="e.g. 9822012345"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="vf-input"
              placeholder="Street / Flat / Colony"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Udhaar Credit Limit (₹)</label>
            <input
              type="number"
              min="0"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value as any })}
              className="vf-input font-bold"
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
              disabled={addCustomerMutation.isPending}
              className="vf-btn-primary"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
