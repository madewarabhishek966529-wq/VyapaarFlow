import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { ShieldCheck, Search } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats')
  });

  const { data: busData } = useQuery({
    queryKey: ['admin-businesses', search],
    queryFn: () => api.get(`/admin/businesses?search=${encodeURIComponent(search)}`)
  });

  const stats = statsData?.data || {};
  const businesses: any[] = busData?.data || [];

  const updateSubMutation = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) =>
      api.put(`/admin/business/${id}/subscription`, { plan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      alert('Subscription plan updated!');
    }
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-[#142D4E] text-white p-6 rounded-xl shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#D97706]" />
            <span>VyapaarFlow Super Admin Control Center</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Platform governance, multi-tenant monitoring, and SaaS subscription administration
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-borderline shadow-card">
          <span className="text-xs font-semibold text-content-secondary block">Total Stores Onboarded</span>
          <div className="text-2xl font-extrabold text-[#142D4E] dark:text-white mt-1">{stats.totalBusinesses || 0}</div>
          <span className="text-[11px] text-content-secondary block mt-1">Registered SMB shops</span>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-borderline shadow-card">
          <span className="text-xs font-semibold text-content-secondary block">Total Registered Users</span>
          <div className="text-2xl font-extrabold text-[#142D4E] dark:text-white mt-1">{stats.totalUsers || 0}</div>
          <span className="text-[11px] text-content-secondary block mt-1">Shopkeepers & staff</span>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-borderline shadow-card">
          <span className="text-xs font-semibold text-content-secondary block">Total Platform GMV</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {formatCurrency(stats.totalPlatformSales || 0)}
          </div>
          <span className="text-[11px] text-content-secondary block mt-1">Total billing transactions value</span>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-borderline shadow-card">
          <span className="text-xs font-semibold text-content-secondary block">Platform Invoices</span>
          <div className="text-2xl font-extrabold text-[#D97706] mt-1">{stats.totalTransactions || 0}</div>
          <span className="text-[11px] text-content-secondary block mt-1">Bills processed across Bharat</span>
        </div>
      </div>

      {/* Businesses Directory */}
      <div className="bg-surface rounded-xl border border-borderline shadow-card overflow-hidden">
        <div className="p-4 border-b border-borderline flex justify-between items-center">
          <h2 className="font-bold text-sm text-[#142D4E] dark:text-white">Registered Business Tenants</h2>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search stores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7FA] dark:bg-slate-800 border border-borderline rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#256D85]/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-content-secondary font-bold border-b border-borderline">
                <th className="p-3.5">Business Name & Owner</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">GSTIN</th>
                <th className="p-3.5">Plan</th>
                <th className="p-3.5 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderline">
              {businesses.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-content-primary">
                    <div>{b.name}</div>
                    <div className="text-[11px] text-content-secondary font-normal">{b.ownerName} • {b.mobile}</div>
                  </td>
                  <td className="p-3.5 text-content-secondary">{b.category}</td>
                  <td className="p-3.5 text-content-secondary">{b.city}, {b.state}</td>
                  <td className="p-3.5 font-mono text-content-secondary">{b.gstin || '-'}</td>
                  <td className="p-3.5">
                    <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-[#256D85]/10 text-[#256D85] dark:text-[#368AA5]">
                      {b.subscription?.plan}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <select
                      value={b.subscription?.plan}
                      onChange={(e) => updateSubMutation.mutate({ id: b._id, plan: e.target.value })}
                      className="px-2 py-1 bg-surface border border-borderline rounded text-xs font-semibold text-content-primary"
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                      <option value="BUSINESS">BUSINESS</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
