import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKey extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: string[];
  version: number;
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  rotatedAt?: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  keyHash: {
    type: String,
    required: true,
    unique: true
  },
  keyPrefix: {
    type: String,
    required: true
  },
  permissions: {
    type: [String],
    default: ['read']
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastUsedAt: {
    type: Date,
    index: true
  },
  expiresAt: {
    type: Date,
    index: true
  },
  rotatedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'apikeys'
});

// Indexes for performance
ApiKeySchema.index({ userId: 1, isActive: 1 });
ApiKeySchema.index({ keyHash: 1 });
ApiKeySchema.index({ expiresAt: 1 });
ApiKeySchema.index({ lastUsedAt: 1 });
ApiKeySchema.index({ userId: 1, version: 1 });

export const ApiKey = mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema);