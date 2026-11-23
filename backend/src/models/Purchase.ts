import mongoose, { Schema, Document } from 'mongoose';
import { PaymentMethod } from '@vyapaarflow/shared';

const PurchaseItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    unit: { type: String, default: 'pcs' },
    quantity: { type: Number, required: true, min: 0.01 },
    purchasePrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    batchNumber: { type: String },
    expiryDate: { type: Date }
  },
  { _id: false }
);

export interface IPurchaseDocument extends Document {
  businessId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  purchaseInvoiceNo: string;
  purchaseDate: Date;
  items: any[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema = new Schema<IPurchaseDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    supplierName: { type: String, required: true },
    purchaseInvoiceNo: { type: String, required: true, trim: true },
    purchaseDate: { type: Date, default: Date.now },
    items: [PurchaseItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    totalTax: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), default: PaymentMethod.CASH },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

PurchaseSchema.index({ businessId: 1, purchaseDate: -1 });

export const Purchase = mongoose.model<IPurchaseDocument>('Purchase', PurchaseSchema);
