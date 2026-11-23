import mongoose, { Schema, Document } from 'mongoose';
import { ExpenseCategory, PaymentMethod } from '@vyapaarflow/shared';

export interface IExpenseDocument extends Document {
  businessId: mongoose.Types.ObjectId;
  category: ExpenseCategory;
  title: string;
  amount: number;
  date: Date;
  paymentMethod: PaymentMethod;
  recipient?: string;
  referenceNumber?: string;
  receiptUrl?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    category: { type: String, enum: Object.values(ExpenseCategory), required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), default: PaymentMethod.CASH },
    recipient: { type: String, trim: true },
    referenceNumber: { type: String },
    receiptUrl: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

ExpenseSchema.index({ businessId: 1, date: -1 });
ExpenseSchema.index({ businessId: 1, category: 1, date: -1 });

export const Expense = mongoose.model<IExpenseDocument>('Expense', ExpenseSchema);
