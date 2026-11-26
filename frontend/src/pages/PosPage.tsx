import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { formatCurrency } from '../lib/utils';
import { queueOfflineSale, cacheProductsOffline, getCachedProducts } from '../lib/idb';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';
import { A4InvoiceModal } from '../components/A4InvoiceModal';
import { UpiQrModal } from '../components/UpiQrModal';
import { Modal } from '../components/Modal';
import {
  Search,
  Camera,
  Trash2,
  Plus,
  Minus,
  UserPlus,
  CheckCircle,
  ShoppingBag,
  Zap
} from 'lucide-react';

interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
}

export const PosPage: React.FC = () => {
  const { business } = useAuth();
  const { t } = useLanguage();
  const { isOnline, refreshPendingCount } = useOffline();

  // Search and cart state
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [billDiscountPercent, setBillDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isUpiQrOpen, setIsUpiQrOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isA4ModalOpen, setIsA4ModalOpen] = useState(false);
  const [createdSale, setCreatedSale] = useState<any>(null);
  const [thermalText, setThermalText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Customer inline form
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch products
  const { data: prodData } = useQuery({
    queryKey: ['products-pos'],
    queryFn: async () => {
      if (isOnline) {
        const res = await api.get('/products?limit=200');
        if (res.data?.products) {
          cacheProductsOffline(res.data.products);
          return res.data.products;
        }
      }
      return getCachedProducts();
    }
  });

  // Fetch customers
  const { data: custData, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers-pos'],
    queryFn: () => api.get('/customers?limit=100'),
    enabled: isOnline
  });

  const products: any[] = prodData || [];
  const customers: any[] = custData?.data?.customers || [];

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
    );
  }, [products, searchQuery]);

  // Cart operations
  const addToCart = (product: any, quantity: number = 1) => {
    const existingIndex = cart.findIndex((item) => item.productId === product._id);
    const price = product.sellingPrice || product.mrp;
    const taxRate = product.taxRate || 0;

    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + quantity;
      const sub = newQty * price;
      const disc = Math.round(sub * (updated[existingIndex].discountPercent / 100) * 100) / 100;
      const tax = Math.round((sub - disc) * (taxRate / 100) * 100) / 100;

      updated[existingIndex].quantity = newQty;
      updated[existingIndex].discountAmount = disc;
      updated[existingIndex].taxAmount = tax;
      updated[existingIndex].totalPrice = Math.round((sub - disc) * 100) / 100;
      setCart(updated);
    } else {
      const sub = quantity * price;
      const disc = 0;
      const tax = Math.round((sub - disc) * (taxRate / 100) * 100) / 100;

      const newItem: CartItem = {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        unit: product.unit,
        quantity,
        unitPrice: price,
        mrp: product.mrp,
        discountPercent: 0,
        discountAmount: disc,
        taxRate,
        taxAmount: tax,
        totalPrice: Math.round((sub - disc) * 100) / 100
      };
      setCart([newItem, ...cart]);
    }
    setSearchQuery('');
  };

  const updateQty = (index: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      removeItem(index);
      return;
    }
    const price = updated[index].unitPrice;
    const sub = newQty * price;
    const disc = Math.round(sub * (updated[index].discountPercent / 100) * 100) / 100;
    const tax = Math.round((sub - disc) * (updated[index].taxRate / 100) * 100) / 100;

    updated[index].quantity = newQty;
    updated[index].discountAmount = disc;
    updated[index].taxAmount = tax;
    updated[index].totalPrice = Math.round((sub - disc) * 100) / 100;
    setCart(updated);
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleBarcodeScanned = (barcode: string) => {
    const matched = products.find((p) => p.barcode === barcode || p.sku === barcode);
    if (matched) {
      addToCart(matched, 1);
      setIsScannerOpen(false);
    } else {
      alert(`No product found with barcode: ${barcode}`);
    }
  };

  // Financial calculations
  const { subtotal, billDiscountAmount, taxableTotal, totalTax, roundedGrandTotal, roundOff } = useMemo(() => {
    const sub = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const disc = Math.round(sub * (billDiscountPercent / 100) * 100) / 100;
    const taxable = Math.max(0, sub - disc);
    const tax = cart.reduce((acc, item) => acc + item.taxAmount, 0);
    const rounded = Math.round(taxable);
    const rOff = Math.round((rounded - taxable) * 100) / 100;
    return {
      subtotal: sub,
      billDiscountAmount: disc,
      taxableTotal: taxable,
      totalTax: tax,
      roundedGrandTotal: rounded,
      roundOff: rOff
    };
  }, [cart, billDiscountPercent]);

  // Cash change calculations
  const cashGivenNum = parseFloat(cashTendered) || 0;
  const cashChange = Math.max(0, cashGivenNum - roundedGrandTotal);

  // Complete sale
  const handleCompleteSale = async (overrideMethod?: string) => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items before checkout.');
      return;
    }

    const effectiveMethod = overrideMethod || paymentMethod;

    if (effectiveMethod === 'UDHAAR' && !selectedCustomer) {
      alert('A registered customer is required to give Udhaar credit.');
      setIsCustomerModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    const salePayload = {
      customerId: selectedCustomer?._id,
      customerName: selectedCustomer?.name,
      customerMobile: selectedCustomer?.mobile,
      items: cart,
      subtotal,
      billDiscountPercent,
      billDiscountAmount,
      totalTax,
      roundOff,
      grandTotal: roundedGrandTotal,
      paymentMethod: effectiveMethod,
      amountPaid: effectiveMethod === 'UDHAAR' ? 0 : roundedGrandTotal,
      udhaarAmount: effectiveMethod === 'UDHAAR' ? roundedGrandTotal : 0,
      idempotencyKey: `pos-${Date.now()}-${Math.random().toString(36).substring(7)}`
    };

    try {
      let resultSale: any = null;

      if (isOnline) {
        const res = await api.post('/pos/sale', salePayload);
        resultSale = res.data;

        try {
          const recRes = await api.get(`/pos/receipt/${resultSale._id}`);
          setThermalText(recRes.data?.receiptText || '');
        } catch (e) {
          console.warn('Could not fetch thermal receipt text:', e);
        }
      } else {
        await queueOfflineSale(salePayload);
        await refreshPendingCount();
        resultSale = {
          ...salePayload,
          invoiceNumber: `OFFLINE-${Date.now().toString().slice(-4)}`,
          saleDate: new Date().toISOString()
        };
      }

      setCreatedSale(resultSale);
      setCart([]);
      setBillDiscountPercent(0);
      setCashTendered('');
      setSelectedCustomer(null);
      setSuccessToast(`Bill #${resultSale.invoiceNumber} created successfully!`);
      setTimeout(() => setSuccessToast(null), 4000);

      setIsReceiptModalOpen(true);
    } catch (err: any) {
      alert(`Error creating sale: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleCompleteSale();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCustomer, paymentMethod, subtotal]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustMobile) return;

    try {
      const res = await api.post('/customers', {
        name: newCustName,
        mobile: newCustMobile
      });
      setSelectedCustomer(res.data);
      refetchCustomers();
      setIsCustomerModalOpen(false);
      setNewCustName('');
      setNewCustMobile('');
    } catch (err: any) {
      alert(`Failed to add customer: ${err.message}`);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-20 right-6 bg-emerald-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2.5 z-50 animate-in slide-in-from-top-4 border border-emerald-500">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-xs">{successToast}</span>
        </div>
      )}

      {/* POS Top Bar */}
      <div className="bg-surface border border-borderline rounded-xl p-3.5 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-30">
        {/* Product Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('pos.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F5F7FA] dark:bg-[#1C2C40] border border-borderline rounded-lg text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-[#256D85]/30 focus:border-[#256D85] font-medium"
          />

          {/* Search Dropdown Results */}
          {filteredProducts.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface rounded-xl shadow-lg border border-borderline max-h-72 overflow-y-auto z-50 divide-y divide-borderline">
              {filteredProducts.slice(0, 10).map((p: any) => (
                <button
                  key={p._id}
                  onClick={() => addToCart(p)}
                  className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="font-bold text-content-primary">{p.name}</div>
                    <div className="text-[11px] text-content-secondary">
                      SKU: <span className="font-mono text-content-primary">{p.sku}</span> {p.barcode && `| Barcode: ${p.barcode}`} | Stock: <span className="text-emerald-600 font-bold">{p.currentStock} {p.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-[#D97706] text-sm">{formatCurrency(p.sellingPrice)}</div>
                    <div className="text-[10px] text-content-muted line-through">MRP: {formatCurrency(p.mrp)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scan Barcode Button */}
        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 border border-borderline text-content-primary text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Camera className="w-4 h-4 text-[#256D85]" />
          <span>{t('pos.scanBarcode')}</span>
        </button>

        {/* Customer Selector */}
        <div className="flex items-center gap-2">
          {selectedCustomer ? (
            <div className="flex items-center gap-2 bg-[#F5F7FA] dark:bg-[#1C2C40] px-3 py-1.5 rounded-lg border border-borderline text-xs">
              <div>
                <span className="font-bold text-content-primary">{selectedCustomer.name}</span>
                <span className="text-[11px] text-content-secondary block">{selectedCustomer.mobile}</span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-content-muted hover:text-[#DC4C4C] text-xs font-bold p-1 ml-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-content-primary font-semibold text-xs rounded-lg border border-borderline shadow-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#256D85]" />
              <span>{t('pos.selectCustomer')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Cart Items Table (8 cols) */}
        <div className="lg:col-span-8 bg-surface border border-borderline rounded-xl p-5 shadow-card flex flex-col min-h-[500px]">
          <div className="pb-3 border-b border-borderline flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#256D85]" />
              <h2 className="font-bold text-sm text-[#142D4E] dark:text-white">Billing Items ({cart.length})</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-[#DC4C4C] hover:underline font-semibold"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Table */}
          <div className="flex-1 overflow-x-auto my-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-content-secondary">
                <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-medium">{t('pos.cartEmpty')}</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-md">
                  <span className="text-[11px] text-content-muted">Quick add:</span>
                  {products.slice(0, 4).map((p) => (
                    <button
                      key={p._id}
                      onClick={() => addToCart(p)}
                      className="text-xs bg-[#F5F7FA] dark:bg-[#1C2C40] hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-md border border-borderline text-content-primary font-medium transition-colors"
                    >
                      + {p.name.substring(0, 18)}...
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="text-content-secondary font-bold border-b border-borderline">
                    <th className="p-3 hidden sm:table-cell">#</th>
                    <th className="p-3">{t('pos.item')}</th>
                    <th className="p-3 text-right hidden sm:table-cell">{t('pos.price')}</th>
                    <th className="p-3 text-center">{t('pos.qty')}</th>
                    <th className="p-3 text-right hidden md:table-cell">GST %</th>
                    <th className="p-3 text-right">{t('pos.amount')}</th>
                    <th className="p-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderline">
                  {cart.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-content-muted hidden sm:table-cell">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-content-primary text-xs sm:text-sm">{item.productName}</div>
                        <div className="text-[10px] text-content-secondary font-mono flex items-center gap-1.5 flex-wrap">
                          <span>{item.sku} • {item.unit}</span>
                          <span className="sm:hidden text-content-primary font-semibold">({formatCurrency(item.unitPrice)})</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium text-content-primary hidden sm:table-cell">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-0.5 sm:gap-1 bg-[#F5F7FA] dark:bg-slate-800 border border-borderline rounded-lg p-0.5">
                          <button
                            onClick={() => updateQty(idx, -1)}
                            className="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-content-primary transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 sm:w-7 text-center font-bold text-content-primary text-xs">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(idx, 1)}
                            className="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-content-primary transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right text-content-secondary font-medium hidden md:table-cell">{item.taxRate}%</td>
                      <td className="p-3 text-right font-extrabold text-content-primary text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrency(item.totalPrice)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-1 text-content-muted hover:text-[#DC4C4C] transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Bill Summary & Checkout Panel (4 cols) */}
        <div className="lg:col-span-4 bg-surface border border-borderline rounded-xl p-5 shadow-card flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <h3 className="font-bold text-base text-[#142D4E] dark:text-white border-b border-borderline pb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D97706]" />
              <span>Payment & Checkout</span>
            </h3>

            {/* Bill Discount Input */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-content-secondary font-medium">{t('pos.billDiscount')}:</span>
              <div className="flex items-center gap-1 w-24">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={billDiscountPercent || ''}
                  onChange={(e) => setBillDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full px-2 py-1 bg-[#F5F7FA] dark:bg-slate-800 border border-borderline rounded text-center font-bold text-xs text-content-primary"
                  placeholder="0"
                />
                <span className="text-content-secondary">%</span>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-borderline">
              <div className="flex justify-between text-content-secondary">
                <span>Subtotal:</span>
                <span className="font-semibold text-content-primary">{formatCurrency(subtotal)}</span>
              </div>
              {billDiscountAmount > 0 && (
                <div className="flex justify-between text-[#D97706] font-semibold">
                  <span>Discount ({billDiscountPercent}%):</span>
                  <span>-{formatCurrency(billDiscountAmount)}</span>
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex justify-between text-content-secondary">
                  <span>GST Breakdown:</span>
                  <span>{formatCurrency(totalTax)}</span>
                </div>
              )}
              {roundOff !== 0 && (
                <div className="flex justify-between text-content-secondary">
                  <span>Round Off:</span>
                  <span>{roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-[#142D4E] dark:text-white border-t border-borderline pt-2.5">
                <span>Grand Total:</span>
                <span className="text-[#D97706] text-2xl tracking-tight">{formatCurrency(roundedGrandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <span className="text-xs font-bold text-content-secondary block mb-2">{t('pos.paymentMode')}</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['CASH', 'UPI', 'CARD', 'UDHAAR'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setPaymentMethod(mode);
                      if (mode === 'UPI' && roundedGrandTotal > 0) {
                        setIsUpiQrOpen(true);
                      }
                    }}
                    className={`p-2.5 rounded-lg font-bold border transition-colors ${
                      paymentMethod === mode
                        ? 'bg-[#256D85] text-white border-[#256D85] shadow-sm'
                        : 'bg-surface text-content-secondary border-borderline hover:border-[#256D85]'
                    }`}
                  >
                    {mode === 'UPI' ? 'UPI / QR Code' : mode === 'UDHAAR' ? 'Udhaar (Credit)' : mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tendering Quick Calculator */}
            {paymentMethod === 'CASH' && (
              <div className="bg-[#F5F7FA] dark:bg-slate-800/60 p-3 rounded-lg border border-borderline space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-content-secondary">Cash Received:</span>
                  <input
                    type="number"
                    placeholder="₹ Received"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-28 px-2.5 py-1 bg-surface border border-borderline rounded text-right font-bold text-content-primary"
                  />
                </div>
                {cashGivenNum > 0 && (
                  <div className="flex items-center justify-between font-bold text-emerald-600 pt-1 border-t border-borderline">
                    <span>Change to Return:</span>
                    <span className="text-sm font-extrabold">{formatCurrency(cashChange)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkout Action Button (Amber Primary CTA) */}
          <div className="pt-3 border-t border-borderline">
            <button
              onClick={() => handleCompleteSale()}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-3.5 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white font-extrabold text-sm rounded-lg shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isSubmitting ? 'Processing Bill...' : t('pos.completeSale')}</span>
            </button>
            <p className="text-[10px] text-center text-content-secondary mt-2 font-mono">
              Press <kbd className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-borderline">Ctrl+Enter</kbd> to quick-print
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        sampleProducts={products}
      />

      <UpiQrModal
        isOpen={isUpiQrOpen}
        onClose={() => setIsUpiQrOpen(false)}
        upiId={business?.settings?.upiId || 'merchant@upi'}
        upiName={business?.settings?.upiName || business?.name || 'Vyapaar Merchant'}
        amount={roundedGrandTotal}
        invoiceNumber={`BILL-${Date.now().toString().slice(-4)}`}
        onConfirmPayment={() => {
          setIsUpiQrOpen(false);
          handleCompleteSale('UPI');
        }}
      />

      <ThermalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptText={thermalText}
        invoiceNumber={createdSale?.invoiceNumber || ''}
        onSwitchToA4={() => {
          setIsReceiptModalOpen(false);
          setIsA4ModalOpen(true);
        }}
      />

      <A4InvoiceModal
        isOpen={isA4ModalOpen}
        onClose={() => setIsA4ModalOpen(false)}
        sale={createdSale}
        business={business}
      />

      {/* Add Customer Inline Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={t('pos.addCustomer')}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block text-content-secondary font-medium mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="vf-input"
            />
          </div>
          <div>
            <label className="block text-content-secondary font-medium mb-1">Mobile Number</label>
            <input
              type="tel"
              required
              value={newCustMobile}
              onChange={(e) => setNewCustMobile(e.target.value)}
              placeholder="10-digit mobile number"
              className="vf-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="vf-btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="vf-btn-primary"
            >
              Add Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
