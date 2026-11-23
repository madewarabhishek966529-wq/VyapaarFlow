import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerDocument extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  customerCode: string;
  totalPurchases: number;
  currentBalance: number; // Outstanding Udhaar amount
  creditLimit?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String },
    customerCode: { type: String, required: true },
    totalPurchases: { type: Number, default: 0, min: 0 },
    currentBalance: { type: Number, default: 0 }, // Positive means customer owes us money (Udhaar)
    creditLimit: { type: Number, default: 10000 },
    notes: { type: String }
  },
  { timestamps: true }
);

CustomerSchema.index({ businessId: 1, mobile: 1 });
CustomerSchema.index({ businessId: 1, currentBalance: -1 });
CustomerSchema.index({ businessId: 1, name: 1 });

export const Customer = mongoose.model<ICustomerDocument>('Customer', CustomerSchema);
