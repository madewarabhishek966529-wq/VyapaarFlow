import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@vyapaarflow/shared';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  mobile?: string;
  role: UserRole;
  currentBusinessId?: mongoose.Types.ObjectId;
  isSuperAdmin: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    mobile: { type: String, trim: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.OWNER },
    currentBusinessId: { type: Schema.Types.ObjectId, ref: 'Business' },
    isSuperAdmin: { type: Boolean, default: false },
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUserDocument>('User', UserSchema);
