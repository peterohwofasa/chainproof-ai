import mongoose, { Schema, Document } from 'mongoose';

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER',
  MEMBER = 'MEMBER'
}

export interface IUser extends Document {
  _id: string;
  email: string;
  name?: string;
  password?: string;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Security fields
  failedLoginAttempts?: number;
  lastFailedLogin?: Date;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  
  // 2FA fields
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  
  // Team fields
  teamId?: string;
  role?: TeamRole;
  
  // Base account fields
  isBaseAccount?: boolean;
  baseAccountData?: any;
  
  // Status fields
  onlineStatus?: 'online' | 'offline' | 'away';
  lastSeenAt?: Date;
  
  // Subscription & billing
  subscription?: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled';
    creditsRemaining?: number;
    isFreeTrial?: boolean;
    freeTrialEnds?: Date;
    freeTrialStarted?: Date;
    paidAt?: Date;
  };
  
  // Payments tracking
  payments?: Array<{
    paymentId: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    method: 'base';
    planType?: string;
    transactionHash?: string;
    processed?: boolean;
    createdAt: Date;
    updatedAt?: Date;
  }>;
  
  // Usage tracking
  auditCount?: number;
  lastAuditAt?: Date;
  
  // Profile fields
  bio?: string;
  company?: string;
  website?: string;
  location?: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String },
  walletAddress: { type: String, unique: true, sparse: true },
  
  // Security fields
  failedLoginAttempts: { type: Number, default: 0 },
  lastFailedLogin: { type: Date },
  lockedUntil: { type: Date },
  lastLoginAt: { type: Date },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  
  // 2FA fields
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  twoFactorBackupCodes: [{ type: String }],
  
  // Team fields
  teamId: { type: String },
  role: { type: String, enum: Object.values(TeamRole), default: TeamRole.MEMBER },
  
  // Base account fields
  isBaseAccount: { type: Boolean, default: false },
  baseAccountData: { type: Schema.Types.Mixed },
  
  // Status fields
  onlineStatus: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
  lastSeenAt: { type: Date },
  
  // Subscription & billing
  subscription: {
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    status: { type: String, enum: ['active', 'inactive', 'cancelled'], default: 'active' },
    creditsRemaining: { type: Number },
    isFreeTrial: { type: Boolean, default: true },
    freeTrialEnds: { type: Date },
    freeTrialStarted: { type: Date },
    paidAt: { type: Date }
  },
  
  // Payments tracking
  payments: [{
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    method: { type: String, default: 'base' },
    planType: { type: String },
    transactionHash: { type: String },
    processed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
  }],
  
  // Usage tracking
  auditCount: { type: Number, default: 0 },
  lastAuditAt: { type: Date },
  
  // Profile fields
  bio: { type: String },
  company: { type: String },
  website: { type: String },
  location: { type: String }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes
UserSchema.index({ emailVerified: 1 });
UserSchema.index({ teamId: 1 });
UserSchema.index({ createdAt: 1 });
UserSchema.index({ lastLoginAt: 1 });
UserSchema.index({ onlineStatus: 1 });
UserSchema.index({ lastSeenAt: 1 });
UserSchema.index({ isBaseAccount: 1 });
UserSchema.index({ walletAddress: 1 });
UserSchema.index({ 'subscription.plan': 1 });
UserSchema.index({ 'subscription.status': 1 });
UserSchema.index({ auditCount: 1 });
UserSchema.index({ 'payments.paymentId': 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);