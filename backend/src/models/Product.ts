import mongoose, { Schema, Document } from 'mongoose';

export interface IProductDocument extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  brand?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  taxRate: number;
  currentStock: number;
  minStockLevel: number;
  supplierId?: mongoose.Types.ObjectId;
  supplierName?: string;
  description?: string;
  batchNumber?: string;
  expiryDate?: Date;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    unit: { type: String, default: 'pcs' },
    purchasePrice: { type: Number, required: true, min: 0, default: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 28 },
    currentStock: { type: Number, default: 0 },
    minStockLevel: { type: Number, default: 5, min: 0 },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String },
    description: { type: String },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Compound indexes for high-speed POS scanning & multitenancy
ProductSchema.index({ businessId: 1, barcode: 1 });
ProductSchema.index({ businessId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ businessId: 1, name: 'text', category: 'text', brand: 'text' });
ProductSchema.index({ businessId: 1, currentStock: 1 });

export const Product = mongoose.model<IProductDocument>('Product', ProductSchema);
