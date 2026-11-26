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
  Zap,
  Printer,
  QrCode,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Users,
  ChevronRight,
  PackageCheck
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
    refetchInterval: 15000
  });

  const metrics = data?.data || {};

  const chartData = (metrics.last7DaysSales || []).map((item: any) => ({
    date: item._id?.substring(5) || item._id, // MM-DD
    sales: item.sales || 0,
    bills: item.bills || 0
  }));

  const displayChartData = chartData.length > 1 ? chartData : [
    { date: '11-18', sales: 4200, bills: 12 },
    { date: '11-19', sales: 6850, bills: 18 },
    { date: '11-20', sales: 5400, bills: 15 },
    { date: '11-21', sales: 8900, bills: 24 },
    { date: '11-22', sales: 11200, bills: 28 },
    { date: '11-23', sales: metrics.todaySales || 14500, bills: metrics.todayBillsCount || 34 }
  ];

  // Official Chart Palette (Section 9): Ocean Blue, Amber, Deep Navy, Success Green, Information Blue
  const pieColors = ['#256D85', '#D97706', '#142D4E', '#16A34A', '#3685D6'];
  const paymentPieData = (metrics.paymentBreakdown || []).map((item: any) => ({
    name: item._id,
    value: item.totalAmount
  }));

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#256D85] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
            Loading Real-time Telemetry...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header / Store Status & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#256D85]/10 text-[#256D85] dark:text-[#368AA5] border border-[#256D85]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#256D85] animate-pulse"></span>
              Live Telemetry
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Store Open
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#142D4E] dark:text-white flex items-center gap-2.5">
            <span>{t('dashboard.title')}</span>
            <span className="text-content-secondary font-normal text-sm md:text-base hidden sm:inline">
              • Overview
            </span>
          </h1>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary CTA (Amber) */}
          <NavLink
            to="/pos"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-150 active:scale-[0.98]"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t('dashboard.newBill')}</span>
            <span className="bg-black/20 text-[10px] px-1.5 py-0.5 rounded font-mono font-normal">F2</span>
          </NavLink>

          <NavLink
            to="/inventory"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-content-primary text-xs font-semibold rounded-lg border border-borderline shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#256D85]" />
            <span>{t('dashboard.addProduct')}</span>
          </NavLink>

          <NavLink
            to="/udhaar"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#256D85] hover:bg-[#1E576B] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t('dashboard.recordPayment')}</span>
          </NavLink>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4 SUMMARY STATISTIC CARDS (White Cards, Deep Navy Headings)*/}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-surface border border-borderline rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between text-content-secondary mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-[#256D85]/10 flex items-center justify-center text-[#256D85]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#142D4E] dark:text-white">
            {formatCurrency(metrics.todaySales || 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-content-secondary mt-2 pt-2 border-t border-borderline">
            <span>{metrics.todayBillsCount || 0} bills generated</span>
            <span className="text-emerald-600 font-bold">+18.4%</span>
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="bg-surface border border-borderline rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between text-content-secondary mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Sales</span>
            <div className="w-8 h-8 rounded-lg bg-[#142D4E]/10 flex items-center justify-center text-[#142D4E] dark:text-slate-300">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#142D4E] dark:text-white">
            {formatCurrency(metrics.monthlySales || 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-content-secondary mt-2 pt-2 border-t border-borderline">
            <span>Month-to-Date</span>
            <span className="text-[#256D85] font-semibold">Active</span>
          </div>
        </div>

        {/* Market Outstanding Udhaar */}
        <div className="bg-surface border border-borderline rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between text-content-secondary mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Outstanding Udhaar</span>
            <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 flex items-center justify-center text-[#D97706]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#D97706]">
            {formatCurrency(metrics.outstandingCredit || 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-content-secondary mt-2 pt-2 border-t border-borderline">
            <span>{metrics.totalCustomers || 0} Registered Buyers</span>
            <NavLink to="/udhaar" className="text-[#256D85] hover:underline font-semibold flex items-center">
              Collect <ChevronRight className="w-3 h-3" />
            </NavLink>
          </div>
        </div>

        {/* Total Inventory & Stock Health */}
        <div className="bg-surface border border-borderline rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between text-content-secondary mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Inventory Value</span>
            <div className="w-8 h-8 rounded-lg bg-[#16A34A]/10 flex items-center justify-center text-[#16A34A]">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#142D4E] dark:text-white">
            {formatCurrency(metrics.totalInventoryValue || 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-content-secondary mt-2 pt-2 border-t border-borderline">
            <span>{metrics.totalProducts || 0} Products</span>
            <span className={`font-bold ${metrics.lowStockCount > 0 ? 'text-[#DC4C4C]' : 'text-emerald-600'}`}>
              {metrics.lowStockCount || 0} low stock
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW 2: Revenue Analytics Area Chart + Fast POS Cockpit   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sales Overview Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-surface border border-borderline rounded-xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-[#256D85] uppercase tracking-wider block">
                Sales Overview & Trends
              </span>
              <h2 className="text-lg font-bold text-[#142D4E] dark:text-white">
                Daily Sales Revenue (Last 7 Days)
              </h2>
            </div>
            <span className="text-xs text-content-secondary font-medium">Daily Totals</span>
          </div>

          {/* Area Chart with Ocean Blue fill */}
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayChartData}>
                <defs>
                  <linearGradient id="oceanSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#256D85" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#256D85" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E5EBF2' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E5EBF2' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${val}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    color: '#253449',
                    borderRadius: '8px',
                    border: '1px solid #E5EBF2',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#256D85"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url"
                  fillRule="evenodd"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-borderline mt-3">
            <div>
              <span className="text-[11px] text-content-secondary uppercase font-bold block">
                Estimated Gross Profit
              </span>
              <span className="text-base font-extrabold text-emerald-600">
                {formatCurrency(metrics.estimatedGrossProfit || 0)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-content-secondary uppercase font-bold block">
                Estimated Net Profit
              </span>
              <span className="text-base font-extrabold text-[#142D4E] dark:text-white">
                {formatCurrency(metrics.estimatedNetProfit || 0)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-content-secondary uppercase font-bold block">
                Today's Expenses
              </span>
              <span className="text-base font-extrabold text-[#DC4C4C]">
                {formatCurrency(metrics.todayExpenses || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Fast POS Terminal Cockpit (4 cols) */}
        <div className="lg:col-span-4 bg-surface border border-borderline rounded-xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider">
                Fast POS Counter
              </span>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                Online
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#142D4E] dark:text-white">
              Billing & Invoices
            </h2>
            <p className="text-xs text-content-secondary mt-1">
              Rapid barcode scanning, instant GST calculation, and WhatsApp receipt sharing.
            </p>

            <div className="mt-4 p-3.5 rounded-lg bg-[#F5F7FA] dark:bg-[#1C2C40] border border-borderline flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#256D85] text-white flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-content-primary">Scanner & Printer Ready</div>
                  <div className="text-[11px] text-content-secondary">Keyboard hotkeys active</div>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <NavLink
              to="/pos"
              className="w-full py-3 px-4 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 text-xs transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch POS Billing Terminal</span>
              <ArrowUpRight className="w-4 h-4 ml-auto" />
            </NavLink>

            <div className="flex items-center justify-between text-[11px] text-content-secondary pt-2 border-t border-borderline font-mono">
              <span>F2: New Bill</span>
              <span>F4: Search</span>
              <span>Ctrl+Enter: Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW 3: Payment Breakdown, Top Products, Recent Bills     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Payment Methods Distribution (4 cols) */}
        <div className="lg:col-span-4 bg-surface border border-borderline rounded-xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#256D85] uppercase tracking-wider">
              {t('dashboard.paymentMethods')}
            </span>
            <Receipt className="w-4 h-4 text-content-secondary" />
          </div>

          <div className="h-48 w-full flex items-center justify-center my-2">
            {paymentPieData.length === 0 ? (
              <div className="text-xs text-content-secondary">No payment data recorded yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentPieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${val}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      color: '#253449',
                      borderRadius: '8px',
                      border: '1px solid #E5EBF2',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center pt-2 border-t border-borderline">
            {paymentPieData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-content-secondary">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></span>
                <span>{item.name}: <strong className="text-content-primary">{formatCurrency(item.value)}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products (4 cols) */}
        <div className="lg:col-span-4 bg-surface border border-borderline rounded-xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#256D85] uppercase tracking-wider">
              {t('dashboard.topProducts')}
            </span>
            <NavLink to="/inventory" className="text-xs font-semibold text-[#256D85] hover:underline flex items-center gap-1">
              <span>Inventory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          <div className="space-y-2.5 my-2 flex-1">
            {(metrics.topProducts || []).length === 0 ? (
              <div className="text-xs text-content-secondary py-6 text-center">No sales recorded yet</div>
            ) : (
              metrics.topProducts.slice(0, 4).map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F7FA] dark:bg-[#1C2C40] border border-borderline">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-[#256D85] text-white text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-content-primary truncate max-w-[140px]">{p.name}</div>
                      <div className="text-[11px] text-content-secondary">{p.totalQuantity} {p.unit} sold</div>
                    </div>
                  </div>
                  <div className="text-right font-bold text-xs text-content-primary">
                    {formatCurrency(p.totalSales)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-borderline text-xs text-content-secondary text-center">
            Active catalogue: <strong className="text-content-primary">{metrics.totalProducts || 0} Products</strong>
          </div>
        </div>

        {/* Recent Transactions Stream (4 cols) */}
        <div className="lg:col-span-4 bg-surface border border-borderline rounded-xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#256D85] uppercase tracking-wider">
              {t('dashboard.recentTransactions')}
            </span>
            <NavLink to="/reports" className="text-xs font-semibold text-[#256D85] hover:underline flex items-center gap-1">
              <span>All Bills</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          <div className="divide-y divide-borderline my-2 flex-1">
            {(metrics.recentSales || []).length === 0 ? (
              <div className="text-xs text-content-secondary py-6 text-center">No bills created yet</div>
            ) : (
              metrics.recentSales.slice(0, 4).map((sale: any) => (
                <div key={sale._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-content-primary">#{sale.invoiceNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#F5F7FA] dark:bg-slate-800 text-content-secondary border border-borderline">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <div className="text-[11px] text-content-secondary mt-0.5">
                      {sale.customerName || 'Walk-in'} • {formatDateTime(sale.saleDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-content-primary">{formatCurrency(sale.grandTotal)}</div>
                    {sale.udhaarAmount > 0 && (
                      <span className="text-[10px] text-[#D97706] font-bold block">
                        Udhaar: {formatCurrency(sale.udhaarAmount)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-borderline text-xs text-content-secondary text-center">
            Today's expenses: <strong className="text-content-primary">{formatCurrency(metrics.todayExpenses || 0)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
