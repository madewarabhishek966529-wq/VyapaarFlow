import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Modal } from '../components/Modal';
import { DEFAULT_CATEGORIES, UNITS } from '@vyapaarflow/shared';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  History,
  Edit2,
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
      queryClient.invalidateQueries({ queryKey: ['products-pos'] });
      queryClient.invalidateQueries({ queryKey: ['products-all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
      queryClient.invalidateQueries({ queryKey: ['products-pos'] });
      queryClient.invalidateQueries({ queryKey: ['products-all'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      barcode: '',
      category: DEFAULT_CATEGORIES[0],
      brand: '',
      unit: 'pcs',
      purchasePrice: 0,
      sellingPrice: 0,
      mrp: 0,
      taxRate: 0,
      currentStock: 10,
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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="bg-surface border border-borderline rounded-xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#256D85]/10 text-[#256D85] dark:text-[#368AA5] border border-[#256D85]/20">
              <Boxes className="w-3.5 h-3.5" />
              Catalogue & Stock Ledger
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#142D4E] dark:text-white tracking-tight flex items-center gap-2">
            <span>{t('inventory.title')}</span>
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            Manage product prices, barcodes, units, and auditable stock movement transactions.
          </p>
        </div>

        {/* Primary Action Button (Amber CTA) */}
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{t('inventory.addProductBtn')}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface border border-borderline rounded-xl p-3.5 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, barcode, SKU, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F5F7FA] dark:bg-slate-800 border border-borderline rounded-lg text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-[#256D85]/30 focus:border-[#256D85] font-medium"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-[#F5F7FA] dark:bg-slate-800 border border-borderline rounded-lg font-medium text-content-primary focus:outline-none focus:ring-2 focus:ring-[#256D85]/30"
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
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold border transition-colors ${
            lowStockFilter
              ? 'bg-amber-50 dark:bg-amber-950/40 border-[#D97706] text-[#D97706]'
              : 'bg-surface text-content-secondary border-borderline hover:border-[#256D85]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-surface border border-borderline rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-content-secondary font-bold border-b border-borderline">
                <th className="p-4">Product Name & SKU</th>
                <th className="p-4 hidden sm:table-cell">Category</th>
                <th className="p-4 text-center">Stock Status</th>
                <th className="p-4 text-right hidden md:table-cell">Cost Price</th>
                <th className="p-4 text-right">Selling Rate</th>
                <th className="p-4 text-right hidden lg:table-cell">MRP</th>
                <th className="p-4 text-center hidden md:table-cell">GST %</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderline">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-content-muted">
                    Loading inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-content-muted">
                    No products found matching your filter criteria
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.currentStock <= (p.minStockLevel || 5);
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-content-primary text-sm">{p.name}</div>
                        <div className="text-[11px] text-content-secondary mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="font-mono bg-[#F5F7FA] dark:bg-slate-800 border border-borderline px-1.5 py-0.2 rounded text-content-primary font-medium">
                            {p.sku}
                          </span>
                          <span className="sm:hidden text-content-secondary">{p.category}</span>
                          {p.barcode && <span className="hidden sm:inline">Barcode: {p.barcode}</span>}
                          {p.brand && <span className="hidden sm:inline">Brand: {p.brand}</span>}
                        </div>
                      </td>
                      <td className="p-4 text-content-secondary font-medium hidden sm:table-cell">{p.category}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isOut
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300'
                              : isLow
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300'
                          }`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-content-secondary hidden md:table-cell">
                        {formatCurrency(p.purchasePrice)}
                      </td>
                      <td className="p-4 text-right font-extrabold text-content-primary text-sm">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="p-4 text-right font-medium text-content-muted line-through hidden lg:table-cell">
                        {formatCurrency(p.mrp)}
                      </td>
                      <td className="p-4 text-center font-semibold text-content-secondary hidden md:table-cell">{p.taxRate}%</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Stock Adjust button */}
                          <button
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustData({ type: 'ADJUSTMENT_ADD', quantity: 1, reason: '' });
                              setIsAdjustModalOpen(true);
                            }}
                            className="p-1.5 text-content-secondary hover:text-[#256D85] hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Adjust Stock"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>

                          {/* Audit History button */}
                          <button
                            onClick={() => {
                              setHistoryProduct(p);
                              setIsHistoryModalOpen(true);
                            }}
                            className="p-1.5 text-content-secondary hover:text-[#256D85] hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Stock Movement Ledger"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-content-secondary hover:text-[#D97706] hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
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
              <label className="font-bold text-content-secondary block mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="vf-input"
                placeholder="e.g. Aashirvaad Atta 10kg"
              />
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="vf-input font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">Barcode (EAN / UPC)</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="vf-input font-mono"
                placeholder="e.g. 8901030012011"
              />
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="vf-input"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">Unit of Measurement</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="vf-input"
              >
                {UNITS.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="vf-input"
                placeholder="e.g. ITC, Tata, Amul"
              />
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">Cost / Purchase Price (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                className="vf-input"
              />
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">Selling Rate (₹) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="vf-input"
              />
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">MRP (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                className="vf-input"
              />
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">GST Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="28"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                className="vf-input"
              />
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">Current Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                className="vf-input"
              />
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">Low-Stock Alert Level</label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                className="vf-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-borderline">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="vf-btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveProductMutation.isPending}
              className="vf-btn-primary"
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
          <div>
            <label className="font-bold text-content-secondary block mb-1">Adjustment Type</label>
            <select
              value={adjustData.type}
              onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
              className="vf-input"
            >
              <option value="ADJUSTMENT_ADD">Stock-In (+ Add to Inventory)</option>
              <option value="ADJUSTMENT_SUB">Stock-Out (- Manual Adjustment)</option>
              <option value="DAMAGE">Damaged / Expired Write-off (-)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              required
              value={adjustData.quantity}
              onChange={(e) => setAdjustData({ ...adjustData, quantity: parseFloat(e.target.value) || 1 })}
              className="vf-input"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Reason for Adjustment</label>
            <input
              type="text"
              required
              placeholder="e.g. Expired batch, physical recount, broken seal"
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              className="vf-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="vf-btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjustStockMutation.isPending}
              className="vf-btn-primary"
            >
              {adjustStockMutation.isPending ? 'Updating...' : 'Record Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* History / Movement Ledger Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Audit Ledger: ${historyProduct?.name}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-content-secondary font-bold border-b border-borderline">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5 text-center">Change</th>
                  <th className="p-2.5 text-center">Balance</th>
                  <th className="p-2.5">Reason / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderline">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-content-muted">
                      No stock movement history recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 text-content-secondary">{formatDate(m.createdAt)}</td>
                      <td className="p-2.5 font-bold text-content-primary">{m.type}</td>
                      <td className={`p-2.5 text-center font-bold ${m.newStock < m.previousStock ? 'text-[#DC4C4C]' : 'text-emerald-600'}`}>
                        {m.newStock < m.previousStock ? `-${Math.abs(m.quantity)}` : `+${Math.abs(m.quantity)}`}
                      </td>
                      <td className="p-2.5 text-center font-bold text-content-primary">{m.newStock}</td>
                      <td className="p-2.5 text-content-secondary">{m.reason || '—'}</td>
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
