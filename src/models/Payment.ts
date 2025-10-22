import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  auditId?: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentId?: string;
  transactionHash?: string;
  paymentMethod?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  auditId: { type: Schema.Types.ObjectId, ref: 'Audit' },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { 
    type: String, 
    enum: Object.values(PaymentStatus), 
    default: PaymentStatus.PENDING 
  },
  stripePaymentId: { type: String, unique: true, sparse: true },
  transactionHash: { type: String },
  paymentMethod: { type: String },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'payments'
});

// Indexes for performance
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ auditId: 1 });
PaymentSchema.index({ subscriptionId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ stripePaymentId: 1 });
PaymentSchema.index({ transactionHash: 1 });
PaymentSchema.index({ createdAt: 1 });

// Composite indexes
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ userId: 1, createdAt: 1 });
PaymentSchema.index({ status: 1, createdAt: 1 });

export const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);