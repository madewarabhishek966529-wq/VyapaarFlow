import mongoose, { Schema, Document } from 'mongoose';
import { StockMovementType } from '@vyapaarflow/shared';

export interface IStockMovementDocument extends Document {
  businessId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitPrice?: number;
  referenceId?: string;
  reason?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovementDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    type: { type: String, enum: Object.values(StockMovementType), required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    unitPrice: { type: Number },
    referenceId: { type: String },
    reason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StockMovementSchema.index({ businessId: 1, productId: 1, createdAt: -1 });
StockMovementSchema.index({ businessId: 1, createdAt: -1 });

export const StockMovement = mongoose.model<IStockMovementDocument>('StockMovement', StockMovementSchema);
