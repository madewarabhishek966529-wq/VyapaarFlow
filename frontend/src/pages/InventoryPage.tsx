import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Modal } from '../components/Modal';
import { DEFAULT_CATEGORIES, UNITS, GST_SLABS } from '@vyapaarflow/shared';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  History,
  Edit2,
  Trash2,
  CheckCircle,
  ArrowUpDown
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: DEFAULT_CATEGORIES[0],
    brand: '',
    unit: 'pcs',
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    taxRate: 0,
    currentStock: 0,
    minStockLevel: 5
  });

  const [adjustData, setAdjustData] = useState({
    type: 'ADJUSTMENT_ADD',
    quantity: 1,
    reason: ''
  });

  // Query products
  const { data, isLoading } = useQuery({
    queryKey: ['products', search, selectedCategory, lowStockFilter],
    queryFn: () =>
      api.get(
        `/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(
          selectedCategory
        )}&lowStock=${lowStockFilter}`
      )
  });

  const products: any[] = data?.data?.products || [];

  // Query stock movements for selected product
  const { data: movementsData } = useQuery({
    queryKey: ['movements', historyProduct?._id],
    queryFn: () => api.get(`/products/movements/${historyProduct?._id}`),
    enabled: !!historyProduct
  });

  const movements: any[] = movementsData?.data || [];

  // Mutations
  const saveProductMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingProduct) {
        return api.put(`/products/${editingProduct._id}`, payload);
      }
      return api.post('/products', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddEditModalOpen(false);
      setEditingProduct(null);
    },
    onError: (err: any) => {
      alert(`Failed to save product: ${err.message}`);
    }
  });

  const adjustStockMutation = useMutation({
    mutationFn: (payload: any) => api.post('/products/adjust-stock', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAdjustModalOpen(false);
      setAdjustingProduct(null);
    },
    onError: (err: any) => {
      alert(`Failed to adjust stock: ${err.message}`);
    }
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      barcode: '',
      category: DEFAULT_CATEGORIES[0],
      brand: '',
      unit: 'pcs',
      purchasePrice: 0,
      sellingPrice: 0,
      mrp: 0,
      taxRate: 0,
      currentStock: 0,
      minStockLevel: 5
    });
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category: product.category,
      brand: product.brand || '',
      unit: product.unit || 'pcs',
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      mrp: product.mrp,
      taxRate: product.taxRate || 0,
      currentStock: product.currentStock,
      minStockLevel: product.minStockLevel || 5
    });
    setIsAddEditModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProductMutation.mutate({
      ...formData,
      purchasePrice: parseFloat(formData.purchasePrice as any) || 0,
      sellingPrice: parseFloat(formData.sellingPrice as any) || 0,
      mrp: parseFloat(formData.mrp as any) || 0,
      taxRate: parseFloat(formData.taxRate as any) || 0,
      currentStock: parseFloat(formData.currentStock as any) || 0,
      minStockLevel: parseFloat(formData.minStockLevel as any) || 0
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    adjustStockMutation.mutate({
      productId: adjustingProduct._id,
      type: adjustData.type,
      quantity: parseFloat(adjustData.quantity as any) || 1,
      reason: adjustData.reason
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-softgrey-border shadow-sm">
        <div>
          <h1 className="text-xl font-black text-navy flex items-center gap-2">
            <Boxes className="w-5 h-5 text-coral" />
            <span>{t('inventory.title')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage catalogue, prices, barcode scans, and stock movement ledger
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-coral hover:bg-coral-hover text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('inventory.addProductBtn')}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-softgrey-border shadow-sm text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, barcode, SKU, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-pearl border border-softgrey-border rounded-xl focus:outline-none focus:ring-2 focus:ring-coral text-xs"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-medium text-slate-700 focus:outline-none"
        >
          <option value="All">All Categories</option>
          {DEFAULT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Low Stock Toggle */}
        <button
          onClick={() => setLowStockFilter(!lowStockFilter)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold border transition ${
            lowStockFilter
              ? 'bg-coral text-white border-coral shadow-sm'
              : 'bg-pearl text-slate-600 border-softgrey-border hover:bg-softgrey-light'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-softgrey-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-pearl text-slate-600 font-bold border-b border-softgrey-border">
                <th className="p-3.5">Product Name & SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-center">Stock Status</th>
                <th className="p-3.5 text-right">Cost Price</th>
                <th className="p-3.5 text-right">Selling Rate</th>
                <th className="p-3.5 text-right">MRP</th>
                <th className="p-3.5 text-center">GST %</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-softgrey-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No products found matching your filter criteria
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.currentStock <= (p.minStockLevel || 5);
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p._id} className="hover:bg-pearl/50 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-navy text-sm">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-medium">
                            {p.sku}
                          </span>
                          {p.barcode && <span>Barcode: {p.barcode}</span>}
                          {p.brand && <span>Brand: {p.brand}</span>}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{p.category}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isOut
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-500">
                        {formatCurrency(p.purchasePrice)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-navy">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-400 line-through">
                        {formatCurrency(p.mrp)}
                      </td>
                      <td className="p-3.5 text-center font-semibold text-slate-600">{p.taxRate}%</td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Stock Adjust button */}
                          <button
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustData({ type: 'ADJUSTMENT_ADD', quantity: 1, reason: '' });
                              setIsAdjustModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-navy hover:bg-softgrey rounded-lg transition"
                            title="Adjust Stock"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Audit History button */}
                          <button
                            onClick={() => {
                              setHistoryProduct(p);
                              setIsHistoryModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-coral hover:bg-softgrey rounded-lg transition"
                            title="Stock Movement Ledger"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-navy hover:bg-softgrey rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
                placeholder="e.g. Aashirvaad Atta 10kg"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Barcode (EAN / UPC)</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono"
                placeholder="e.g. 8901030012011"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Unit of Measurement</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
              >
                {UNITS.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
                placeholder="e.g. ITC, Tata, Amul"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Purchase Price (Cost ₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value as any })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Selling Rate (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value as any })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-bold text-coral"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">MRP (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value as any })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">GST Tax Slab</label>
              <select
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value as any })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
              >
                {GST_SLABS.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}% GST
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Current Stock *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value as any })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Min Stock Warning Level</label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value as any })}
                className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-softgrey-border">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 bg-softgrey hover:bg-softgrey-border text-navy font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveProductMutation.isPending}
              className="px-5 py-2 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl shadow"
            >
              {saveProductMutation.isPending ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock: ${adjustingProduct?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
          <div className="bg-pearl p-3 rounded-xl border border-softgrey-border">
            <span className="text-slate-500 block">Current Available Stock:</span>
            <span className="text-lg font-black text-navy">
              {adjustingProduct?.currentStock} {adjustingProduct?.unit}
            </span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Adjustment Action</label>
            <select
              value={adjustData.type}
              onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
            >
              <option value="ADJUSTMENT_ADD">+ Stock In / Add (Audit correction)</option>
              <option value="ADJUSTMENT_SUB">- Stock Out / Reduce (Discrepancy)</option>
              <option value="DAMAGE">- Damaged / Expired Goods</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Quantity</label>
            <input
              type="number"
              min="0.1"
              step="any"
              required
              value={adjustData.quantity}
              onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value as any })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Reason for Adjustment *</label>
            <input
              type="text"
              required
              placeholder="e.g. Physical inventory count correction"
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-softgrey-border">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 bg-softgrey hover:bg-softgrey-border text-navy font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjustStockMutation.isPending}
              className="px-5 py-2 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl shadow"
            >
              Confirm Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Movement Audit Ledger Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Stock Movement Ledger: ${historyProduct?.name}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-500">
            Immutable historical audit ledger of all sales deductions, purchases, and manual adjustments.
          </p>

          <div className="max-h-80 overflow-y-auto border border-softgrey-border rounded-xl divide-y divide-softgrey-border">
            {movements.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No stock movements recorded yet</div>
            ) : (
              movements.map((m: any) => (
                <div key={m._id} className="p-3 hover:bg-pearl/50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy">{m.type}</span>
                      <span className="text-[11px] text-slate-400">{formatDate(m.createdAt)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{m.reason || '-'}</div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-black text-sm ${
                        m.quantity > 0 && (m.type === 'PURCHASE' || m.type === 'ADJUSTMENT_ADD' || m.type === 'INITIAL')
                          ? 'text-success'
                          : 'text-coral'
                      }`}
                    >
                      {m.type === 'SALE' || m.type === 'ADJUSTMENT_SUB' || m.type === 'DAMAGE' ? '-' : '+'}
                      {m.quantity}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      Balance: {m.newStock}
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
