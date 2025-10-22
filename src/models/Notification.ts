import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  AUDIT_COMPLETED = 'AUDIT_COMPLETED',
  AUDIT_FAILED = 'AUDIT_FAILED',
  TEAM_INVITATION = 'TEAM_INVITATION',
  CREDIT_LOW = 'CREDIT_LOW',
  SECURITY_ALERT = 'SECURITY_ALERT',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  COMMENT_ADDED = 'COMMENT_ADDED',
  MENTION = 'MENTION'
}

export interface INotification extends Document {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: string; // JSON data
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true },
  type: { type: String, enum: Object.values(NotificationType), required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: String }, // JSON data
  read: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'notifications'
});

NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ createdAt: 1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: 1 });
NotificationSchema.index({ userId: 1, type: 1 });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);