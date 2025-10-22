import mongoose, { Schema, Document } from 'mongoose';

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING'
}

export interface ISubscription extends Document {
  _id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  creditsRemaining: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  freeTrialStarted?: Date;
  freeTrialEnds?: Date;
  isFreeTrial: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: { type: String, required: true },
  plan: { 
    type: String, 
    enum: Object.values(SubscriptionPlan), 
    default: SubscriptionPlan.FREE,
    required: true 
  },
  status: { 
    type: String, 
    enum: Object.values(SubscriptionStatus), 
    default: SubscriptionStatus.ACTIVE,
    required: true 
  },
  creditsRemaining: { type: Number, default: 0, required: true },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  freeTrialStarted: { type: Date },
  freeTrialEnds: { type: Date },
  isFreeTrial: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'subscriptions'
});

// Indexes
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ plan: 1 });
SubscriptionSchema.index({ userId: 1, status: 1 });

export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);