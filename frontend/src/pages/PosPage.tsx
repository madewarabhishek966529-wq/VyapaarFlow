import React, { useState, useEffect, useRef } from 'react';
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
import confetti from 'canvas-confetti';
import {
  Search,
  Camera,
  Trash2,
  Plus,
  Minus,
  UserPlus,
  Printer,
  QrCode,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Zap,
  Tag
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

  // Filter products for instant auto-complete
  const filteredProducts = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.barcode && p.barcode.includes(searchQuery))
      )
    : [];

  // Add product to cart
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
      updated[existingIndex].totalPrice = Math.round((sub - disc + tax) * 100) / 100;
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
        totalPrice: Math.round((sub - disc + tax) * 100) / 100
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
    updated[index].totalPrice = Math.round((sub - disc + tax) * 100) / 100;
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
  const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const billDiscountAmount = Math.round(subtotal * (billDiscountPercent / 100) * 100) / 100;
  const taxableTotal = Math.max(0, subtotal - billDiscountAmount);
  const totalTax = cart.reduce((acc, item) => acc + item.taxAmount, 0);
  const roundedGrandTotal = Math.round(taxableTotal);
  const roundOff = Math.round((roundedGrandTotal - taxableTotal) * 100) / 100;

  // Tendered cash calculation
  const cashGivenNum = parseFloat(cashTendered) || 0;
  const cashChange = cashGivenNum > roundedGrandTotal ? cashGivenNum - roundedGrandTotal : 0;

  // Complete POS Sale
  const handleCompleteSale = async (overridePaymentMethod?: string) => {
    if (cart.length === 0) return;

    const method = overridePaymentMethod || paymentMethod;
    const isUdhaar = method === 'UDHAAR';
    const amountPaid = isUdhaar ? 0 : roundedGrandTotal;
    const udhaarAmount = isUdhaar ? roundedGrandTotal : 0;

    if (isUdhaar && !selectedCustomer) {
      alert('Please select or add a customer to record an Udhaar (credit) sale!');
      setIsCustomerModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    const idempotencyKey = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

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
      paymentMethod: method,
      amountPaid,
      udhaarAmount,
      idempotencyKey
    };

    try {
      let resultSale: any = null;

      if (isOnline) {
        const res = await api.post('/pos/sale', salePayload);
        resultSale = res.data;

        // Fetch formatted thermal receipt
        try {
          const recRes = await api.get(`/pos/receipt/${resultSale._id}`);
          setThermalText(recRes.data?.receiptText || '');
        } catch (e) {
          console.warn('Could not fetch thermal receipt text:', e);
        }
      } else {
        // Queue offline in IndexedDB
        await queueOfflineSale(salePayload);
        await refreshPendingCount();
        resultSale = {
          ...salePayload,
          invoiceNumber: `OFFLINE-${Date.now().toString().slice(-4)}`,
          saleDate: new Date().toISOString()
        };
      }

      // Festive celebration animation
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.8 }
      });

      setCreatedSale(resultSale);
      setCart([]);
      setBillDiscountPercent(0);
      setCashTendered('');
      setSelectedCustomer(null);
      setSuccessToast(`Bill #${resultSale.invoiceNumber} created successfully!`);
      setTimeout(() => setSuccessToast(null), 4000);

      // Open receipt modal
      setIsReceiptModalOpen(true);
    } catch (err: any) {
      alert(`Error creating sale: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut listener: F2 for new search, Ctrl+Enter for checkout
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

  // Create new customer inline
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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 relative z-10">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-20 right-6 bg-emerald-500 text-white px-5 py-3.5 rounded-2xl shadow-glow-emerald flex items-center gap-2.5 z-50 animate-in slide-in-from-top-4 border border-emerald-400">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-xs">{successToast}</span>
        </div>
      )}

      {/* POS Top Bar */}
      <div className="glass-card p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-30">
        {/* Product Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('pos.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aurora-purple/50 font-medium"
          />

          {/* Search Dropdown Results */}
          {filteredProducts.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-glass border border-white/15 max-h-72 overflow-y-auto z-50 divide-y divide-white/5 animate-in fade-in slide-in-from-top-2">
              {filteredProducts.slice(0, 10).map((p: any) => (
                <button
                  key={p._id}
                  onClick={() => addToCart(p)}
                  className="w-full text-left p-3.5 hover:bg-white/5 flex items-center justify-between text-xs transition"
                >
                  <div>
                    <div className="font-bold text-white">{p.name}</div>
                    <div className="text-[11px] text-slate-400">
                      SKU: <span className="font-mono text-slate-300">{p.sku}</span> {p.barcode && `| Barcode: ${p.barcode}`} | Stock: <span className="text-emerald-400 font-bold">{p.currentStock} {p.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-coral text-sm">{formatCurrency(p.sellingPrice)}</div>
                    <div className="text-[10px] text-slate-500 line-through">MRP: {formatCurrency(p.mrp)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scan Barcode Button */}
        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl shadow transition active:scale-95"
        >
          <Camera className="w-4 h-4 text-coral" />
          <span>{t('pos.scanBarcode')}</span>
        </button>

        {/* Customer Selector */}
        <div className="flex items-center gap-2">
          {selectedCustomer ? (
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <div>
                <span className="font-bold text-white">{selectedCustomer.name}</span>
                <span className="text-[11px] text-slate-400 block">{selectedCustomer.mobile}</span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-coral text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-xs rounded-xl border border-white/10 transition active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5 text-coral" />
              <span>{t('pos.selectCustomer')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Cart Items Table (8 cols) */}
        <div className="lg:col-span-8 glass-card p-5 flex flex-col min-h-[500px]">
          <div className="pb-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-coral" />
              <h2 className="font-bold text-sm text-white">Billing Items ({cart.length})</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-coral hover:underline font-semibold"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Table */}
          <div className="flex-1 overflow-x-auto my-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <ShoppingBag className="w-12 h-12 text-slate-600 mb-2" />
                <p className="text-xs font-medium">{t('pos.cartEmpty')}</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-md">
                  <span className="text-[11px] text-slate-500">Quick add:</span>
                  {products.slice(0, 4).map((p) => (
                    <button
                      key={p._id}
                      onClick={() => addToCart(p)}
                      className="text-xs bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 text-slate-300 font-medium transition"
                    >
                      + {p.name.substring(0, 18)}...
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 font-bold border-b border-white/10">
                    <th className="p-3">#</th>
                    <th className="p-3">{t('pos.item')}</th>
                    <th className="p-3 text-right">{t('pos.price')}</th>
                    <th className="p-3 text-center">{t('pos.qty')}</th>
                    <th className="p-3 text-right">GST %</th>
                    <th className="p-3 text-right">{t('pos.amount')}</th>
                    <th className="p-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {cart.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.03] transition">
                      <td className="p-3 text-slate-500">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-white">{item.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.sku} • {item.unit}
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium text-slate-200">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-0.5">
                          <button
                            onClick={() => updateQty(idx, -1)}
                            className="p-1 hover:bg-white/10 rounded-lg text-slate-300 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-bold text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(idx, 1)}
                            className="p-1 hover:bg-white/10 rounded-lg text-slate-300 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right text-slate-400 font-medium">{item.taxRate}%</td>
                      <td className="p-3 text-right font-black text-white">
                        {formatCurrency(item.totalPrice)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-1 text-slate-500 hover:text-coral transition"
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
        <div className="lg:col-span-4 glass-card p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <h3 className="font-black text-base text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-coral" />
              <span>Payment & Checkout</span>
            </h3>

            {/* Bill Discount Input */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">{t('pos.billDiscount')}:</span>
              <div className="flex items-center gap-1 w-24">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={billDiscountPercent || ''}
                  onChange={(e) => setBillDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-center font-bold text-xs text-white"
                  placeholder="0"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-white/10">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span className="font-semibold text-white">{formatCurrency(subtotal)}</span>
              </div>
              {billDiscountAmount > 0 && (
                <div className="flex justify-between text-coral font-semibold">
                  <span>Discount ({billDiscountPercent}%):</span>
                  <span>-{formatCurrency(billDiscountAmount)}</span>
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>GST Breakdown:</span>
                  <span>{formatCurrency(totalTax)}</span>
                </div>
              )}
              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Round Off:</span>
                  <span>{roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-white border-t border-white/10 pt-2.5">
                <span>Grand Total:</span>
                <span className="text-coral text-2xl tracking-tight">{formatCurrency(roundedGrandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-300 block mb-2">{t('pos.paymentMode')}</span>
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
                    className={`p-2.5 rounded-xl font-bold border transition ${
                      paymentMethod === mode
                        ? 'bg-gradient-to-r from-aurora-purple/40 to-aurora-indigo/30 border-aurora-purple text-white shadow-glow-purple'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {mode === 'UPI' ? 'UPI / QR Code' : mode === 'UDHAAR' ? 'Udhaar (Credit)' : mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tendering Quick Calculator */}
            {paymentMethod === 'CASH' && (
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-300">Cash Received:</span>
                  <input
                    type="number"
                    placeholder="₹ Received"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-28 px-2.5 py-1 bg-black/40 border border-white/10 rounded-lg text-right font-bold text-white"
                  />
                </div>
                {cashGivenNum > 0 && (
                  <div className="flex items-center justify-between font-bold text-emerald-400 pt-1 border-t border-white/10">
                    <span>Change to Return:</span>
                    <span className="text-sm font-black">{formatCurrency(cashChange)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkout Action Button */}
          <div className="pt-3 border-t border-white/10">
            <button
              onClick={() => handleCompleteSale()}
              disabled={cart.length === 0 || isSubmitting}
              className="group relative w-full py-3.5 bg-gradient-to-r from-coral via-rose-500 to-aurora-purple hover:opacity-95 disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-glow-coral transition-all transform active:scale-95 flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <CheckCircle className="w-5 h-5" />
              <span>{isSubmitting ? 'Processing Bill...' : t('pos.completeSale')}</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2 font-mono">
              Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10">Ctrl+Enter</kbd> to quick-print
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
        upiId={business?.settings?.upiId || 'shop@upi'}
        payeeName={business?.name || 'VyapaarFlow Store'}
        amount={roundedGrandTotal}
        onPaymentConfirmed={() => handleCompleteSale('UPI')}
      />

      {/* Customer Select / Add Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Select or Add Customer"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          {/* Add New Customer Form */}
          <form onSubmit={handleCreateCustomer} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
            <span className="font-bold text-white block">+ Add New Customer</span>
            <input
              type="text"
              placeholder="Full Name"
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
              required
            />
            <input
              type="tel"
              placeholder="10-digit Mobile Number"
              value={newCustMobile}
              onChange={(e) => setNewCustMobile(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
              pattern="[6-9][0-9]{9}"
              required
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-coral to-aurora-purple text-white font-bold rounded-xl shadow-glow-coral transition"
            >
              Save & Select Customer
            </button>
          </form>

          {/* Existing Customers List */}
          <div>
            <span className="font-bold text-slate-400 block mb-2">Existing Customers:</span>
            <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
              {customers.map((c: any) => (
                <button
                  key={c._id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setIsCustomerModalOpen(false);
                  }}
                  className="w-full text-left p-3 hover:bg-white/5 rounded-xl flex items-center justify-between transition"
                >
                  <div>
                    <span className="font-bold text-white">{c.name}</span>
                    <span className="text-[11px] text-slate-400 block">{c.mobile}</span>
                  </div>
                  {c.currentBalance > 0 && (
                    <span className="text-[10px] font-bold text-warning bg-warning/15 border border-warning/30 px-2 py-0.5 rounded-full">
                      Udhaar: {formatCurrency(c.currentBalance)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Thermal Receipt Modal */}
      {createdSale && (
        <ThermalReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          receiptText={thermalText}
          invoiceNumber={createdSale.invoiceNumber}
        />
      )}

      {/* A4 Tax Invoice Modal */}
      {createdSale && (
        <A4InvoiceModal
          isOpen={isA4ModalOpen}
          onClose={() => setIsA4ModalOpen(false)}
          sale={createdSale}
          business={business}
        />
      )}
    </div>
  );
};
