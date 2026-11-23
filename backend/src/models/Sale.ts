import mongoose, { Schema, Document } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '@vyapaarflow/shared';

const SaleItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    barcode: { type: String },
    unit: { type: String, default: 'pcs' },
    quantity: { type: Number, required: true, min: 0.01 },
    unitPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 28 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    batchNumber: { type: String }
  },
  { _id: false }
);

const SplitPaymentSchema = new Schema(
  {
    method: { type: String, enum: Object.values(PaymentMethod), required: true },
    amount: { type: Number, required: true, min: 0 },
    reference: { type: String }
  },
  { _id: false }
);

export interface ISaleDocument extends Document {
  businessId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  saleDate: Date;
  customerId?: mongoose.Types.ObjectId;
  customerName?: string;
  customerMobile?: string;
  items: any[];
  subtotal: number;
  billDiscountPercent: number;
  billDiscountAmount: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  udhaarAmount: number;
  splitPayments?: any[];
  notes?: string;
  isReturned: boolean;
  returnReason?: string;
  idempotencyKey?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISaleDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    invoiceNumber: { type: String, required: true },
    saleDate: { type: Date, default: Date.now },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
    customerMobile: { type: String },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    billDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    billDiscountAmount: { type: Number, default: 0, min: 0 },
    totalTax: { type: Number, default: 0, min: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.COMPLETED },
    amountPaid: { type: Number, default: 0, min: 0 },
    udhaarAmount: { type: Number, default: 0, min: 0 },
    splitPayments: [SplitPaymentSchema],
    notes: { type: String },
    isReturned: { type: Boolean, default: false },
    returnReason: { type: String },
    idempotencyKey: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

// High speed indexes for POS, invoices, analytics
SaleSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });
SaleSchema.index({ businessId: 1, saleDate: -1 });
SaleSchema.index({ businessId: 1, customerId: 1, saleDate: -1 });
SaleSchema.index({ businessId: 1, idempotencyKey: 1 }, { sparse: true });

export const Sale = mongoose.model<ISaleDocument>('Sale', SaleSchema);
