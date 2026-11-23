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
  History,
  AlertCircle,
  Sparkles
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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 relative z-10">
      {/* Top Header */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bento-tag bg-warning/15 text-warning border-warning/30">
              <BookOpen className="w-3.5 h-3.5" />
              Customer Credit Recovery
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{t('udhaar.title')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable customer credit ledger, running balances & 1-click WhatsApp payment reminders with UPI links.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card glass-card-hover p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{t('udhaar.totalOutstanding')}</span>
          <div className="text-2xl md:text-3xl font-black text-coral mt-1 tracking-tight">
            {formatCurrency(summary.totalOutstanding || 0)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Net pending credit to collect</span>
        </div>

        <div className="glass-card glass-card-hover p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{t('udhaar.debtorsCount')}</span>
          <div className="text-2xl md:text-3xl font-black text-white mt-1 tracking-tight">
            {summary.debtorsCount || 0}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Active customer accounts</span>
        </div>

        <div className="glass-card glass-card-hover p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{t('udhaar.totalCredit')}</span>
          <div className="text-2xl md:text-3xl font-black text-aurora-purple mt-1 tracking-tight">
            {formatCurrency(summary.totalCreditGiven || 0)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Cumulative credit granted</span>
        </div>

        <div className="glass-card glass-card-hover p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{t('udhaar.totalCollected')}</span>
          <div className="text-2xl md:text-3xl font-black text-emerald-400 mt-1 tracking-tight">
            {formatCurrency(summary.totalCollected || 0)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Total repayments received</span>
        </div>
      </div>

      {/* Search & Debtors List */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aurora-purple/50 font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-white/10">
                <th className="p-4">Customer Name & Code</th>
                <th className="p-4">Mobile</th>
                <th className="p-4 text-right">Total Purchases</th>
                <th className="p-4 text-right">Pending Udhaar Due</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
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
                  <tr key={c._id} className="hover:bg-white/[0.03] transition">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{c.customerCode}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-300">{c.mobile}</td>
                    <td className="p-4 text-right font-medium text-slate-400">
                      {formatCurrency(c.totalPurchases)}
                    </td>
                    <td className="p-4 text-right font-black text-coral text-sm">
                      {formatCurrency(c.currentBalance)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Record Repayment Button */}
                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setRepayAmount(c.currentBalance.toString());
                            setIsRepayModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 font-bold rounded-xl text-xs shadow-glow-emerald transition active:scale-95"
                        >
                          Collect ₹
                        </button>

                        {/* WhatsApp Reminder Button */}
                        <button
                          onClick={() => handleSendReminder(c._id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition active:scale-95"
                          title="Send pre-filled WhatsApp reminder with UPI payment link"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Ledger View Button */}
                        <button
                          onClick={() => {
                            setLedgerCustomer(c);
                            setIsLedgerModalOpen(true);
                          }}
                          className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/10 transition"
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
        title={`Record Udhaar Repayment: ${selectedCustomer?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRepaySubmit} className="space-y-4 text-xs">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs block">Outstanding Due:</span>
              <span className="text-xl font-black text-coral">
                {formatCurrency(selectedCustomer?.currentBalance || 0)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRepayAmount(selectedCustomer?.currentBalance.toString() || '')}
              className="text-xs bg-white/10 hover:bg-white/15 text-white font-bold px-3 py-1.5 rounded-xl border border-white/10"
            >
              Pay Full Amount
            </button>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Repayment Amount (₹) *</label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white font-bold text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Reference / UTR Number</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white"
              placeholder="e.g. UPI Ref: 312345678901"
            />
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Notes</label>
            <input
              type="text"
              value={repayNotes}
              onChange={(e) => setRepayNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white"
              placeholder="Optional notes"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRepayModalOpen(false)}
              className="px-4 py-2 bg-white/5 text-slate-300 rounded-xl border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPaymentMutation.isPending}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-glow-emerald"
            >
              {recordPaymentMutation.isPending ? 'Recording...' : 'Confirm Repayment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Full Ledger Statement Modal */}
      <Modal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        title={`Udhaar Khata Ledger: ${ledgerCustomer?.name}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block">Current Balance Due:</span>
              <span className="text-xl font-black text-coral">
                {formatCurrency(ledgerCustomer?.currentBalance || 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Customer Mobile:</span>
              <span className="font-bold text-white text-sm">{ledgerCustomer?.mobile}</span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/5 border border-white/10 rounded-2xl bg-white/[0.02]">
            {ledgerEntries.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No ledger transactions recorded</div>
            ) : (
              ledgerEntries.map((l: any) => (
                <div key={l._id} className="p-3.5 flex items-center justify-between hover:bg-white/[0.03]">
                  <div>
                    <span className="font-bold text-white block">{l.type}</span>
                    <span className="text-[11px] text-slate-400">{l.notes || l.referenceNumber || 'Ledger entry'}</span>
                    <span className="text-[10px] text-slate-500 block">{formatDateTime(l.transactionDate)}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-black text-sm block ${
                        l.type === 'CREDIT_SALE' ? 'text-coral' : 'text-emerald-400'
                      }`}
                    >
                      {l.type === 'CREDIT_SALE' ? '+' : '-'}
                      {formatCurrency(l.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Bal: {formatCurrency(l.balanceAfter)}
                    </span>
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
