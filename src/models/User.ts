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
  role: { type: String, enum: Object.values(TeamRole), default: TeamRole.MEMBER }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes
UserSchema.index({ emailVerified: 1 });
UserSchema.index({ teamId: 1 });
UserSchema.index({ createdAt: 1 });
UserSchema.index({ lastLoginAt: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);