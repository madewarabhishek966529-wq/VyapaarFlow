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
  ShoppingBag
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

  // Filtered products for quick-select
  const filteredProducts = products.filter((p: any) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  // Add product to cart
  const addToCart = (product: any) => {
    const existingIndex = cart.findIndex((item) => item.productId === product._id);

    if (existingIndex > -1) {
      const updated = [...cart];
      const item = updated[existingIndex];
      const newQty = item.quantity + 1;
      const base = newQty * item.unitPrice;
      const discAmt = (base * item.discountPercent) / 100;
      const taxable = base - discAmt;
      const taxAmt = (taxable * item.taxRate) / 100;

      updated[existingIndex] = {
        ...item,
        quantity: newQty,
        discountAmount: discAmt,
        taxAmount: taxAmt,
        totalPrice: Math.round((taxable + taxAmt) * 100) / 100
      };
      setCart(updated);
    } else {
      const base = 1 * product.sellingPrice;
      const taxAmt = (base * (product.taxRate || 0)) / 100;
      setCart([
        ...cart,
        {
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          barcode: product.barcode,
          unit: product.unit || 'pcs',
          quantity: 1,
          unitPrice: product.sellingPrice,
          mrp: product.mrp,
          discountPercent: 0,
          discountAmount: 0,
          taxRate: product.taxRate || 0,
          taxAmount: taxAmt,
          totalPrice: Math.round((base + taxAmt) * 100) / 100
        }
      ]);
    }
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Barcode scanned handler
  const handleBarcodeScanned = (scannedCode: string) => {
    const match = products.find(
      (p: any) => p.barcode === scannedCode || p.sku.toLowerCase() === scannedCode.toLowerCase()
    );
    if (match) {
      addToCart(match);
    } else {
      alert(`No product found with barcode / SKU: ${scannedCode}`);
    }
  };

  // Update quantity
  const updateQty = (index: number, delta: number) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = Math.max(1, item.quantity + delta);
    const base = newQty * item.unitPrice;
    const discAmt = (base * item.discountPercent) / 100;
    const taxable = base - discAmt;
    const taxAmt = (taxable * item.taxRate) / 100;

    updated[index] = {
      ...item,
      quantity: newQty,
      discountAmount: discAmt,
      taxAmount: taxAmt,
      totalPrice: Math.round((taxable + taxAmt) * 100) / 100
    };
    setCart(updated);
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Calculate bill totals
  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const billDiscountAmount = Math.round((subtotal * billDiscountPercent) / 100 * 100) / 100;
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
        particleCount: 50,
        spread: 60,
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-20 right-6 bg-success text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-xs">{successToast}</span>
        </div>
      )}

      {/* POS Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-softgrey-border shadow-sm">
        {/* Product Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('pos.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-pearl rounded-xl border border-softgrey-border text-xs focus:outline-none focus:ring-2 focus:ring-coral font-medium"
          />

          {/* Search Dropdown Results */}
          {filteredProducts.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-softgrey-border max-h-64 overflow-y-auto z-40 divide-y divide-softgrey-border">
              {filteredProducts.slice(0, 10).map((p: any) => (
                <button
                  key={p._id}
                  onClick={() => addToCart(p)}
                  className="w-full text-left p-3 hover:bg-pearl flex items-center justify-between text-xs transition"
                >
                  <div>
                    <div className="font-bold text-navy">{p.name}</div>
                    <div className="text-[11px] text-slate-500">
                      SKU: {p.sku} {p.barcode && `| Barcode: ${p.barcode}`} | Stock: {p.currentStock} {p.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-coral">{formatCurrency(p.sellingPrice)}</div>
                    <div className="text-[10px] text-slate-400 line-through">MRP: {formatCurrency(p.mrp)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scan Barcode Button */}
        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl shadow transition"
        >
          <Camera className="w-4 h-4 text-coral" />
          <span>{t('pos.scanBarcode')}</span>
        </button>

        {/* Customer Selector */}
        <div className="flex items-center gap-2">
          {selectedCustomer ? (
            <div className="flex items-center gap-2 bg-pearl px-3 py-1.5 rounded-xl border border-softgrey-border text-xs">
              <div>
                <span className="font-bold text-navy">{selectedCustomer.name}</span>
                <span className="text-[11px] text-slate-500 block">{selectedCustomer.mobile}</span>
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
              className="flex items-center gap-1.5 px-3 py-2 bg-pearl hover:bg-softgrey-light text-navy font-semibold text-xs rounded-xl border border-softgrey-border transition"
            >
              <UserPlus className="w-3.5 h-3.5 text-coral" />
              <span>{t('pos.selectCustomer')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Cart Items Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-softgrey-border shadow-sm flex flex-col min-h-[480px]">
          <div className="p-4 border-b border-softgrey-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-coral" />
              <h2 className="font-bold text-sm text-navy">Billing Items ({cart.length})</h2>
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
          <div className="flex-1 overflow-x-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <ShoppingBag className="w-12 h-12 text-slate-200 mb-2" />
                <p className="text-xs font-medium">{t('pos.cartEmpty')}</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-md">
                  <span className="text-[11px] text-slate-500">Quick add:</span>
                  {products.slice(0, 4).map((p) => (
                    <button
                      key={p._id}
                      onClick={() => addToCart(p)}
                      className="text-xs bg-pearl px-2.5 py-1 rounded-lg border border-softgrey-border hover:border-coral text-slate-700 font-medium"
                    >
                      + {p.name.substring(0, 18)}...
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-pearl text-slate-600 font-bold border-b border-softgrey-border">
                    <th className="p-3">#</th>
                    <th className="p-3">{t('pos.item')}</th>
                    <th className="p-3 text-right">{t('pos.price')}</th>
                    <th className="p-3 text-center">{t('pos.qty')}</th>
                    <th className="p-3 text-right">GST %</th>
                    <th className="p-3 text-right">{t('pos.amount')}</th>
                    <th className="p-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-softgrey-border">
                  {cart.map((item, idx) => (
                    <tr key={idx} className="hover:bg-pearl/50">
                      <td className="p-3 text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-navy">{item.productName}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.sku} • {item.unit}
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-pearl border border-softgrey-border rounded-lg p-0.5">
                          <button
                            onClick={() => updateQty(idx, -1)}
                            className="p-1 hover:bg-white rounded text-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-bold text-navy">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(idx, 1)}
                            className="p-1 hover:bg-white rounded text-slate-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right text-slate-500 font-medium">{item.taxRate}%</td>
                      <td className="p-3 text-right font-black text-navy">
                        {formatCurrency(item.totalPrice)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-1 text-slate-300 hover:text-coral transition"
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

        {/* Right: Bill Summary & Checkout Panel (1 col) */}
        <div className="bg-white rounded-2xl border border-softgrey-border shadow-sm p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="font-black text-base text-navy border-b border-softgrey-border pb-3">
              Payment & Checkout
            </h3>

            {/* Bill Discount Input */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">{t('pos.billDiscount')}:</span>
              <div className="flex items-center gap-1 w-24">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={billDiscountPercent || ''}
                  onChange={(e) => setBillDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full px-2 py-1 bg-pearl border border-softgrey-border rounded-lg text-center font-bold text-xs"
                  placeholder="0"
                />
                <span className="text-slate-500">%</span>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-softgrey-border">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {billDiscountAmount > 0 && (
                <div className="flex justify-between text-coral font-semibold">
                  <span>Discount ({billDiscountPercent}%):</span>
                  <span>-{formatCurrency(billDiscountAmount)}</span>
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>GST Breakdown:</span>
                  <span>{formatCurrency(totalTax)}</span>
                </div>
              )}
              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Round Off:</span>
                  <span>{roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-navy border-t border-softgrey-border pt-2">
                <span>Grand Total:</span>
                <span className="text-coral text-xl">{formatCurrency(roundedGrandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 block mb-2">{t('pos.paymentMode')}</span>
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
                        ? 'bg-navy text-white border-navy shadow-md'
                        : 'bg-pearl text-slate-700 border-softgrey-border hover:border-slate-300'
                    }`}
                  >
                    {mode === 'UPI' ? 'UPI / QR Code' : mode === 'UDHAAR' ? 'Udhaar (Credit)' : mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tendering Quick Calculator */}
            {paymentMethod === 'CASH' && (
              <div className="bg-pearl p-3 rounded-xl border border-softgrey-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-600">Cash Received:</span>
                  <input
                    type="number"
                    placeholder="₹ Received"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-28 px-2 py-1 bg-white border border-softgrey-border rounded-lg text-right font-bold"
                  />
                </div>
                {cashGivenNum > 0 && (
                  <div className="flex items-center justify-between font-bold text-success pt-1 border-t border-slate-200">
                    <span>Change to Return:</span>
                    <span className="text-sm">{formatCurrency(cashChange)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkout Action Button */}
          <div className="pt-3 border-t border-softgrey-border">
            <button
              onClick={() => handleCompleteSale()}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-3.5 bg-coral hover:bg-coral-hover disabled:bg-slate-300 text-white font-black text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isSubmitting ? 'Processing Bill...' : t('pos.completeSale')}</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Press <kbd className="bg-slate-100 px-1 rounded font-mono">Ctrl+Enter</kbd> to quick-print
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
          <form onSubmit={handleCreateCustomer} className="p-3 bg-pearl rounded-xl border border-softgrey-border space-y-2">
            <span className="font-bold text-navy block">+ Add New Customer</span>
            <input
              type="text"
              placeholder="Full Name"
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-softgrey-border rounded-lg text-xs"
              required
            />
            <input
              type="tel"
              placeholder="10-digit Mobile Number"
              value={newCustMobile}
              onChange={(e) => setNewCustMobile(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-softgrey-border rounded-lg text-xs"
              pattern="[6-9][0-9]{9}"
              required
            />
            <button
              type="submit"
              className="w-full py-2 bg-navy text-white font-bold rounded-lg hover:bg-navy-light transition"
            >
              Save & Select Customer
            </button>
          </form>

          {/* Existing Customers List */}
          <div>
            <span className="font-bold text-slate-600 block mb-2">Existing Customers:</span>
            <div className="max-h-48 overflow-y-auto divide-y divide-softgrey-border">
              {customers.map((c: any) => (
                <button
                  key={c._id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setIsCustomerModalOpen(false);
                  }}
                  className="w-full text-left p-2.5 hover:bg-pearl flex items-center justify-between transition"
                >
                  <div>
                    <span className="font-bold text-navy">{c.name}</span>
                    <span className="text-[11px] text-slate-400 block">{c.mobile}</span>
                  </div>
                  {c.currentBalance > 0 && (
                    <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded">
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
