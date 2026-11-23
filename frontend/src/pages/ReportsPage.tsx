import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Percent,
  Receipt,
  PieChart
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

  const handleExportCsv = () => {
    window.open('/api/reports/export-sales-csv', '_blank');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-softgrey-border shadow-sm">
        <div>
          <h1 className="text-xl font-black text-navy flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-coral" />
            <span>{t('nav.reports')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Financial reconciliation, Profit & Loss, GST breakdowns and CSV exports
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl shadow transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-coral" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-softgrey-border pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'sales' ? 'bg-navy text-white shadow' : 'bg-white text-slate-600 hover:bg-pearl'
          }`}
        >
          Daily Sales Report
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'pnl' ? 'bg-navy text-white shadow' : 'bg-white text-slate-600 hover:bg-pearl'
          }`}
        >
          Profit & Loss (P&L)
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'tax' ? 'bg-navy text-white shadow' : 'bg-white text-slate-600 hover:bg-pearl'
          }`}
        >
          GST Tax Summary
        </button>
      </div>

      {/* TAB 1: Sales Report */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm">
              <span className="text-xs text-slate-500 font-semibold block">Total Sales</span>
              <span className="text-xl font-black text-navy mt-1 block">
                {formatCurrency(salesReport.totals?.totalSales || 0)}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm">
              <span className="text-xs text-slate-500 font-semibold block">Cash Sales</span>
              <span className="text-xl font-black text-success mt-1 block">
                {formatCurrency(salesReport.totals?.cashSales || 0)}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm">
              <span className="text-xs text-slate-500 font-semibold block">UPI / QR Sales</span>
              <span className="text-xl font-black text-navy mt-1 block">
                {formatCurrency(salesReport.totals?.upiSales || 0)}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm">
              <span className="text-xs text-slate-500 font-semibold block">Udhaar (Credit Given)</span>
              <span className="text-xl font-black text-coral mt-1 block">
                {formatCurrency(salesReport.totals?.udhaarSales || 0)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-softgrey-border shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-pearl text-slate-600 font-bold border-b border-softgrey-border">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-center">Bills Count</th>
                  <th className="p-3.5 text-right">Cash</th>
                  <th className="p-3.5 text-right">UPI</th>
                  <th className="p-3.5 text-right">Udhaar</th>
                  <th className="p-3.5 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-softgrey-border">
                {(salesReport.periodData || []).map((row: any) => (
                  <tr key={row._id} className="hover:bg-pearl/50">
                    <td className="p-3.5 font-bold text-navy">{row._id}</td>
                    <td className="p-3.5 text-center font-semibold">{row.invoiceCount}</td>
                    <td className="p-3.5 text-right text-slate-600">{formatCurrency(row.cashSales)}</td>
                    <td className="p-3.5 text-right text-slate-600">{formatCurrency(row.upiSales)}</td>
                    <td className="p-3.5 text-right text-coral font-bold">{formatCurrency(row.udhaarSales)}</td>
                    <td className="p-3.5 text-right font-black text-navy text-sm">
                      {formatCurrency(row.totalSales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Profit & Loss */}
      {activeTab === 'pnl' && (
        <div className="bg-white p-6 rounded-2xl border border-softgrey-border shadow-sm space-y-6">
          <div className="border-b border-softgrey-border pb-4">
            <h2 className="text-lg font-black text-navy">Reconciled Profit & Loss Statement</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accurately accounts for Cost of Goods Sold (COGS) and categorized shop expenses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            {/* Revenue & Gross Profit */}
            <div className="space-y-3 bg-pearl p-4 rounded-xl border border-softgrey-border">
              <h3 className="font-bold text-navy text-sm border-b border-slate-200 pb-2">
                Trading Account (Gross Profit)
              </h3>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Billed Revenue:</span>
                <span className="font-bold text-navy">{formatCurrency(pnlReport.totalRevenue || 0)}</span>
              </div>
              <div className="flex justify-between text-coral">
                <span>Less: Cost of Goods Sold (COGS):</span>
                <span className="font-bold">-{formatCurrency(pnlReport.totalCogs || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-2 font-black text-sm text-success">
                <span>Gross Profit:</span>
                <span>{formatCurrency(pnlReport.grossProfit || 0)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Gross Profit Margin:</span>
                <span>{pnlReport.grossProfitMargin || 0}%</span>
              </div>
            </div>

            {/* Operating Expenses & Net Profit */}
            <div className="space-y-3 bg-pearl p-4 rounded-xl border border-softgrey-border">
              <h3 className="font-bold text-navy text-sm border-b border-slate-200 pb-2">
                Income Statement (Net Profit)
              </h3>
              <div className="flex justify-between font-bold text-slate-700">
                <span>Gross Profit from Operations:</span>
                <span>{formatCurrency(pnlReport.grossProfit || 0)}</span>
              </div>
              <div className="flex justify-between text-coral">
                <span>Less: Total Operating Expenses:</span>
                <span className="font-bold">-{formatCurrency(pnlReport.totalExpenses || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-2 font-black text-sm text-navy">
                <span>Estimated Net Profit:</span>
                <span className={(pnlReport.netProfit || 0) >= 0 ? 'text-success' : 'text-coral'}>
                  {formatCurrency(pnlReport.netProfit || 0)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Net Profit Margin:</span>
                <span>{pnlReport.netProfitMargin || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GST Tax Summary */}
      {activeTab === 'tax' && (
        <div className="bg-white rounded-2xl border border-softgrey-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-softgrey-border">
            <h2 className="font-bold text-navy text-sm">GST Slabs Reconciliation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of taxable supplies and tax collected across 0%, 5%, 12%, 18%, 28% slabs.
            </p>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-pearl text-slate-600 font-bold border-b border-softgrey-border">
                <th className="p-3.5">GST Rate Slab</th>
                <th className="p-3.5 text-right">Taxable Turnover</th>
                <th className="p-3.5 text-right">CGST</th>
                <th className="p-3.5 text-right">SGST</th>
                <th className="p-3.5 text-right">Total Tax Amount</th>
                <th className="p-3.5 text-right">Gross Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-softgrey-border">
              {taxSlabs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No GST transactions found</td>
                </tr>
              ) : (
                taxSlabs.map((t) => (
                  <tr key={t.rate} className="hover:bg-pearl/50">
                    <td className="p-3.5 font-bold text-navy">{t.rate}% GST</td>
                    <td className="p-3.5 text-right text-slate-700">{formatCurrency(t.taxableAmount)}</td>
                    <td className="p-3.5 text-right text-slate-500">{formatCurrency(t.cgst)}</td>
                    <td className="p-3.5 text-right text-slate-500">{formatCurrency(t.sgst)}</td>
                    <td className="p-3.5 text-right font-bold text-coral">{formatCurrency(t.totalTax)}</td>
                    <td className="p-3.5 text-right font-black text-navy">{formatCurrency(t.totalAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
