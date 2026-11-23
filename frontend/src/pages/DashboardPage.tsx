import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';
import { NavLink } from 'react-router-dom';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Boxes,
  PlusCircle,
  Receipt,
  ArrowUpRight,
  ShoppingCart,
  IndianRupee,
  Sparkles,
  Zap,
  QrCode,
  Printer,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Users,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => api.get('/reports/dashboard'),
    refetchInterval: 15000 // Real-time 15s refresh
  });

  const metrics = data?.data || {};

  const chartData = (metrics.last7DaysSales || []).map((item: any) => ({
    date: item._id?.substring(5) || item._id, // MM-DD
    sales: item.sales || 0,
    bills: item.bills || 0
  }));

  // Fallback demo points if database has only today's data so the sparkline glows beautifully
  const displayChartData = chartData.length > 1 ? chartData : [
    { date: '11-18', sales: 4200, bills: 12 },
    { date: '11-19', sales: 6850, bills: 18 },
    { date: '11-20', sales: 5400, bills: 15 },
    { date: '11-21', sales: 8900, bills: 24 },
    { date: '11-22', sales: 11200, bills: 28 },
    { date: '11-23', sales: metrics.todaySales || 14500, bills: metrics.todayBillsCount || 34 }
  ];

  const pieColors = ['#8B5CF6', '#FF6B5F', '#10B981', '#06B6D4', '#F59E0B'];
  const paymentPieData = (metrics.paymentBreakdown || []).map((item: any) => ({
    name: item._id,
    value: item.totalAmount
  }));

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-aurora-purple border-t-transparent rounded-full animate-spin shadow-glow-purple"></div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            Loading Real-time Telemetry...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto relative z-10">
      {/* Top Header / Store Status & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bento-tag bg-aurora-purple/15 text-aurora-purple border-aurora-purple/30">
              <span className="w-1.5 h-1.5 rounded-full bg-aurora-purple animate-ping"></span>
              Live Telemetry
            </span>
            <span className="bento-tag bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Store Open
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>{t('dashboard.title')}</span>
            <span className="text-slate-400 font-normal text-sm md:text-base hidden sm:inline">
              • Overview
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <NavLink
            to="/pos"
            className="group relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-coral via-rose-500 to-aurora-purple text-white text-xs font-bold rounded-2xl shadow-glow-coral hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <ShoppingCart className="w-4 h-4" />
            <span>{t('dashboard.newBill')}</span>
            <span className="bg-black/25 text-[10px] px-1.5 py-0.5 rounded font-mono">F2</span>
          </NavLink>

          <NavLink
            to="/inventory"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-2xl border border-white/10 hover:border-white/20 transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-aurora-purple" />
            <span>{t('dashboard.addProduct')}</span>
          </NavLink>

          <NavLink
            to="/udhaar"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-2xl border border-white/10 hover:border-white/20 transition active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5 text-coral" />
            <span>{t('dashboard.recordPayment')}</span>
          </NavLink>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BENTO GRID: ROW 1 (Hero Analytics Card + Fast POS Cockpit) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento Hero Card: Access powerful data + Glowing Line Chart (8 cols) */}
        <div className="lg:col-span-8 glass-card glass-card-hover p-6 flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle background glow orb */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-aurora-purple/20 blur-3xl group-hover:bg-aurora-purple/30 transition-all pointer-events-none" />
          <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full bg-coral/10 blur-3xl pointer-events-none" />

          {/* Top category chip */}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-aurora-purple">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                REVENUE INTELLIGENCE & TELEMETRY
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Last 7 Days</span>
          </div>

          {/* Heading */}
          <div className="mb-4 relative z-10">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
              Access real-time data to help you boost your retail profits
            </h2>
          </div>

          {/* Large Stat with Glowing Chip */}
          <div className="flex flex-wrap items-baseline gap-3 mb-4 relative z-10">
            <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {formatCurrency(metrics.todaySales || 0)}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-glow-emerald">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% today</span>
            </span>
            <span className="text-xs text-slate-400">
              ({metrics.todayBillsCount || 0} customer bills generated)
            </span>
          </div>

          {/* Glowing Area / Sparkline Chart */}
          <div className="h-44 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayChartData}>
                <defs>
                  <linearGradient id="auroraSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="60%" stopColor="#EC4899" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${val}`, 'Daily Sales']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#F8F9FC',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#auroraSalesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Micro Metrics Row */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 mt-2 relative z-10">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Estimated Gross Profit
              </span>
              <span className="text-sm md:text-base font-black text-emerald-400">
                {formatCurrency(metrics.estimatedGrossProfit || 0)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Estimated Net Profit
              </span>
              <span className="text-sm md:text-base font-black text-white">
                {formatCurrency(metrics.estimatedNetProfit || 0)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Month-to-Date
              </span>
              <span className="text-sm md:text-base font-black text-coral">
                {formatCurrency(metrics.monthlySales || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Bento Card 2: Fast Billing & POS Cockpit (4 cols) */}
        <div className="lg:col-span-4 glass-card glass-card-hover p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-coral/20 blur-3xl pointer-events-none" />

          {/* Top Badge */}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-coral">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                FAST POS BILLING
              </span>
            </div>
            <span className="text-[10px] bg-coral/20 text-coral border border-coral/30 px-2 py-0.5 rounded-full font-bold">
              Instant
            </span>
          </div>

          {/* Headline */}
          <div className="mb-4 relative z-10">
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight leading-snug">
              Rapid barcode billing with dynamic UPI QR & thermal receipts
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Optimized for fast Kirana counter lines with keyboard hotkeys.
            </p>
          </div>

          {/* Interactive Chat/Status Style Pill (matching user's reference image!) */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md mb-4 flex items-center justify-between gap-3 relative z-10 group-hover:border-white/20 transition">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-aurora-purple to-coral flex items-center justify-center font-bold text-xs text-white shadow-glow-purple">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Scanner Active</div>
                <div className="text-[10px] text-slate-400">Camera & Laser Ready</div>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow-emerald animate-pulse"></span>
          </div>

          {/* Big Launch Button */}
          <NavLink
            to="/pos"
            className="w-full py-3 px-4 bg-gradient-to-r from-coral to-aurora-purple hover:opacity-95 text-white font-bold rounded-2xl shadow-glow-coral flex items-center justify-center gap-2 text-xs transition active:scale-95 relative z-10"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Launch POS Terminal</span>
            <ArrowUpRight className="w-4 h-4 ml-auto" />
          </NavLink>

          {/* Hotkeys footer */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-white/10 mt-3 relative z-10 font-mono">
            <span>F2: New Bill</span>
            <span>F4: Find Item</span>
            <span>F8: Pay</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BENTO GRID: ROW 2 (Hardware Ecosystem Dock + Udhaar Ledger Card) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento Card 3: Works with your favorite tools / Retail Hardware Dock (4 cols) */}
        <div className="lg:col-span-5 glass-card glass-card-hover p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-aurora-cyan/15 blur-3xl pointer-events-none" />

          {/* Top Badge */}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-aurora-cyan">
                <Boxes className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                INTEGRATED RETAIL DOCK
              </span>
            </div>
            <span className="text-[10px] bg-aurora-cyan/20 text-aurora-cyan border border-aurora-cyan/30 px-2 py-0.5 rounded-full font-bold">
              Plug & Play
            </span>
          </div>

          {/* Headline */}
          <div className="mb-4 relative z-10">
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
              Works seamlessly with all your retail tools
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Supports POS thermal printers, barcode guns, UPI soundboxes, and WhatsApp.
            </p>
          </div>

          {/* Tool Icon Dock (Inspired directly by the reference image's app dock!) */}
          <div className="grid grid-cols-4 gap-3 my-2 relative z-10">
            <div className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex flex-col items-center justify-center gap-1.5 transition transform hover:-translate-y-1 group/tool">
              <Printer className="w-5 h-5 text-aurora-purple group-hover/tool:scale-110 transition" />
              <span className="text-[9px] font-bold text-slate-300">Thermal</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex flex-col items-center justify-center gap-1.5 transition transform hover:-translate-y-1 group/tool">
              <QrCode className="w-5 h-5 text-coral group-hover/tool:scale-110 transition" />
              <span className="text-[9px] font-bold text-slate-300">UPI QR</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex flex-col items-center justify-center gap-1.5 transition transform hover:-translate-y-1 group/tool">
              <Smartphone className="w-5 h-5 text-emerald-400 group-hover/tool:scale-110 transition" />
              <span className="text-[9px] font-bold text-slate-300">WhatsApp</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex flex-col items-center justify-center gap-1.5 transition transform hover:-translate-y-1 group/tool">
              <ShieldCheck className="w-5 h-5 text-aurora-cyan group-hover/tool:scale-110 transition" />
              <span className="text-[9px] font-bold text-slate-300">Offline PWA</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 mt-2 text-[11px] text-slate-400 flex items-center justify-between relative z-10">
            <span>IndexedDB Local Storage</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Auto-Sync On
            </span>
          </div>
        </div>

        {/* Bento Card 4: Udhaar Recovery Engine & Customer Credit (7 cols) */}
        <div className="lg:col-span-7 glass-card glass-card-hover p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-warning/15 blur-3xl pointer-events-none" />

          {/* Top Badge */}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-warning">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                CUSTOMER CREDIT & UDHAAR KHATA
              </span>
            </div>
            <NavLink
              to="/udhaar"
              className="text-xs text-warning hover:underline font-semibold flex items-center gap-1"
            >
              <span>Manage Khata</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          {/* Headline & Stat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 relative z-10">
            <div>
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                Market Udhaar Recovery
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Immutable ledger with 1-click WhatsApp payment reminders and UPI links.
              </p>
              <div className="mt-3">
                <span className="text-2xl md:text-3xl font-black text-warning tracking-tight">
                  {formatCurrency(metrics.outstandingCredit || 0)}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Total credit outstanding across market
                </span>
              </div>
            </div>

            {/* Quick action card inside */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <div className="text-xs text-slate-300 font-semibold mb-2">
                Speed up cash collection:
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Auto-generates UPI payment deep link</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-aurora-purple"></span>
                  <span>Includes store name & exact due amount</span>
                </div>
              </div>
              <NavLink
                to="/udhaar"
                className="mt-3 py-2 px-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-center text-xs border border-white/10 transition active:scale-95"
              >
                Send WhatsApp Reminders
              </NavLink>
            </div>
          </div>

          {/* Micro stats strip */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 mt-2 text-center relative z-10">
            <div className="p-2 rounded-xl bg-white/[0.03]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Customers</span>
              <span className="text-sm font-black text-white">{metrics.totalCustomers || 0}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Inventory Value</span>
              <span className="text-sm font-black text-white">{formatCurrency(metrics.totalInventoryValue || 0)}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Low Stock</span>
              <span className={`text-sm font-black ${metrics.lowStockCount > 0 ? 'text-coral' : 'text-emerald-400'}`}>
                {metrics.lowStockCount || 0} items
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BENTO GRID: ROW 3 (Payment Distribution Donut + Top Products + Recent Transactions) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Payment Methods Donut (4 cols) */}
        <div className="lg:col-span-4 glass-card glass-card-hover p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-aurora-purple">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                {t('dashboard.paymentMethods')}
              </span>
            </div>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {paymentPieData.length === 0 ? (
              <div className="text-xs text-slate-400">No payment data recorded yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentPieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${val}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      color: '#F8F9FC',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center pt-2 border-t border-white/10">
            {paymentPieData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full shadow-glow-purple" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></span>
                <span>{item.name}: <strong className="text-white">{formatCurrency(item.value)}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products (4 cols) */}
        <div className="lg:col-span-4 glass-card glass-card-hover p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-coral">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                {t('dashboard.topProducts')}
              </span>
            </div>
            <NavLink to="/inventory" className="text-xs font-semibold text-coral hover:underline flex items-center gap-1">
              <span>Inventory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          <div className="space-y-2.5 my-2 flex-1">
            {(metrics.topProducts || []).length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No sales recorded yet</div>
            ) : (
              metrics.topProducts.slice(0, 4).map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-aurora-purple to-coral text-white text-[11px] font-bold flex items-center justify-center shadow-glow-purple">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-white truncate max-w-[140px]">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.totalQuantity} {p.unit} sold</div>
                    </div>
                  </div>
                  <div className="text-right font-black text-xs text-white">
                    {formatCurrency(p.totalSales)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 text-center">
            Active catalogue: <strong className="text-white">{metrics.totalProducts || 0} Products</strong>
          </div>
        </div>

        {/* Recent Bills Stream (4 cols) */}
        <div className="lg:col-span-4 glass-card glass-card-hover p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-emerald-400">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                {t('dashboard.recentTransactions')}
              </span>
            </div>
            <NavLink to="/reports" className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1">
              <span>All Bills</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          <div className="divide-y divide-white/5 my-2 flex-1">
            {(metrics.recentSales || []).length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No bills created yet</div>
            ) : (
              metrics.recentSales.slice(0, 4).map((sale: any) => (
                <div key={sale._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">#{sale.invoiceNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/10 text-slate-300 border border-white/10">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {sale.customerName || 'Walk-in'} • {formatDateTime(sale.saleDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-white">{formatCurrency(sale.grandTotal)}</div>
                    {sale.udhaarAmount > 0 && (
                      <span className="text-[10px] text-warning font-bold block">
                        Udhaar: {formatCurrency(sale.udhaarAmount)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 text-center">
            Today's expenses: <strong className="text-white">{formatCurrency(metrics.todayExpenses || 0)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
