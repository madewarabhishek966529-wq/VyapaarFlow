import mongoose, { Schema, Document } from 'mongoose';
import { BusinessCategory, Language, SubscriptionPlan, SubscriptionStatus } from '@vyapaarflow/shared';

export interface IBusinessDocument extends Document {
  name: string;
  ownerName: string;
  ownerId: mongoose.Types.ObjectId;
  category: BusinessCategory;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  currency: string;
  language: Language;
  logoUrl?: string;
  settings: {
    invoicePrefix: string;
    nextInvoiceNumber: number;
    enableGst: boolean;
    allowNegativeStock: boolean;
    upiId?: string;
    upiName?: string;
    financialYearStartMonth: number;
    printHeaderNote?: string;
    printFooterNote?: string;
  };
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    trialEndsAt?: Date;
    expiresAt?: Date;
    productLimit: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusinessDocument>(
  {
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: Object.values(BusinessCategory), default: BusinessCategory.GROCERY },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    gstin: { type: String, uppercase: true, trim: true },
    currency: { type: String, default: 'INR' },
    language: { type: String, enum: Object.values(Language), default: Language.ENGLISH },
    logoUrl: { type: String },
    settings: {
      invoicePrefix: { type: String, default: 'INV-' },
      nextInvoiceNumber: { type: Number, default: 1 },
      enableGst: { type: Boolean, default: true },
      allowNegativeStock: { type: Boolean, default: false },
      upiId: { type: String, trim: true },
      upiName: { type: String, trim: true },
      financialYearStartMonth: { type: Number, default: 4 },
      printHeaderNote: { type: String, default: 'Thank you for your visit!' },
      printFooterNote: { type: String, default: 'Goods once sold cannot be returned without bill.' }
    },
    subscription: {
      plan: { type: String, enum: Object.values(SubscriptionPlan), default: SubscriptionPlan.PRO },
      status: { type: String, enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.ACTIVE },
      trialEndsAt: { type: Date },
      expiresAt: { type: Date, default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      productLimit: { type: Number, default: 1000000 }
    }
  },
  { timestamps: true }
);

BusinessSchema.index({ email: 1 });
BusinessSchema.index({ mobile: 1 });

export const Business = mongoose.model<IBusinessDocument>('Business', BusinessSchema);
