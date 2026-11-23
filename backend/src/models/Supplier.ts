import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierDocument extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  contactPerson?: string;
  mobile: string;
  email?: string;
  address?: string;
  gstin?: string;
  totalPurchases: number;
  outstandingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String },
    gstin: { type: String, uppercase: true, trim: true },
    totalPurchases: { type: Number, default: 0, min: 0 },
    outstandingBalance: { type: Number, default: 0 }
  },
  { timestamps: true }
);

SupplierSchema.index({ businessId: 1, name: 1 });
SupplierSchema.index({ businessId: 1, outstandingBalance: -1 });

export const Supplier = mongoose.model<ISupplierDocument>('Supplier', SupplierSchema);
