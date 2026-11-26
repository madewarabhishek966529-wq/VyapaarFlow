import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../lib/utils';
import { Modal } from '../components/Modal';
import { Truck, Plus, Search, ShoppingCart } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  // Add Supplier form
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    mobile: '',
    email: '',
    address: '',
    gstin: ''
  });

  // Purchase Stock-In form
  const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState<number>(10);
  const [purchasePrice, setPurchasePrice] = useState<number>(100);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Queries
  const { data: supData, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => api.get(`/suppliers?search=${encodeURIComponent(search)}`)
  });

  const { data: prodData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products?limit=200')
  });

  const suppliers: any[] = supData?.data || [];
  const products: any[] = prodData?.data?.products || [];

  const addSupplierMutation = useMutation({
    mutationFn: (payload: any) => api.post('/suppliers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsAddModalOpen(false);
      setFormData({ name: '', contactPerson: '', mobile: '', email: '', address: '', gstin: '' });
    },
    onError: (err: any) => alert(`Failed to add supplier: ${err.message}`)
  });

  const recordPurchaseMutation = useMutation({
    mutationFn: (payload: any) => api.post('/suppliers/purchase', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsPurchaseModalOpen(false);
      setSelectedSupplier(null);
      alert('Stock purchase recorded and inventory updated successfully!');
    },
    onError: (err: any) => alert(`Failed to record purchase: ${err.message}`)
  });

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !selectedProductId) return;

    const prod = products.find((p) => p._id === selectedProductId);
    if (!prod) return;

    recordPurchaseMutation.mutate({
      supplierId: selectedSupplier._id,
      purchaseInvoiceNo: purchaseInvoiceNo || `PO-${Date.now().toString().slice(-4)}`,
      items: [
        {
          productId: prod._id,
          productName: prod.name,
          unit: prod.unit,
          quantity: purchaseQty,
          purchasePrice: purchasePrice,
          taxRate: prod.taxRate || 0
        }
      ],
      amountPaid: parseFloat(amountPaid as any) || 0,
      paymentMethod: 'CASH'
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-xl border border-borderline shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#256D85]/10 text-[#256D85] dark:text-[#368AA5] border border-[#256D85]/20">
              <Truck className="w-3.5 h-3.5" />
              Vendor Operations
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#142D4E] dark:text-white tracking-tight">
            {t('nav.suppliers')}
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            Supplier directory, purchase invoices, and payable balance tracking
          </p>
        </div>

        {/* Primary CTA (Amber) */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Supplier</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-surface rounded-xl border border-borderline shadow-card overflow-hidden">
        <div className="p-4 border-b border-borderline">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search suppliers by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F5F7FA] dark:bg-slate-800 border border-borderline rounded-lg text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-[#256D85]/30 focus:border-[#256D85]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-content-secondary font-bold border-b border-borderline">
                <th className="p-4">Supplier Name & Contact</th>
                <th className="p-4">GSTIN</th>
                <th className="p-4 text-right">Total Purchases</th>
                <th className="p-4 text-right">Payable Balance</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderline">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-content-muted">Loading suppliers...</td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-content-muted">No suppliers added yet</td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-content-primary text-sm">{s.name}</div>
                      <div className="text-[11px] text-content-secondary mt-0.5">
                        {s.contactPerson ? `${s.contactPerson} • ` : ''}Ph: {s.mobile}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-content-secondary font-semibold">{s.gstin || '-'}</td>
                    <td className="p-4 text-right font-semibold text-content-primary">
                      {formatCurrency(s.totalPurchases)}
                    </td>
                    <td className="p-4 text-right font-extrabold text-sm">
                      <span className={s.outstandingBalance > 0 ? 'text-[#D97706]' : 'text-content-muted'}>
                        {formatCurrency(s.outstandingBalance)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedSupplier(s);
                          setIsPurchaseModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-[#256D85] hover:bg-[#1E576B] text-white font-bold rounded-lg text-xs shadow-sm transition-colors flex items-center gap-1 mx-auto"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Record Purchase</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Supplier" maxWidth="max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addSupplierMutation.mutate(formData);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="font-bold text-content-secondary block mb-1">Company / Supplier Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="vf-input"
              placeholder="e.g. Pune Metro FMCG Distributors"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Contact Person</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="vf-input"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Mobile Number *</label>
            <input
              type="tel"
              required
              pattern="[6-9][0-9]{9}"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="vf-input font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">GSTIN</label>
            <input
              type="text"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              className="vf-input font-mono uppercase"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-borderline">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="vf-btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addSupplierMutation.isPending}
              className="vf-btn-primary"
            >
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title={`Record Purchase from: ${selectedSupplier?.name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-content-secondary block mb-1">Supplier Invoice #</label>
            <input
              type="text"
              value={purchaseInvoiceNo}
              onChange={(e) => setPurchaseInvoiceNo(e.target.value)}
              placeholder="e.g. INV-99881"
              className="vf-input"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Product Purchased *</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find((x) => x._id === e.target.value);
                if (p) setPurchasePrice(p.purchasePrice || 0);
              }}
              className="vf-input"
            >
              <option value="">-- Select Product --</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku}) • Current Stock: {p.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-content-secondary block mb-1">Quantity Received</label>
              <input
                type="number"
                min="1"
                required
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(parseFloat(e.target.value) || 0)}
                className="vf-input"
              />
            </div>
            <div>
              <label className="font-bold text-content-secondary block mb-1">Purchase Rate (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="vf-input"
              />
            </div>
          </div>

          <div className="p-3 bg-[#F5F7FA] dark:bg-slate-800 rounded-lg border border-borderline flex justify-between font-bold text-content-primary">
            <span>Total Purchase Amount:</span>
            <span className="text-[#142D4E] dark:text-white">{formatCurrency(purchaseQty * purchasePrice)}</span>
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Amount Paid to Supplier Now (₹)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={amountPaid}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              className="vf-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(false)}
              className="vf-btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPurchaseMutation.isPending}
              className="vf-btn-primary"
            >
              Confirm Stock-In
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
