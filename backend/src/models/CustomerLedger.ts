import mongoose, { Schema, Document } from 'mongoose';
import { CustomerLedgerType, PaymentMethod } from '@vyapaarflow/shared';

export interface ICustomerLedgerDocument extends Document {
  businessId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  type: CustomerLedgerType;
  amount: number;
  balanceAfter: number;
  saleId?: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  dueDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CustomerLedgerSchema = new Schema<ICustomerLedgerDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    type: { type: String, enum: Object.values(CustomerLedgerType), required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    saleId: { type: Schema.Types.ObjectId, ref: 'Sale' },
    invoiceNumber: { type: String },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod) },
    referenceNumber: { type: String },
    notes: { type: String },
    dueDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CustomerLedgerSchema.index({ businessId: 1, customerId: 1, createdAt: -1 });
CustomerLedgerSchema.index({ businessId: 1, dueDate: 1 });

export const CustomerLedger = mongoose.model<ICustomerLedgerDocument>('CustomerLedger', CustomerLedgerSchema);
