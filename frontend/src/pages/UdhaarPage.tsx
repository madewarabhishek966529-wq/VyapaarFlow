import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import { Modal } from '../components/Modal';
import {
  BookOpen,
  Send,
  PlusCircle,
  Search,
  CheckCircle,
  TrendingUp,
  CreditCard,
  PhoneCall,
  History
} from 'lucide-react';

export const UdhaarPage: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [ledgerCustomer, setLedgerCustomer] = useState<any>(null);

  // Repayment form
  const [repayAmount, setRepayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [repayNotes, setRepayNotes] = useState('');

  // Fetch summary metrics
  const { data: summaryData } = useQuery({
    queryKey: ['udhaar-summary'],
    queryFn: () => api.get('/udhaar/summary')
  });

  // Fetch customers with pending Udhaar
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers-udhaar', search],
    queryFn: () => api.get(`/customers?hasUdhaar=true&search=${encodeURIComponent(search)}`)
  });

  // Fetch single customer details with ledger entries
  const { data: customerDetailsData } = useQuery({
    queryKey: ['customer-ledger', ledgerCustomer?._id],
    queryFn: () => api.get(`/customers/${ledgerCustomer?._id}`),
    enabled: !!ledgerCustomer
  });

  const summary = summaryData?.data || {};
  const customers: any[] = customersData?.data?.customers || [];
  const ledgerEntries: any[] = customerDetailsData?.data?.ledger || [];

  // Mutation for recording repayment
  const recordPaymentMutation = useMutation({
    mutationFn: (payload: any) => api.post('/udhaar/payment', payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['udhaar-summary'] });
      queryClient.invalidateQueries({ queryKey: ['customers-udhaar'] });
      setIsRepayModalOpen(false);
      setSelectedCustomer(null);
      setRepayAmount('');
      setReferenceNumber('');
      setRepayNotes('');
      alert(res.message);
    },
    onError: (err: any) => {
      alert(`Failed to record payment: ${err.message}`);
    }
  });

  const handleSendReminder = async (customerId: string) => {
    try {
      const res = await api.get(`/udhaar/reminder/${customerId}`);
      if (res.data?.whatsappUrl) {
        window.open(res.data.whatsappUrl, '_blank');
      }
    } catch (err: any) {
      alert(`Could not generate reminder: ${err.message}`);
    }
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = parseFloat(repayAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    recordPaymentMutation.mutate({
      customerId: selectedCustomer._id,
      amount: amt,
      paymentMethod,
      referenceNumber,
      notes: repayNotes
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-navy text-white p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-coral" />
            <span>{t('udhaar.title')}</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Immutable customer credit ledger, running balances & 1-click WhatsApp payment reminders
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">{t('udhaar.totalOutstanding')}</span>
          <div className="text-xl md:text-2xl font-black text-coral mt-1">
            {formatCurrency(summary.totalOutstanding || 0)}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Net pending credit to collect</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">{t('udhaar.debtorsCount')}</span>
          <div className="text-xl md:text-2xl font-black text-navy mt-1">
            {summary.debtorsCount || 0}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Active customer accounts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">{t('udhaar.totalCredit')}</span>
          <div className="text-xl md:text-2xl font-black text-navy mt-1">
            {formatCurrency(summary.totalCreditGiven || 0)}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Cumulative credit granted</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-softgrey-border shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">{t('udhaar.totalCollected')}</span>
          <div className="text-xl md:text-2xl font-black text-success mt-1">
            {formatCurrency(summary.totalCollected || 0)}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Total repayments received</span>
        </div>
      </div>

      {/* Search & Debtors List */}
      <div className="bg-white rounded-2xl border border-softgrey-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-softgrey-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer by name or mobile..."
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
                <th className="p-3.5">Mobile</th>
                <th className="p-3.5 text-right">Total Purchases</th>
                <th className="p-3.5 text-right">Pending Udhaar Due</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-softgrey-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Loading Udhaar records...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No customers with outstanding credit balance. Great job!
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-pearl/50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-navy text-sm">{c.name}</div>
                      <div className="text-[11px] text-slate-400">{c.customerCode}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">{c.mobile}</td>
                    <td className="p-3.5 text-right font-medium text-slate-600">
                      {formatCurrency(c.totalPurchases)}
                    </td>
                    <td className="p-3.5 text-right font-black text-coral text-sm">
                      {formatCurrency(c.currentBalance)}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Record Repayment Button */}
                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setRepayAmount(c.currentBalance.toString());
                            setIsRepayModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-success hover:bg-success-dark text-white font-bold rounded-lg text-xs shadow-sm transition"
                        >
                          Collect ₹
                        </button>

                        {/* WhatsApp Reminder Button */}
                        <button
                          onClick={() => handleSendReminder(c._id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1 transition"
                          title="Send pre-filled WhatsApp reminder with UPI payment link"
                        >
                          <Send className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Ledger View Button */}
                        <button
                          onClick={() => {
                            setLedgerCustomer(c);
                            setIsLedgerModalOpen(true);
                          }}
                          className="p-1.5 bg-softgrey hover:bg-softgrey-border text-navy rounded-lg transition"
                          title="View Ledger Statement"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Repayment Modal */}
      <Modal
        isOpen={isRepayModalOpen}
        onClose={() => setIsRepayModalOpen(false)}
        title={`Record Payment: ${selectedCustomer?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRepaySubmit} className="space-y-4 text-xs">
          <div className="bg-pearl p-3 rounded-xl border border-softgrey-border flex justify-between items-center">
            <div>
              <span className="text-slate-500 block">Total Udhaar Due:</span>
              <span className="text-lg font-black text-coral">
                {formatCurrency(selectedCustomer?.currentBalance)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRepayAmount(selectedCustomer?.currentBalance.toString())}
              className="px-2.5 py-1 bg-coral/10 text-coral rounded-lg font-bold hover:bg-coral/20"
            >
              Full Pay
            </button>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Repayment Amount (₹) *</label>
            <input
              type="number"
              step="any"
              min="1"
              required
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-black text-sm text-navy"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-semibold"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Reference Number / Note</label>
            <input
              type="text"
              placeholder="e.g. UPI Ref 321876543210"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-softgrey-border">
            <button
              type="button"
              onClick={() => setIsRepayModalOpen(false)}
              className="px-4 py-2 bg-softgrey hover:bg-softgrey-border text-navy font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPaymentMutation.isPending}
              className="px-5 py-2 bg-success hover:bg-success-dark text-white font-bold rounded-xl shadow"
            >
              {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Ledger Statement Drawer / Modal */}
      <Modal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        title={`Customer Ledger: ${ledgerCustomer?.name}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center p-3 bg-pearl rounded-xl border border-softgrey-border">
            <div>
              <div className="font-bold text-navy text-sm">{ledgerCustomer?.name}</div>
              <div className="text-[11px] text-slate-500">Ph: {ledgerCustomer?.mobile}</div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500">Net Due:</span>
              <div className="text-base font-black text-coral">
                {formatCurrency(ledgerCustomer?.currentBalance)}
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto border border-softgrey-border rounded-xl divide-y divide-softgrey-border">
            {ledgerEntries.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No ledger entries found</div>
            ) : (
              ledgerEntries.map((item: any) => (
                <div key={item._id} className="p-3 hover:bg-pearl/50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          item.type === 'CREDIT_GIVEN'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.type === 'CREDIT_GIVEN' ? 'CREDIT GIVEN' : 'PAYMENT RECEIVED'}
                      </span>
                      <span className="text-[11px] text-slate-400">{formatDateTime(item.createdAt)}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      {item.notes} {item.invoiceNumber && `(Bill #${item.invoiceNumber})`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-black text-sm ${
                        item.type === 'CREDIT_GIVEN' ? 'text-coral' : 'text-success'
                      }`}
                    >
                      {item.type === 'CREDIT_GIVEN' ? '+' : '-'}
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Bal: {formatCurrency(item.balanceAfter)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
