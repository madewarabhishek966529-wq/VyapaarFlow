import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { ShieldCheck, Store, Users, IndianRupee, Activity, Search } from 'lucide-react';

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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-navy text-white p-6 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-coral" />
            <span>VyapaarFlow Super Admin Control Center</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Platform governance, multi-tenant monitoring, and SaaS subscription administration
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total Stores Onboarded</span>
          <div className="text-2xl font-black text-navy mt-1">{stats.totalBusinesses || 0}</div>
          <span className="text-[11px] text-slate-500 block mt-1">Registered SMB shops</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total Registered Users</span>
          <div className="text-2xl font-black text-navy mt-1">{stats.totalUsers || 0}</div>
          <span className="text-[11px] text-slate-500 block mt-1">Shopkeepers & staff</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total Platform GMV</span>
          <div className="text-2xl font-black text-success mt-1">
            {formatCurrency(stats.totalPlatformSales || 0)}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Total billing transactions value</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Platform Invoices</span>
          <div className="text-2xl font-black text-coral mt-1">{stats.totalTransactions || 0}</div>
          <span className="text-[11px] text-slate-500 block mt-1">Bills processed across Bharat</span>
        </div>
      </div>

      {/* Businesses Directory */}
      <div className="bg-white rounded-2xl border border-softgrey-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-softgrey-border flex justify-between items-center">
          <h2 className="font-bold text-sm text-navy">Registered Business Tenants</h2>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search stores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-pearl border border-softgrey-border rounded-xl text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-pearl text-slate-600 font-bold border-b border-softgrey-border">
                <th className="p-3.5">Business Name & Owner</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">GSTIN</th>
                <th className="p-3.5 text-center">Subscription Plan</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-softgrey-border">
              {businesses.map((b) => (
                <tr key={b._id} className="hover:bg-pearl/50 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-navy text-sm">{b.name}</div>
                    <div className="text-[11px] text-slate-500">{b.ownerName} • {b.mobile}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                      {b.category}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 font-medium">
                    {b.city}, {b.state}
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 font-semibold">{b.gstin || '-'}</td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        b.subscription?.plan === 'BUSINESS'
                          ? 'bg-purple-100 text-purple-800'
                          : b.subscription?.plan === 'PRO'
                          ? 'bg-coral/15 text-coral'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b.subscription?.plan || 'PRO'}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <select
                      value={b.subscription?.plan || 'PRO'}
                      onChange={(e) => updateSubMutation.mutate({ id: b._id, plan: e.target.value })}
                      className="px-2 py-1 bg-pearl border border-softgrey-border rounded-lg text-xs font-semibold"
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO (₹199)</option>
                      <option value="BUSINESS">BUSINESS (₹499)</option>
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
