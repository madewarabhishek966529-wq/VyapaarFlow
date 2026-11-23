import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';
import { NavLink } from 'react-router-dom';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Users,
  Boxes,
  PlusCircle,
  Receipt,
  ArrowUpRight,
  ShoppingCart,
  IndianRupee,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

  const pieColors = ['#14213D', '#FF6B5F', '#16A36A', '#E9A23B', '#64748B'];
  const paymentPieData = (metrics.paymentBreakdown || []).map((item: any) => ({
    name: item._id,
    value: item.totalAmount
  }));

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-navy text-white p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
            <span>{t('dashboard.title')}</span>
            <span className="text-xs bg-coral text-white font-bold px-2 py-0.5 rounded-full">LIVE</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time business performance, billing telemetry & financial records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <NavLink
            to="/pos"
            className="flex items-center gap-1.5 px-4 py-2 bg-coral hover:bg-coral-hover text-white text-xs font-bold rounded-xl shadow-lg transition active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t('dashboard.newBill')}</span>
          </NavLink>
          <NavLink
            to="/inventory"
            className="flex items-center gap-1.5 px-3 py-2 bg-navy-light hover:bg-navy-muted text-white text-xs font-semibold rounded-xl border border-navy-muted transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t('dashboard.addProduct')}</span>
          </NavLink>
          <NavLink
            to="/udhaar"
            className="flex items-center gap-1.5 px-3 py-2 bg-navy-light hover:bg-navy-muted text-white text-xs font-semibold rounded-xl border border-navy-muted transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t('dashboard.recordPayment')}</span>
          </NavLink>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t('dashboard.todaySales')}</span>
            <span className="p-2 bg-coral/10 text-coral rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg md:text-2xl font-black text-navy">
            {formatCurrency(metrics.todaySales || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-bold text-navy">{metrics.todayBillsCount || 0}</span> bills generated today
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t('dashboard.monthSales')}</span>
            <span className="p-2 bg-navy/10 text-navy rounded-xl">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg md:text-2xl font-black text-navy">
            {formatCurrency(metrics.monthlySales || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Calendar month gross revenue</div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t('dashboard.grossProfit')}</span>
            <span className="p-2 bg-success/10 text-success rounded-xl">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg md:text-2xl font-black text-success">
            {formatCurrency(metrics.estimatedGrossProfit || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Net: <span className="font-bold text-slate-700">{formatCurrency(metrics.estimatedNetProfit || 0)}</span>
          </div>
        </div>

        {/* Customer Udhaar Due */}
        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t('dashboard.udhaarOutstanding')}</span>
            <span className="p-2 bg-warning/10 text-warning rounded-xl">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg md:text-2xl font-black text-warning">
            {formatCurrency(metrics.outstandingCredit || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total pending credit in market</div>
        </div>

        {/* Stock Valuation */}
        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t('dashboard.inventoryValuation')}</span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg md:text-2xl font-black text-navy">
            {formatCurrency(metrics.totalInventoryValue || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across {metrics.totalProducts || 0} active products</div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t('dashboard.lowStockAlerts')}</span>
            <span className="p-2 bg-coral/10 text-coral rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-lg md:text-2xl font-black ${metrics.lowStockCount > 0 ? 'text-coral' : 'text-slate-800'}`}>
            {metrics.lowStockCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Items at or below minimum level</div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t('dashboard.totalCustomers')}</span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg md:text-2xl font-black text-navy">
            {metrics.totalCustomers || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Registered customer accounts</div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t('dashboard.todayExpenses')}</span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg md:text-2xl font-black text-slate-800">
            {formatCurrency(metrics.todayExpenses || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Month total: {formatCurrency(metrics.monthlyExpenses || 0)}</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-softgrey-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-navy">{t('dashboard.salesTrend')}</h3>
            <span className="text-xs text-slate-400">Daily Revenue</span>
          </div>
          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No transaction data in the last 7 days
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val: any) => [`₹${val}`, 'Sales']}
                    contentStyle={{ backgroundColor: '#14213D', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                  />
                  <Bar dataKey="sales" fill="#FF6B5F" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-softgrey-border shadow-sm flex flex-col">
          <h3 className="font-bold text-sm text-navy mb-4">{t('dashboard.paymentMethods')}</h3>
          <div className="h-52 w-full flex-1">
            {paymentPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No payment data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentPieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${val}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#14213D', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {paymentPieData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></span>
                <span>{item.name}: {formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Selling Items & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-softgrey-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-navy">{t('dashboard.topProducts')}</h3>
            <NavLink to="/inventory" className="text-xs font-semibold text-coral hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
          <div className="space-y-3">
            {(metrics.topProducts || []).length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No sales recorded yet</div>
            ) : (
              metrics.topProducts.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-pearl hover:bg-softgrey-light transition">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-navy text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-navy">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.totalQuantity} {p.unit} sold</div>
                    </div>
                  </div>
                  <div className="text-right font-black text-xs text-slate-800">
                    {formatCurrency(p.totalSales)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="bg-white p-5 rounded-2xl border border-softgrey-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-navy">{t('dashboard.recentTransactions')}</h3>
            <NavLink to="/reports" className="text-xs font-semibold text-coral hover:underline flex items-center gap-1">
              <span>View Reports</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
          <div className="divide-y divide-softgrey-border">
            {(metrics.recentSales || []).length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No bills created yet</div>
            ) : (
              metrics.recentSales.map((sale: any) => (
                <div key={sale._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy">#{sale.invoiceNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {sale.customerName || 'Walk-in'} • {formatDateTime(sale.saleDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-navy">{formatCurrency(sale.grandTotal)}</div>
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
        </div>
      </div>
    </div>
  );
};
