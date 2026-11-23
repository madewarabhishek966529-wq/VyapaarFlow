import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Modal } from '../components/Modal';
import { Truck, Plus, Search, Phone, FileText, ShoppingCart } from 'lucide-react';

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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-softgrey-border shadow-sm">
        <div>
          <h1 className="text-xl font-black text-navy flex items-center gap-2">
            <Truck className="w-5 h-5 text-coral" />
            <span>{t('nav.suppliers')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supplier directory, purchase invoices, and payable balance tracking
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-coral hover:bg-coral-hover text-white text-xs font-bold rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Supplier</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-softgrey-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-softgrey-border">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search suppliers by name or phone..."
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
                <th className="p-3.5">Supplier Name & Contact</th>
                <th className="p-3.5">GSTIN</th>
                <th className="p-3.5 text-right">Total Purchases</th>
                <th className="p-3.5 text-right">Payable Balance</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-softgrey-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Loading suppliers...</td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No suppliers added yet</td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-pearl/50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-navy text-sm">{s.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {s.contactPerson ? `${s.contactPerson} • ` : ''}Ph: {s.mobile}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 font-semibold">{s.gstin || '-'}</td>
                    <td className="p-3.5 text-right font-semibold text-slate-800">
                      {formatCurrency(s.totalPurchases)}
                    </td>
                    <td className="p-3.5 text-right font-black text-sm">
                      <span className={s.outstandingBalance > 0 ? 'text-coral' : 'text-slate-400'}>
                        {formatCurrency(s.outstandingBalance)}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          setSelectedSupplier(s);
                          setIsPurchaseModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-navy hover:bg-navy-light text-white font-bold rounded-lg text-xs shadow transition flex items-center gap-1 mx-auto"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-coral" />
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
            <label className="font-bold text-slate-700 block mb-1">Company / Supplier Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
              placeholder="e.g. Pune Metro FMCG Distributors"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Contact Person</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
            <input
              type="tel"
              required
              pattern="[6-9][0-9]{9}"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">GSTIN</label>
            <input
              type="text"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono uppercase"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-softgrey-border">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-softgrey hover:bg-softgrey-border text-navy font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addSupplierMutation.isPending}
              className="px-5 py-2 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl shadow"
            >
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Purchase Stock-In Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title={`Record Purchase from ${selectedSupplier?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Purchase Invoice Number *</label>
            <input
              type="text"
              required
              value={purchaseInvoiceNo}
              onChange={(e) => setPurchaseInvoiceNo(e.target.value)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono"
              placeholder="e.g. INV-SUP-8902"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Product to Stock-In *</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find((x) => x._id === e.target.value);
                if (p) setPurchasePrice(p.purchasePrice);
              }}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-semibold"
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Purchase Cost (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Amount Paid to Supplier Now (₹)</label>
            <input
              type="number"
              min="0"
              value={amountPaid}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-bold text-success"
              placeholder="0 (Full Udhaar)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-softgrey-border">
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(false)}
              className="px-4 py-2 bg-softgrey hover:bg-softgrey-border text-navy font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPurchaseMutation.isPending}
              className="px-5 py-2 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl shadow"
            >
              Record & Add Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
