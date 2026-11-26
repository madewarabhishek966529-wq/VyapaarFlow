import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import { Modal } from '../components/Modal';
import {
  BookOpen,
  Send,
  Search,
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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="bg-surface border border-borderline rounded-xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">
              <BookOpen className="w-3.5 h-3.5" />
              Khata Ledger
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#142D4E] dark:text-white tracking-tight flex items-center gap-2">
            <span>{t('udhaar.title')}</span>
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            Immutable customer credit ledger, running balances & 1-click WhatsApp payment reminders with UPI links.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-borderline rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
          <span className="text-[11px] font-bold text-content-secondary uppercase tracking-wider block">{t('udhaar.totalOutstanding')}</span>
          <div className="text-2xl md:text-3xl font-extrabold text-[#D97706] mt-1 tracking-tight">
            {formatCurrency(summary.totalOutstanding || 0)}
          </div>
          <span className="text-[11px] text-content-secondary block mt-1">Net pending credit to collect</span>
        </div>

        <div className="bg-surface border border-borderline rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
          <span className="text-[11px] font-bold text-content-secondary uppercase tracking-wider block">{t('udhaar.debtorsCount')}</span>
          <div className="text-2xl md:text-3xl font-extrabold text-[#142D4E] dark:text-white mt-1 tracking-tight">
            {summary.debtorsCount || 0}
          </div>
          <span className="text-[11px] text-content-secondary block mt-1">Active customer accounts</span>
        </div>

        <div className="bg-surface border border-borderline rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
          <span className="text-[11px] font-bold text-content-secondary uppercase tracking-wider block">{t('udhaar.totalCredit')}</span>
          <div className="text-2xl md:text-3xl font-extrabold text-[#256D85] dark:text-[#368AA5] mt-1 tracking-tight">
            {formatCurrency(summary.totalCreditGiven || 0)}
          </div>
          <span className="text-[11px] text-content-secondary block mt-1">Cumulative credit granted</span>
        </div>

        <div className="bg-surface border border-borderline rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
          <span className="text-[11px] font-bold text-content-secondary uppercase tracking-wider block">{t('udhaar.totalCollected')}</span>
          <div className="text-2xl md:text-3xl font-extrabold text-emerald-600 mt-1 tracking-tight">
            {formatCurrency(summary.totalCollected || 0)}
          </div>
          <span className="text-[11px] text-content-secondary block mt-1">Total repayments received</span>
        </div>
      </div>

      {/* Search & Debtors List */}
      <div className="bg-surface border border-borderline rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-borderline flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F5F7FA] dark:bg-slate-800 border border-borderline rounded-lg text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-[#256D85]/30 focus:border-[#256D85] font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-content-secondary font-bold border-b border-borderline">
                <th className="p-4">Customer Name & Code</th>
                <th className="p-4 hidden sm:table-cell">Mobile</th>
                <th className="p-4 text-right hidden md:table-cell">Total Purchases</th>
                <th className="p-4 text-right">Pending Udhaar Due</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderline">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-content-muted">
                    Loading Udhaar records...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-content-muted">
                    No customers with outstanding credit balance. Great job!
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-content-primary text-sm">{c.name}</div>
                      <div className="text-[11px] text-content-secondary font-mono flex items-center gap-2">
                        <span>{c.customerCode}</span>
                        <span className="sm:hidden text-content-primary font-sans">{c.mobile}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-content-secondary hidden sm:table-cell">{c.mobile}</td>
                    <td className="p-4 text-right font-medium text-content-secondary hidden md:table-cell">
                      {formatCurrency(c.totalPurchases)}
                    </td>
                    <td className="p-4 text-right font-extrabold text-[#D97706] text-sm">
                      {formatCurrency(c.currentBalance)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Record Repayment Button (Amber CTA) */}
                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setRepayAmount(c.currentBalance.toString());
                            setIsRepayModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
                        >
                          Collect ₹
                        </button>

                        {/* WhatsApp Reminder Button (Success Green) */}
                        <button
                          onClick={() => handleSendReminder(c._id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                          title="Send pre-filled WhatsApp reminder with UPI payment link"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Ledger View Button (Outline) */}
                        <button
                          onClick={() => {
                            setLedgerCustomer(c);
                            setIsLedgerModalOpen(true);
                          }}
                          className="p-1.5 bg-[#F5F7FA] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-content-secondary rounded-lg border border-borderline transition-colors"
                          title="View Ledger Statement"
                        >
                          <History className="w-4 h-4" />
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
          <div className="p-4 bg-[#F5F7FA] dark:bg-slate-800 rounded-lg border border-borderline flex items-center justify-between">
            <div>
              <span className="text-content-secondary text-xs block">Outstanding Due:</span>
              <span className="text-xl font-extrabold text-[#D97706]">
                {formatCurrency(selectedCustomer?.currentBalance || 0)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRepayAmount(selectedCustomer?.currentBalance.toString() || '')}
              className="text-xs bg-surface text-content-primary hover:bg-slate-100 font-bold px-3 py-1.5 rounded-lg border border-borderline"
            >
              Pay Full Amount
            </button>
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Repayment Amount (₹) *</label>
            <input
              type="number"
              step="any"
              required
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              className="vf-input text-base font-bold"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="vf-input"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Reference / UTR Number</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="vf-input"
              placeholder="e.g. UPI Ref / Cheque No."
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Notes</label>
            <input
              type="text"
              value={repayNotes}
              onChange={(e) => setRepayNotes(e.target.value)}
              className="vf-input"
              placeholder="Optional notes"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRepayModalOpen(false)}
              className="vf-btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPaymentMutation.isPending}
              className="vf-btn-primary"
            >
              {recordPaymentMutation.isPending ? 'Saving...' : 'Confirm Repayment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Ledger History Modal */}
      <Modal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        title={`Customer Ledger Statement: ${ledgerCustomer?.name}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center p-3 bg-[#F5F7FA] dark:bg-slate-800 rounded-lg border border-borderline">
            <div>
              <span className="text-content-secondary block">Customer Code:</span>
              <span className="font-mono font-bold text-content-primary">{ledgerCustomer?.customerCode}</span>
            </div>
            <div>
              <span className="text-content-secondary block">Current Due:</span>
              <span className="font-bold text-[#D97706] text-sm">
                {formatCurrency(ledgerCustomer?.currentBalance || 0)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-content-secondary font-bold border-b border-borderline">
                  <th className="p-2.5">Date & Time</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5 text-right">Balance After</th>
                  <th className="p-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderline">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-content-muted">
                      No ledger transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 text-content-secondary">{formatDateTime(entry.createdAt)}</td>
                      <td className="p-2.5 font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                            entry.type === 'CREDIT_GIVEN'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-[#D97706]'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                          }`}
                        >
                          {entry.type === 'CREDIT_GIVEN' ? 'Udhaar Added' : 'Payment Received'}
                        </span>
                      </td>
                      <td className={`p-2.5 text-right font-bold ${entry.type === 'CREDIT_GIVEN' ? 'text-[#D97706]' : 'text-emerald-600'}`}>
                        {entry.type === 'CREDIT_GIVEN' ? `+₹${entry.amount}` : `-₹${entry.amount}`}
                      </td>
                      <td className="p-2.5 text-right font-bold text-content-primary">
                        {formatCurrency(entry.balanceAfter)}
                      </td>
                      <td className="p-2.5 text-content-secondary truncate max-w-[150px]">
                        {entry.invoiceNumber ? `Bill #${entry.invoiceNumber}` : entry.paymentMethod || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
