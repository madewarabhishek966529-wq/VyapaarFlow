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
  ArrowUpDown,
  Sparkles,
  Tag
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

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => api.delete(`/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      alert(`Failed to delete product: ${err.message}`);
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
      unit: product.unit,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      mrp: product.mrp,
      taxRate: product.taxRate,
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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 relative z-10">
      {/* Top Header */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bento-tag bg-aurora-cyan/15 text-aurora-cyan border-aurora-cyan/30">
              <Boxes className="w-3.5 h-3.5" />
              Catalogue & Stock Ledger
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{t('inventory.title')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage product prices, barcodes, units, and auditable stock movement transactions.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="group relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-coral via-rose-500 to-aurora-purple text-white text-xs font-bold rounded-2xl shadow-glow-coral transition transform hover:-translate-y-0.5 active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <Plus className="w-4 h-4" />
          <span>{t('inventory.addProductBtn')}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, barcode, SKU, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aurora-purple/50 font-medium"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl font-medium text-slate-300 focus:outline-none focus:ring-2 focus:ring-aurora-purple/50"
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
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold border transition active:scale-95 ${
            lowStockFilter
              ? 'bg-coral/20 border-coral text-coral shadow-glow-coral'
              : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-white/10">
                <th className="p-4">Product Name & SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Stock Status</th>
                <th className="p-4 text-right">Cost Price</th>
                <th className="p-4 text-right">Selling Rate</th>
                <th className="p-4 text-right">MRP</th>
                <th className="p-4 text-center">GST %</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
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
                    <tr key={p._id} className="hover:bg-white/[0.03] transition">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono bg-white/5 border border-white/10 px-1.5 py-0.2 rounded text-slate-300 font-medium">
                            {p.sku}
                          </span>
                          {p.barcode && <span>Barcode: {p.barcode}</span>}
                          {p.brand && <span>Brand: {p.brand}</span>}
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">{p.category}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isOut
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-glow-emerald'
                          }`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-slate-400">
                        {formatCurrency(p.purchasePrice)}
                      </td>
                      <td className="p-4 text-right font-black text-white text-sm">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="p-4 text-right font-medium text-slate-500 line-through">
                        {formatCurrency(p.mrp)}
                      </td>
                      <td className="p-4 text-center font-semibold text-slate-300">{p.taxRate}%</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Stock Adjust button */}
                          <button
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustData({ type: 'ADJUSTMENT_ADD', quantity: 1, reason: '' });
                              setIsAdjustModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
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
                            className="p-1.5 text-slate-400 hover:text-aurora-purple hover:bg-white/10 rounded-lg transition"
                            title="Stock Movement Ledger"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-coral hover:bg-white/10 rounded-lg transition"
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
              <label className="font-bold text-slate-300 block mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white"
                placeholder="e.g. Aashirvaad Atta 10kg"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl font-mono text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Barcode (EAN / UPC)</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl font-mono text-white"
                placeholder="e.g. 8901030012011"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Unit of Measurement</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white"
              >
                {UNITS.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white"
                placeholder="e.g. ITC, Tata, Amul"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Purchase Price (Cost ₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl font-bold text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Selling Price (Retail ₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl font-bold text-coral"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">MRP ₹ *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">GST Tax Slab *</label>
              <select
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white"
              >
                {GST_SLABS.map((slab) => (
                  <option key={slab} value={slab}>
                    {slab}% GST
                  </option>
                ))}
              </select>
            </div>

            {!editingProduct && (
              <div>
                <label className="font-bold text-slate-300 block mb-1">Initial Opening Stock *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl font-bold text-white"
                />
              </div>
            )}

            <div>
              <label className="font-bold text-slate-300 block mb-1">Minimum Stock Alert Level</label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-xl border border-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveProductMutation.isPending}
              className="px-5 py-2.5 bg-gradient-to-r from-coral to-aurora-purple text-white font-bold rounded-xl shadow-glow-coral transition"
            >
              {saveProductMutation.isPending ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
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
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-slate-400 block">Current Stock:</span>
            <span className="text-lg font-black text-white">
              {adjustingProduct?.currentStock} {adjustingProduct?.unit}
            </span>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Action Type</label>
            <select
              value={adjustData.type}
              onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white"
            >
              <option value="ADJUSTMENT_ADD">Stock-In / Add Units (+)</option>
              <option value="ADJUSTMENT_SUBTRACT">Stock-Out / Remove Units (-)</option>
              <option value="DAMAGE_WRITE_OFF">Damaged / Expired Goods (-)</option>
              <option value="RETURN">Customer Return (+)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Quantity</label>
            <input
              type="number"
              min="0.01"
              step="any"
              required
              value={adjustData.quantity}
              onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value as any })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl font-bold text-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Reason / Notes</label>
            <input
              type="text"
              required
              placeholder="e.g. Physical inventory count correction, Broken bottle"
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 bg-white/5 text-slate-300 rounded-xl border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjustStockMutation.isPending}
              className="px-4 py-2 bg-gradient-to-r from-coral to-aurora-purple text-white font-bold rounded-xl shadow-glow-coral"
            >
              {adjustStockMutation.isPending ? 'Updating...' : 'Record Stock Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Movement History Ledger Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Audit Trail: ${historyProduct?.name}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-400">
            Immutable movement ledger of all stock-ins, sales deductions, and adjustments.
          </p>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/5 border border-white/10 rounded-2xl bg-white/[0.02]">
            {movements.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No stock movements recorded yet</div>
            ) : (
              movements.map((m: any) => (
                <div key={m._id} className="p-3.5 flex items-center justify-between hover:bg-white/[0.03]">
                  <div>
                    <span className="font-bold text-white block">{m.type}</span>
                    <span className="text-[11px] text-slate-400">{m.reason || 'Operation ledger entry'}</span>
                    <span className="text-[10px] text-slate-500 block">{formatDate(m.createdAt)}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-black text-sm block ${
                        m.quantityChange > 0 ? 'text-emerald-400' : 'text-coral'
                      }`}
                    >
                      {m.quantityChange > 0 ? '+' : ''}
                      {m.quantityChange}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Bal: {m.balanceAfter}
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
