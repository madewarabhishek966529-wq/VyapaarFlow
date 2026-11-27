import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sales' | 'pnl' | 'tax'>('sales');

  // Fetch Sales Report
  const { data: salesData } = useQuery({
    queryKey: ['report-sales'],
    queryFn: () => api.get('/reports/sales')
  });

  // Fetch Profit & Loss
  const { data: pnlData } = useQuery({
    queryKey: ['report-pnl'],
    queryFn: () => api.get('/reports/profit-loss')
  });

  // Fetch GST Tax Summary
  const { data: taxData } = useQuery({
    queryKey: ['report-tax'],
    queryFn: () => api.get('/reports/tax-summary')
  });

  const salesReport = salesData?.data || {};
  const pnlReport = pnlData?.data || {};
  const taxSlabs: any[] = taxData?.data || [];

  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem('vyapaarflow_token');
      const businessId = localStorage.getItem('vyapaarflow_business_id');
      const baseUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '/api';
      const res = await fetch(`${baseUrl}/reports/export-sales-csv`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(businessId ? { 'x-business-id': businessId } : {})
        }
      });
      if (!res.ok) {
        throw new Error('Failed to export CSV');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'VyapaarFlow_Sales.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Could not export CSV');
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-xl border border-borderline shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#256D85]/10 text-[#256D85] dark:text-[#368AA5] border border-[#256D85]/20">
              <BarChart3 className="w-3.5 h-3.5" />
              Financial Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#142D4E] dark:text-white tracking-tight">
            {t('nav.reports')}
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            Financial reconciliation, Profit & Loss, GST breakdowns and CSV exports
          </p>
        </div>

        {/* Secondary Action: Export CSV */}
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 border border-borderline text-content-primary text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#256D85]" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-borderline pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'sales'
              ? 'bg-[#256D85] text-white shadow-sm'
              : 'bg-surface text-content-secondary hover:text-content-primary border border-borderline'
          }`}
        >
          Daily Sales Report
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'pnl'
              ? 'bg-[#256D85] text-white shadow-sm'
              : 'bg-surface text-content-secondary hover:text-content-primary border border-borderline'
          }`}
        >
          Profit & Loss (P&L)
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'tax'
              ? 'bg-[#256D85] text-white shadow-sm'
              : 'bg-surface text-content-secondary hover:text-content-primary border border-borderline'
          }`}
        >
          GST Tax Summary
        </button>
      </div>

      {/* TAB 1: Sales Report */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface p-5 rounded-xl border border-borderline shadow-card">
              <span className="text-[11px] font-bold text-content-secondary uppercase block">Period Total Sales</span>
              <div className="text-2xl font-extrabold text-[#142D4E] dark:text-white mt-1">
                {formatCurrency(salesReport.totals?.totalSales || 0)}
              </div>
            </div>
            <div className="bg-surface p-5 rounded-xl border border-borderline shadow-card">
              <span className="text-[11px] font-bold text-content-secondary uppercase block">Cash Collections</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {formatCurrency(salesReport.totals?.cashSales || 0)}
              </div>
            </div>
            <div className="bg-surface p-5 rounded-xl border border-borderline shadow-card">
              <span className="text-[11px] font-bold text-content-secondary uppercase block">UPI Collections</span>
              <div className="text-2xl font-extrabold text-[#256D85] dark:text-[#368AA5] mt-1">
                {formatCurrency(salesReport.totals?.upiSales || 0)}
              </div>
            </div>
            <div className="bg-surface p-5 rounded-xl border border-borderline shadow-card">
              <span className="text-[11px] font-bold text-content-secondary uppercase block">Udhaar Credit Given</span>
              <div className="text-2xl font-extrabold text-[#D97706] mt-1">
                {formatCurrency(salesReport.totals?.udhaarSales || 0)}
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-borderline shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-content-secondary font-bold border-b border-borderline">
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Invoices</th>
                    <th className="p-4 text-right">Cash</th>
                    <th className="p-4 text-right">UPI</th>
                    <th className="p-4 text-right">Udhaar</th>
                    <th className="p-4 text-right">Day Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderline">
                  {(salesReport.periodData || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-content-muted">
                        No sales recorded for the selected period
                      </td>
                    </tr>
                  ) : (
                    (salesReport.periodData || []).map((row: any) => (
                      <tr key={row._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-4 font-bold text-content-primary">{row._id}</td>
                        <td className="p-4 text-center font-semibold text-content-secondary">{row.invoiceCount}</td>
                        <td className="p-4 text-right text-emerald-600 font-semibold">{formatCurrency(row.cashSales)}</td>
                        <td className="p-4 text-right text-[#256D85] font-semibold">{formatCurrency(row.upiSales)}</td>
                        <td className="p-4 text-right text-[#D97706] font-semibold">{formatCurrency(row.udhaarSales)}</td>
                        <td className="p-4 text-right font-extrabold text-content-primary text-sm">{formatCurrency(row.totalSales)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Profit & Loss */}
      {activeTab === 'pnl' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface p-6 rounded-xl border border-borderline shadow-card space-y-4">
            <h3 className="font-bold text-base text-[#142D4E] dark:text-white border-b border-borderline pb-3">
              Income Statement (MTD)
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-borderline text-content-secondary">
                <span>(+) Gross Sales Revenue</span>
                <span className="font-bold text-content-primary text-sm">{formatCurrency(pnlReport.totalRevenue || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-borderline text-[#DC4C4C]">
                <span>(-) Cost of Goods Sold (COGS)</span>
                <span className="font-bold text-sm">-{formatCurrency(pnlReport.totalCogs || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-borderline font-bold text-[#142D4E] dark:text-white text-sm">
                <span>Estimated Gross Profit</span>
                <span className="text-emerald-600">{formatCurrency(pnlReport.grossProfit || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-borderline text-[#DC4C4C]">
                <span>(-) Operating Expenses</span>
                <span className="font-bold text-sm">-{formatCurrency(pnlReport.totalExpenses || 0)}</span>
              </div>
              <div className="flex justify-between py-3 font-extrabold text-base text-[#142D4E] dark:text-white bg-[#F5F7FA] dark:bg-slate-800 p-3 rounded-lg">
                <span>Net Profit / (Loss)</span>
                <span className={(pnlReport.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-[#DC4C4C]'}>
                  {formatCurrency(pnlReport.netProfit || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-borderline shadow-card space-y-4">
            <h3 className="font-bold text-base text-[#142D4E] dark:text-white border-b border-borderline pb-3">
              Profit Margin Health
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#F5F7FA] dark:bg-slate-800 rounded-lg text-center">
                <span className="text-xs text-content-secondary font-bold uppercase block">Gross Margin</span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                  {pnlReport.totalRevenue ? ((pnlReport.grossProfit / pnlReport.totalRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="p-4 bg-[#F5F7FA] dark:bg-slate-800 rounded-lg text-center">
                <span className="text-xs text-content-secondary font-bold uppercase block">Net Margin</span>
                <span className="text-2xl font-extrabold text-[#256D85] dark:text-[#368AA5] mt-1 block">
                  {pnlReport.totalRevenue ? ((pnlReport.netProfit / pnlReport.totalRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GST Tax Slabs */}
      {activeTab === 'tax' && (
        <div className="bg-surface rounded-xl border border-borderline shadow-card overflow-hidden">
          <div className="p-4 border-b border-borderline">
            <h3 className="font-bold text-sm text-[#142D4E] dark:text-white">GST Slab Tax Liability Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-content-secondary font-bold border-b border-borderline">
                  <th className="p-4">Tax Slab Rate</th>
                  <th className="p-4 text-right">Taxable Turnover</th>
                  <th className="p-4 text-right">CGST</th>
                  <th className="p-4 text-right">SGST</th>
                  <th className="p-4 text-right">Total Tax Liability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderline">
                {taxSlabs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-content-muted">No tax data available for selected period</td>
                  </tr>
                ) : (
                  taxSlabs.map((slab) => (
                    <tr key={slab.rate} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-4 font-bold text-content-primary">{slab.rate}% GST</td>
                      <td className="p-4 text-right font-medium text-content-primary">{formatCurrency(slab.taxableAmount)}</td>
                      <td className="p-4 text-right text-content-secondary">{formatCurrency(slab.cgst)}</td>
                      <td className="p-4 text-right text-content-secondary">{formatCurrency(slab.sgst)}</td>
                      <td className="p-4 text-right font-extrabold text-[#142D4E] dark:text-white text-sm">{formatCurrency(slab.totalTax)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
