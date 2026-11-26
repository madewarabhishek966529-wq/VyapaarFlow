import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from './Modal';
import { LiveBarcodeScanner } from './LiveBarcodeScanner';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { A4InvoiceModal } from './A4InvoiceModal';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { cacheProductsOffline, getCachedProducts, queueOfflineSale } from '../lib/idb';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import {
  Camera,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Smartphone,
  Banknote,
  BookOpen,
  Printer,
  ArrowRight,
  RotateCcw,
  PackageCheck,
  UserPlus,
  LayoutDashboard
} from 'lucide-react';

interface QuickBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'SCANNING' | 'PRODUCT_REVIEW' | 'PAYMENT' | 'DONE';

interface QuickCartItem {
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
  qualityVerified: boolean;
}

export const QuickBillModal: React.FC<QuickBillModalProps> = ({ isOpen, onClose }) => {
  const { business } = useAuth();
  const { isOnline, refreshPendingCount } = useOffline();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('SCANNING');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Scanned item currently under Product Details & Quality verification
  const [scannedProduct, setScannedProduct] = useState<any | null>(null);
  const [pendingQty, setPendingQty] = useState<number>(1);
  const [qualityChecked, setQualityChecked] = useState<boolean>(true);
  const [qualityNote, setQualityNote] = useState<string>('');

  // Quick bill cart & payment state
  const [cart, setCart] = useState<QuickCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'UDHAAR'>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [showQuickCustomerForm, setShowQuickCustomerForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Completion / Receipt state
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [thermalText, setThermalText] = useState('');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isA4Open, setIsA4Open] = useState(false);

  // Products lookup cache
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
    },
    enabled: isOpen
  });

  // Customers lookup for Udhaar
  const { data: custData, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers-pos'],
    queryFn: () => api.get('/customers?limit=100'),
    enabled: isOpen && isOnline
  });

  const products: any[] = prodData || [];
  const customers: any[] = custData?.data?.customers || [];

  // Reset cleanly every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('SCANNING');
      setScanError(null);
      setScannedProduct(null);
      setPendingQty(1);
      setQualityChecked(true);
      setQualityNote('');
      setCart([]);
      setPaymentMethod('CASH');
      setCashTendered('');
      setSelectedCustomer(null);
      setShowQuickCustomerForm(false);
      setNewCustName('');
      setNewCustMobile('');
      setCompletedSale(null);
      setThermalText('');
    }
  }, [isOpen]);

  // Helper to evaluate expiry & stock quality state
  const getProductQualityStatus = (product: any) => {
    if (!product) {
      return { isExpired: false, isExpiringSoon: false, isOutOfStock: false, isLowStock: false, daysToExpiry: null as number | null };
    }
    let isExpired = false;
    let isExpiringSoon = false;
    let daysToExpiry: number | null = null;
    if (product.expiryDate) {
      const diffMs = new Date(product.expiryDate).getTime() - Date.now();
      daysToExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      isExpired = daysToExpiry < 0;
      isExpiringSoon = daysToExpiry >= 0 && daysToExpiry <= 30;
    }
    const stock = Number(product.currentStock || 0);
    const minStock = Number(product.minStockLevel || 0);
    const isOutOfStock = stock <= 0;
    const isLowStock = stock > 0 && stock <= minStock;
    return { isExpired, isExpiringSoon, isOutOfStock, isLowStock, daysToExpiry };
  };

  // Lookup barcode across cached products, IDB, and live API
  const handleCodeScanned = async (code: string) => {
    setScanError(null);
    const normalized = code.trim();
    if (!normalized) return;

    const findMatch = (list: any[]) =>
      list.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === normalized.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase() === normalized.toLowerCase())
      );

    let matched = findMatch(products);

    if (!matched && isOnline) {
      setIsLookingUp(true);
      try {
        const res = await api.get(`/products/barcode/${encodeURIComponent(normalized)}`);
        if (res.data) {
          matched = res.data;
        }
      } catch {
        // fallback check offline IDB
      } finally {
        setIsLookingUp(false);
      }
    }

    if (!matched) {
      const offlineCached = await getCachedProducts().catch(() => []);
      matched = findMatch(offlineCached);
    }

    if (!matched) {
      setScanError(`No product matched barcode or SKU "${normalized}". Scan again or select a demo item.`);
      return;
    }

    const qStatus = getProductQualityStatus(matched);
    setScannedProduct(matched);
    setPendingQty(1);
    // Require manual confirmation checkbox when expired or out of stock
    setQualityChecked(!qStatus.isExpired && !qStatus.isOutOfStock);
    setQualityNote('');
    setStep('PRODUCT_REVIEW');
  };

  const buildCartItem = (product: any, qty: number, verified: boolean): QuickCartItem => {
    const unitPrice = product.sellingPrice > 0 ? product.sellingPrice : product.mrp;
    const taxRate = product.taxRate || 0;
    const subtotal = Math.round(qty * unitPrice * 100) / 100;
    const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;

    return {
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      barcode: product.barcode || undefined,
      unit: product.unit || 'pcs',
      quantity: qty,
      unitPrice,
      mrp: product.mrp,
      discountPercent: 0,
      discountAmount: 0,
      taxRate,
      taxAmount,
      totalPrice: subtotal,
      qualityVerified: verified
    };
  };

  const commitScannedItemToCart = (): QuickCartItem[] => {
    if (!scannedProduct) return cart;
    const qty = Math.max(1, pendingQty);
    const existingIdx = cart.findIndex((i) => i.productId === scannedProduct._id);
    let nextCart: QuickCartItem[];

    if (existingIdx > -1) {
      nextCart = [...cart];
      const combinedQty = nextCart[existingIdx].quantity + qty;
      nextCart[existingIdx] = buildCartItem(scannedProduct, combinedQty, qualityChecked);
    } else {
      nextCart = [buildCartItem(scannedProduct, qty, qualityChecked), ...cart];
    }

    setCart(nextCart);
    return nextCart;
  };

  const handleAddAndScanNext = () => {
    commitScannedItemToCart();
    setScannedProduct(null);
    setScanError(null);
    setStep('SCANNING');
  };

  const handleProceedToPayment = () => {
    commitScannedItemToCart();
    setScannedProduct(null);
    setStep('PAYMENT');
  };

  const updateCartItemQty = (idx: number, delta: number) => {
    const updated = [...cart];
    const item = updated[idx];
    const nextQty = item.quantity + delta;
    if (nextQty <= 0) {
      updated.splice(idx, 1);
      setCart(updated);
      if (updated.length === 0) {
        setStep('SCANNING');
      }
      return;
    }
    const subtotal = Math.round(nextQty * item.unitPrice * 100) / 100;
    const taxAmount = Math.round(subtotal * (item.taxRate / 100) * 100) / 100;
    updated[idx] = { ...item, quantity: nextQty, taxAmount, totalPrice: subtotal };
    setCart(updated);
  };

  // Totals calculation
  const { subtotal, totalTax, grandTotal, roundOff } = useMemo(() => {
    const sub = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const tax = cart.reduce((acc, item) => acc + item.taxAmount, 0);
    const rounded = Math.round(sub);
    const rOff = Math.round((rounded - sub) * 100) / 100;
    return {
      subtotal: Math.round(sub * 100) / 100,
      totalTax: Math.round(tax * 100) / 100,
      grandTotal: rounded,
      roundOff: rOff
    };
  }, [cart]);

  const cashGiven = parseFloat(cashTendered) || 0;
  const cashChange = Math.max(0, cashGiven - grandTotal);

  const upiId = business?.settings?.upiId || 'merchant@upi';
  const payeeName = business?.settings?.upiName || business?.name || 'VyapaarFlow Merchant';
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('VyapaarFlow Quick Bill')}`;

  const handleCreateQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustMobile.trim()) return;
    try {
      const res = await api.post('/customers', {
        name: newCustName.trim(),
        mobile: newCustMobile.trim()
      });
      setSelectedCustomer(res.data);
      setShowQuickCustomerForm(false);
      setNewCustName('');
      setNewCustMobile('');
      refetchCustomers();
    } catch (err: any) {
      alert(`Could not add customer: ${err.message}`);
    }
  };

  const invalidateDashboardAndBusinessData = () => {
    const keys = [
      'dashboard-overview',
      'products',
      'products-pos',
      'products-all',
      'customers',
      'customers-pos',
      'udhaar-summary',
      'customers-udhaar',
      'report-sales',
      'report-pnl',
      'report-tax',
      'notifications'
    ];
    keys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  const handleCompleteQuickBill = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'UDHAAR' && !selectedCustomer) {
      alert('Please select or add a customer for Udhaar (Credit) billing.');
      return;
    }

    setIsSubmitting(true);
    const salePayload = {
      customerId: selectedCustomer?._id,
      customerName: selectedCustomer?.name,
      customerMobile: selectedCustomer?.mobile,
      items: cart.map(({ qualityVerified: _qv, ...rest }) => rest),
      subtotal,
      billDiscountPercent: 0,
      billDiscountAmount: 0,
      totalTax,
      roundOff,
      grandTotal,
      paymentMethod,
      amountPaid: paymentMethod === 'UDHAAR' ? 0 : grandTotal,
      udhaarAmount: paymentMethod === 'UDHAAR' ? grandTotal : 0,
      notes: qualityNote.trim() ? `Quick Scan Bill (${qualityNote.trim()})` : 'Quick Scan Bill (Quality Verified)',
      idempotencyKey: `qbill-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    };

    try {
      let savedSale: any = null;

      if (isOnline) {
        const res = await api.post('/pos/sale', salePayload);
        savedSale = res.data;
        try {
          const recRes = await api.get(`/pos/receipt/${savedSale._id}`);
          setThermalText(recRes.data?.receiptText || '');
        } catch {
          // Receipt text fetch is non-critical
        }
      } else {
        await queueOfflineSale(salePayload);
        await refreshPendingCount();
        savedSale = {
          ...salePayload,
          invoiceNumber: `OFFLINE-${Date.now().toString().slice(-4)}`,
          saleDate: new Date().toISOString()
        };
      }

      invalidateDashboardAndBusinessData();
      setCompletedSale(savedSale);
      setStep('DONE');
    } catch (err: any) {
      alert(`Failed to complete bill: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepOrder: Step[] = ['SCANNING', 'PRODUCT_REVIEW', 'PAYMENT', 'DONE'];
  const currentStepIndex = stepOrder.indexOf(step);
  const qualityStatus = getProductQualityStatus(scannedProduct);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Quick Scan & Express Bill"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          {/* Compact 4-Step Progress Bar */}
          <div className="flex items-center justify-between gap-1.5 text-[11px] font-bold bg-app border border-borderline rounded-xl p-2">
            {[
              { id: 'SCANNING', label: '1. Camera Scan' },
              { id: 'PRODUCT_REVIEW', label: '2. Details & Quality' },
              { id: 'PAYMENT', label: '3. Payment' },
              { id: 'DONE', label: '4. Done' }
            ].map((item, idx) => {
              const isActive = step === item.id;
              const isDone = currentStepIndex > idx;
              return (
                <div
                  key={item.id}
                  className={`flex-1 text-center py-1.5 px-1.5 rounded-lg transition-colors truncate ${
                    isActive
                      ? 'bg-[#256D85] text-white shadow-sm'
                      : isDone
                      ? 'bg-emerald-500/15 text-[#16A34A]'
                      : 'text-content-muted'
                  }`}
                >
                  {item.label}
                </div>
              );
            })}
          </div>

          {/* Running Cart Indicator (when multi-item scanning) */}
          {cart.length > 0 && (step === 'SCANNING' || step === 'PRODUCT_REVIEW') && (
            <div className="flex items-center justify-between bg-[#142D4E] text-white px-3.5 py-2 rounded-xl text-xs">
              <span>
                <strong>{cart.length}</strong> {cart.length === 1 ? 'item' : 'items'} added • Total:{' '}
                <strong className="text-[#F0A43A]">{formatCurrency(grandTotal)}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep('PAYMENT')}
                className="px-3 py-1 bg-[#D97706] hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
              >
                <span>Go to Payment</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* ===================================================== */}
          {/* STEP 1: LIVE CAMERA BARCODE SCANNER                   */}
          {/* ===================================================== */}
          {step === 'SCANNING' && (
            <div className="space-y-3">
              {scanError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}
              {isLookingUp && (
                <div className="p-2.5 rounded-xl bg-[#256D85]/10 text-[#256D85] text-xs font-semibold text-center">
                  Looking up scanned barcode in store catalog...
                </div>
              )}
              <LiveBarcodeScanner
                active={isOpen && step === 'SCANNING'}
                onScan={handleCodeScanned}
                sampleProducts={products}
                compact
              />
            </div>
          )}

          {/* ===================================================== */}
          {/* STEP 2: PRODUCT DETAILS, PRICE & QUALITY VERIFICATION */}
          {/* ===================================================== */}
          {step === 'PRODUCT_REVIEW' && scannedProduct && (
            <div className="space-y-4">
              {/* Product Summary Header */}
              <div className="bg-app border border-borderline rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#256D85]/15 text-[#256D85]">
                        {scannedProduct.category || 'General'}
                      </span>
                      {scannedProduct.brand && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface border border-borderline text-content-secondary">
                          {scannedProduct.brand}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-extrabold text-[#142D4E] dark:text-white leading-snug">
                      {scannedProduct.name}
                    </h3>
                    <p className="text-[11px] font-mono text-content-secondary mt-0.5">
                      SKU: {scannedProduct.sku}
                      {scannedProduct.barcode ? ` • Barcode: ${scannedProduct.barcode}` : ''}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-[#D97706]">
                      {formatCurrency(scannedProduct.sellingPrice || scannedProduct.mrp)}
                    </div>
                    <div className="text-[11px] text-content-muted">
                      MRP:{' '}
                      <span className="line-through">{formatCurrency(scannedProduct.mrp)}</span>
                      {scannedProduct.taxRate > 0 && ` • GST ${scannedProduct.taxRate}%`}
                    </div>
                  </div>
                </div>

                {/* Quality & Stock Check Card */}
                <div className="bg-surface border border-borderline rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#142D4E] dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#256D85]" />
                      <span>Product Quality & Stock Check</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        qualityStatus.isExpired || qualityStatus.isOutOfStock
                          ? 'bg-rose-500/15 text-[#DC4C4C]'
                          : qualityStatus.isExpiringSoon || qualityStatus.isLowStock
                          ? 'bg-amber-500/15 text-[#D97706]'
                          : 'bg-emerald-500/15 text-[#16A34A]'
                      }`}
                    >
                      {qualityStatus.isExpired
                        ? 'Expired Item Alert'
                        : qualityStatus.isOutOfStock
                        ? 'Out of Stock'
                        : qualityStatus.isExpiringSoon
                        ? `Expires in ${qualityStatus.daysToExpiry}d`
                        : qualityStatus.isLowStock
                        ? 'Low Stock'
                        : 'Fresh & In Stock'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-app px-2.5 py-2 rounded-lg border border-borderline">
                      <span className="text-[10px] text-content-muted block">Available Stock</span>
                      <span className="font-bold text-content-primary">
                        {scannedProduct.currentStock} {scannedProduct.unit || 'pcs'}
                      </span>
                    </div>
                    <div className="bg-app px-2.5 py-2 rounded-lg border border-borderline">
                      <span className="text-[10px] text-content-muted block">Expiry / Shelf Life</span>
                      <span className="font-bold text-content-primary">
                        {scannedProduct.expiryDate
                          ? new Date(scannedProduct.expiryDate).toLocaleDateString('en-IN')
                          : 'Good / Non-Perishable'}
                      </span>
                    </div>
                    <div className="bg-app px-2.5 py-2 rounded-lg border border-borderline col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-content-muted block">Batch / Unit</span>
                      <span className="font-bold text-content-primary">
                        {scannedProduct.batchNumber || `1 ${scannedProduct.unit || 'pcs'}`}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Quality Confirmation Toggle */}
                  <label className="flex items-center justify-between gap-2 pt-1 cursor-pointer select-none">
                    <span className="flex items-center gap-2 text-xs font-semibold text-content-primary">
                      <input
                        type="checkbox"
                        checked={qualityChecked}
                        onChange={(e) => setQualityChecked(e.target.checked)}
                        className="w-4 h-4 accent-[#16A34A] rounded cursor-pointer"
                      />
                      <span>Make sure: Product seal & quality verified OK</span>
                    </span>
                    <PackageCheck
                      className={`w-4 h-4 ${qualityChecked ? 'text-[#16A34A]' : 'text-content-muted'}`}
                    />
                  </label>

                  {!qualityChecked && (
                    <input
                      type="text"
                      value={qualityNote}
                      onChange={(e) => setQualityNote(e.target.value)}
                      placeholder="Optional note (e.g. customer notified / replaced item)"
                      className="vf-input text-xs py-1.5"
                    />
                  )}
                </div>

                {/* Quantity & Line Total Selector */}
                <div className="flex items-center justify-between bg-surface border border-borderline rounded-xl p-3">
                  <div>
                    <span className="text-xs font-bold text-content-primary block">Quantity</span>
                    <span className="text-[11px] text-content-secondary">
                      Unit price: {formatCurrency(scannedProduct.sellingPrice || scannedProduct.mrp)} /{' '}
                      {scannedProduct.unit || 'pcs'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-1 bg-app border border-borderline rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setPendingQty((q) => Math.max(1, q - 1))}
                        className="p-1.5 rounded hover:bg-borderline/60 text-content-primary transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={pendingQty}
                        onChange={(e) => setPendingQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-12 text-center font-extrabold text-sm bg-transparent text-content-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setPendingQty((q) => q + 1)}
                        className="p-1.5 rounded hover:bg-borderline/60 text-content-primary transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right min-w-[72px]">
                      <span className="text-[10px] text-content-muted block">Item Total</span>
                      <span className="font-black text-base text-[#142D4E] dark:text-white">
                        {formatCurrency((scannedProduct.sellingPrice || scannedProduct.mrp) * pendingQty)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setScannedProduct(null);
                    setStep('SCANNING');
                  }}
                  className="px-3.5 py-2.5 vf-btn-outline rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rescan</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddAndScanNext}
                  disabled={!qualityChecked}
                  className="flex-1 py-2.5 bg-[#256D85] hover:bg-[#1C5467] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Add & Scan Next Item</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={!qualityChecked}
                  className="flex-1 py-2.5 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <span>Select Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* STEP 3: PAYMENT TYPE & FINAL DONE                     */}
          {/* ===================================================== */}
          {step === 'PAYMENT' && (
            <div className="space-y-4">
              {/* Compact Cart List */}
              <div className="bg-app border border-borderline rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                <div className="flex items-center justify-between text-[11px] font-bold text-content-secondary pb-1 border-b border-borderline">
                  <span>BILL ITEMS ({cart.length})</span>
                  <button
                    type="button"
                    onClick={() => setStep('SCANNING')}
                    className="text-[#256D85] hover:underline flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    <span>+ Scan More</span>
                  </button>
                </div>
                {cart.map((item, idx) => (
                  <div key={item.productId} className="flex items-center justify-between text-xs py-1">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-content-primary truncate">{item.productName}</div>
                      <div className="text-[11px] text-content-secondary">
                        {formatCurrency(item.unitPrice)} × {item.quantity} {item.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="inline-flex items-center gap-1 bg-surface border border-borderline rounded px-1">
                        <button
                          type="button"
                          onClick={() => updateCartItemQty(idx, -1)}
                          className="p-0.5 hover:text-[#DC4C4C]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold px-1">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartItemQty(idx, 1)}
                          className="p-0.5 hover:text-[#256D85]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-extrabold text-content-primary w-16 text-right">
                        {formatCurrency(item.totalPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(idx, -item.quantity)}
                        className="text-content-muted hover:text-[#DC4C4C]"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Banner */}
              <div className="flex items-center justify-between bg-[#142D4E] text-white px-4 py-3 rounded-xl">
                <div>
                  <span className="text-[11px] text-slate-300 block">Total Payable Amount</span>
                  <span className="text-[11px] text-slate-300">
                    {totalTax > 0 ? `Includes GST ${formatCurrency(totalTax)}` : 'Net Bill Amount'}
                  </span>
                </div>
                <span className="text-2xl font-black text-[#F0A43A]">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Payment Type Options */}
              <div>
                <span className="text-xs font-bold text-content-primary block mb-2">
                  Select Payment Type
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { key: 'CASH' as const, label: 'Cash', icon: Banknote },
                    { key: 'UPI' as const, label: 'UPI / QR', icon: Smartphone },
                    { key: 'CARD' as const, label: 'Card', icon: CreditCard },
                    { key: 'UDHAAR' as const, label: 'Udhaar', icon: BookOpen }
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const active = paymentMethod === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPaymentMethod(opt.key)}
                        className={`p-3 rounded-xl border font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                          active
                            ? 'bg-[#256D85] text-white border-[#256D85] shadow-sm'
                            : 'bg-app text-content-secondary border-borderline hover:border-[#256D85]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Helper */}
              {paymentMethod === 'CASH' && (
                <div className="bg-app border border-borderline rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-content-secondary">Cash Given (optional):</span>
                    <input
                      type="number"
                      placeholder="₹ Received"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-28 px-2.5 py-1.5 vf-input text-right font-bold text-xs"
                    />
                  </div>
                  {cashGiven > 0 && (
                    <div className="font-bold text-[#16A34A]">
                      Return: {formatCurrency(cashChange)}
                    </div>
                  )}
                </div>
              )}

              {/* Live UPI QR Inline Preview */}
              {paymentMethod === 'UPI' && (
                <div className="bg-app border border-borderline rounded-xl p-3 flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-2 bg-white rounded-xl border border-borderline shrink-0">
                    <QRCodeSVG value={upiUri} size={115} level="M" includeMargin={false} />
                  </div>
                  <div className="text-center sm:text-left space-y-1 text-xs">
                    <span className="font-bold text-[#142D4E] dark:text-white block">
                      Scan with GPay / PhonePe / Paytm
                    </span>
                    <span className="font-mono text-[#D97706] font-bold block">{upiId}</span>
                    <span className="text-[11px] text-content-secondary block">
                      Customer scans exact {formatCurrency(grandTotal)}, then press Done below.
                    </span>
                  </div>
                </div>
              )}

              {/* Udhaar Customer Picker */}
              {paymentMethod === 'UDHAAR' && (
                <div className="bg-app border border-borderline rounded-xl p-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-content-primary">Select Udhaar Customer *</span>
                    <button
                      type="button"
                      onClick={() => setShowQuickCustomerForm((s) => !s)}
                      className="text-[#256D85] font-bold hover:underline flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{showQuickCustomerForm ? 'Select Existing' : '+ New Customer'}</span>
                    </button>
                  </div>

                  {!showQuickCustomerForm ? (
                    <select
                      value={selectedCustomer?._id || ''}
                      onChange={(e) => {
                        const found = customers.find((c) => c._id === e.target.value) || null;
                        setSelectedCustomer(found);
                      }}
                      className="vf-input text-xs font-semibold"
                    >
                      <option value="">-- Choose Registered Customer --</option>
                      {customers.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.mobile})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <form onSubmit={handleCreateQuickCustomer} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Customer Name"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="vf-input text-xs flex-1"
                      />
                      <input
                        type="tel"
                        required
                        pattern="[6-9][0-9]{9}"
                        placeholder="10-digit Mobile"
                        value={newCustMobile}
                        onChange={(e) => setNewCustMobile(e.target.value)}
                        className="vf-input text-xs sm:w-36 font-mono"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-[#256D85] text-white font-bold rounded-lg text-xs shrink-0"
                      >
                        Save
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Final Done Action */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('SCANNING')}
                  className="px-4 py-3 vf-btn-outline rounded-xl text-xs font-semibold"
                >
                  Back to Scan
                </button>
                <button
                  type="button"
                  onClick={handleCompleteQuickBill}
                  disabled={isSubmitting || cart.length === 0}
                  className="flex-1 py-3 bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isSubmitting ? 'Saving Bill...' : `Done — Complete Bill (${formatCurrency(grandTotal)})`}</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* STEP 4: DONE & DASHBOARD UPDATED CONFIRMATION         */}
          {/* ===================================================== */}
          {step === 'DONE' && completedSale && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-[#16A34A] flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-[#142D4E] dark:text-white">
                  Bill #{completedSale.invoiceNumber} Saved!
                </h3>
                <p className="text-xs text-content-secondary">
                  {formatCurrency(completedSale.grandTotal)} via{' '}
                  <strong className="text-content-primary">{completedSale.paymentMethod}</strong> •
                  Sales, stock & revenue data updated on Dashboard.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                {thermalText && (
                  <button
                    type="button"
                    onClick={() => setIsReceiptOpen(true)}
                    className="px-4 py-2.5 bg-[#256D85] hover:bg-[#1C5467] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Receipt / A4</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setScannedProduct(null);
                    setCompletedSale(null);
                    setStep('SCANNING');
                  }}
                  className="px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan Next Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/dashboard');
                  }}
                  className="px-4 py-2.5 vf-btn-outline rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Done & View Dashboard</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ThermalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receiptText={thermalText}
        invoiceNumber={completedSale?.invoiceNumber || ''}
        onSwitchToA4={() => {
          setIsReceiptOpen(false);
          setIsA4Open(true);
        }}
      />

      <A4InvoiceModal
        isOpen={isA4Open}
        onClose={() => setIsA4Open(false)}
        sale={completedSale}
        business={business}
      />
    </>
  );
};
