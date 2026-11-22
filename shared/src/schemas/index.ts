import { z } from 'zod';
import {
  BusinessCategory,
  Language,
  PaymentMethod,
  UserRole,
  ExpenseCategory,
  StockMovementType
} from '../types';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number').optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const onboardingSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  email: z.string().email('Invalid email address'),
  category: z.nativeEnum(BusinessCategory),
  address: z.string().min(5, 'Full street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Must be a valid 6-digit PIN code'),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  currency: z.string().default('INR'),
  language: z.nativeEnum(Language).default(Language.ENGLISH),
  invoicePrefix: z.string().default('INV-'),
  startingInvoiceNumber: z.number().int().min(1).default(1),
  upiId: z.string().optional().or(z.literal('')),
  upiName: z.string().optional().or(z.literal(''))
});

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  unit: z.string().default('pcs'),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  mrp: z.number().min(0, 'MRP cannot be negative'),
  taxRate: z.number().min(0).max(28).default(0),
  currentStock: z.number().default(0),
  minStockLevel: z.number().min(0).default(5),
  supplierId: z.string().optional().or(z.literal('')),
  supplierName: z.string().optional(),
  description: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional()
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  notes: z.string().optional()
});

export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN').optional().or(z.literal(''))
});

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  unit: z.string().default('pcs'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitPrice: z.number().min(0),
  mrp: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(28).default(0),
  taxAmount: z.number().min(0).default(0),
  totalPrice: z.number().min(0),
  batchNumber: z.string().optional()
});

export const saleSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerMobile: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'Sale must contain at least 1 item'),
  subtotal: z.number().min(0),
  billDiscountPercent: z.number().min(0).max(100).default(0),
  billDiscountAmount: z.number().min(0).default(0),
  totalTax: z.number().min(0).default(0),
  roundOff: z.number().default(0),
  grandTotal: z.number().min(0),
  paymentMethod: z.nativeEnum(PaymentMethod),
  amountPaid: z.number().min(0),
  udhaarAmount: z.number().min(0).default(0),
  splitPayments: z.array(z.object({
    method: z.nativeEnum(PaymentMethod),
    amount: z.number().positive(),
    reference: z.string().optional()
  })).optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional()
});

export const udhaarPaymentSchema = z.object({
  customerId: z.string().min(1),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  referenceNumber: z.string().optional(),
  notes: z.string().optional()
});

export const expenseSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  title: z.string().min(2, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  recipient: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional()
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  type: z.nativeEnum(StockMovementType),
  quantity: z.number().positive('Quantity must be positive'),
  reason: z.string().min(2, 'Reason is required')
});
