import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Modal } from '../components/Modal';
import { Users, Plus, Search, Phone, Mail, MapPin } from 'lucide-react';

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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-softgrey-border shadow-sm">
        <div>
          <h1 className="text-xl font-black text-navy flex items-center gap-2">
            <Users className="w-5 h-5 text-coral" />
            <span>{t('nav.customers')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage customer directory, purchases, and contact details</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-coral hover:bg-coral-hover text-white text-xs font-bold rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-softgrey-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-softgrey-border">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, mobile, customer code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-pearl border border-softgrey-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-pearl text-slate-600 font-bold border-b border-softgrey-border">
                <th className="p-3.5">Customer Name & Code</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5 text-right">Total Purchases</th>
                <th className="p-3.5 text-right">Outstanding Udhaar</th>
                <th className="p-3.5 text-center">Credit Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-softgrey-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No customers registered yet</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-pearl/50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-navy text-sm">{c.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.customerCode}</div>
                    </td>
                    <td className="p-3.5 space-y-0.5">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.mobile}</span>
                      </div>
                      {c.address && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{c.address}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-semibold text-slate-800">
                      {formatCurrency(c.totalPurchases)}
                    </td>
                    <td className="p-3.5 text-right font-black text-sm">
                      <span className={c.currentBalance > 0 ? 'text-coral' : 'text-slate-400'}>
                        {formatCurrency(c.currentBalance)}
                      </span>
                    </td>
                    <td className="p-3.5 text-center text-slate-500 font-medium">
                      {formatCurrency(c.creditLimit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Customer" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
              placeholder="e.g. Amit Sharma"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">10-Digit Mobile Number *</label>
            <input
              type="tel"
              required
              pattern="[6-9][0-9]{9}"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono"
              placeholder="e.g. 9822012345"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
              placeholder="Street / Flat / Colony"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Udhaar Credit Limit (₹)</label>
            <input
              type="number"
              min="0"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value as any })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-bold"
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
              disabled={addCustomerMutation.isPending}
              className="px-5 py-2 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl shadow"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
