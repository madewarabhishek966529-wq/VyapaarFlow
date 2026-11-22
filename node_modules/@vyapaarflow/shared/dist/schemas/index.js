"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockAdjustmentSchema = exports.expenseSchema = exports.udhaarPaymentSchema = exports.saleSchema = exports.saleItemSchema = exports.supplierSchema = exports.customerSchema = exports.productSchema = exports.onboardingSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    mobile: zod_1.z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number').optional()
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.onboardingSchema = zod_1.z.object({
    businessName: zod_1.z.string().min(2, 'Business name must be at least 2 characters'),
    ownerName: zod_1.z.string().min(2, 'Owner name must be at least 2 characters'),
    mobile: zod_1.z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
    email: zod_1.z.string().email('Invalid email address'),
    category: zod_1.z.nativeEnum(types_1.BusinessCategory),
    address: zod_1.z.string().min(5, 'Full street address is required'),
    city: zod_1.z.string().min(2, 'City is required'),
    state: zod_1.z.string().min(2, 'State is required'),
    pincode: zod_1.z.string().regex(/^\d{6}$/, 'Must be a valid 6-digit PIN code'),
    gstin: zod_1.z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(zod_1.z.literal('')),
    currency: zod_1.z.string().default('INR'),
    language: zod_1.z.nativeEnum(types_1.Language).default(types_1.Language.ENGLISH),
    invoicePrefix: zod_1.z.string().default('INV-'),
    startingInvoiceNumber: zod_1.z.number().int().min(1).default(1),
    upiId: zod_1.z.string().optional().or(zod_1.z.literal('')),
    upiName: zod_1.z.string().optional().or(zod_1.z.literal(''))
});
exports.productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Product name is required'),
    sku: zod_1.z.string().min(1, 'SKU is required'),
    barcode: zod_1.z.string().optional().or(zod_1.z.literal('')),
    category: zod_1.z.string().min(1, 'Category is required'),
    brand: zod_1.z.string().optional(),
    unit: zod_1.z.string().default('pcs'),
    purchasePrice: zod_1.z.number().min(0, 'Purchase price cannot be negative'),
    sellingPrice: zod_1.z.number().min(0, 'Selling price cannot be negative'),
    mrp: zod_1.z.number().min(0, 'MRP cannot be negative'),
    taxRate: zod_1.z.number().min(0).max(28).default(0),
    currentStock: zod_1.z.number().default(0),
    minStockLevel: zod_1.z.number().min(0).default(5),
    supplierId: zod_1.z.string().optional().or(zod_1.z.literal('')),
    supplierName: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    batchNumber: zod_1.z.string().optional(),
    expiryDate: zod_1.z.string().optional()
});
exports.customerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Customer name is required'),
    mobile: zod_1.z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
    email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
    address: zod_1.z.string().optional(),
    creditLimit: zod_1.z.number().min(0).optional(),
    notes: zod_1.z.string().optional()
});
exports.supplierSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Supplier name is required'),
    contactPerson: zod_1.z.string().optional(),
    mobile: zod_1.z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
    email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
    address: zod_1.z.string().optional(),
    gstin: zod_1.z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN').optional().or(zod_1.z.literal(''))
});
exports.saleItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
    productName: zod_1.z.string().min(1),
    sku: zod_1.z.string().min(1),
    barcode: zod_1.z.string().optional(),
    unit: zod_1.z.string().default('pcs'),
    quantity: zod_1.z.number().positive('Quantity must be greater than zero'),
    unitPrice: zod_1.z.number().min(0),
    mrp: zod_1.z.number().min(0),
    discountPercent: zod_1.z.number().min(0).max(100).default(0),
    discountAmount: zod_1.z.number().min(0).default(0),
    taxRate: zod_1.z.number().min(0).max(28).default(0),
    taxAmount: zod_1.z.number().min(0).default(0),
    totalPrice: zod_1.z.number().min(0),
    batchNumber: zod_1.z.string().optional()
});
exports.saleSchema = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    customerName: zod_1.z.string().optional(),
    customerMobile: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.saleItemSchema).min(1, 'Sale must contain at least 1 item'),
    subtotal: zod_1.z.number().min(0),
    billDiscountPercent: zod_1.z.number().min(0).max(100).default(0),
    billDiscountAmount: zod_1.z.number().min(0).default(0),
    totalTax: zod_1.z.number().min(0).default(0),
    roundOff: zod_1.z.number().default(0),
    grandTotal: zod_1.z.number().min(0),
    paymentMethod: zod_1.z.nativeEnum(types_1.PaymentMethod),
    amountPaid: zod_1.z.number().min(0),
    udhaarAmount: zod_1.z.number().min(0).default(0),
    splitPayments: zod_1.z.array(zod_1.z.object({
        method: zod_1.z.nativeEnum(types_1.PaymentMethod),
        amount: zod_1.z.number().positive(),
        reference: zod_1.z.string().optional()
    })).optional(),
    notes: zod_1.z.string().optional(),
    idempotencyKey: zod_1.z.string().optional()
});
exports.udhaarPaymentSchema = zod_1.z.object({
    customerId: zod_1.z.string().min(1),
    amount: zod_1.z.number().positive('Payment amount must be greater than zero'),
    paymentMethod: zod_1.z.nativeEnum(types_1.PaymentMethod).default(types_1.PaymentMethod.CASH),
    referenceNumber: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional()
});
exports.expenseSchema = zod_1.z.object({
    category: zod_1.z.nativeEnum(types_1.ExpenseCategory),
    title: zod_1.z.string().min(2, 'Title is required'),
    amount: zod_1.z.number().positive('Amount must be positive'),
    date: zod_1.z.string(),
    paymentMethod: zod_1.z.nativeEnum(types_1.PaymentMethod),
    recipient: zod_1.z.string().optional(),
    referenceNumber: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional()
});
exports.stockAdjustmentSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(types_1.StockMovementType),
    quantity: zod_1.z.number().positive('Quantity must be positive'),
    reason: zod_1.z.string().min(2, 'Reason is required')
});
//# sourceMappingURL=index.js.map