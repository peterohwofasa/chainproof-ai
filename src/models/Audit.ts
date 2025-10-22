import mongoose, { Schema, Document } from 'mongoose';

export enum AuditStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum AuditType {
  STANDARD = 'STANDARD',
  OPENAI_AGENT = 'OPENAI_AGENT'
}

export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
  UNKNOWN = 'UNKNOWN'
}

export interface IAudit extends Document {
  _id: string;
  userId: string;
  contractId: string;
  projectId?: string;
  status: AuditStatus;
  auditType: AuditType;
  overallScore?: number; // 0-100 security score
  riskLevel?: RiskLevel;
  auditDuration?: number; // Duration in seconds
  cost?: number; // Cost in credits/USD
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string; // Error message if audit fails
  metadata?: string; // JSON metadata for additional audit data
  createdAt: Date;
  updatedAt: Date;
}

const AuditSchema = new Schema<IAudit>({
  userId: { type: String, required: true },
  contractId: { type: String, required: true },
  projectId: { type: String },
  status: { type: String, enum: Object.values(AuditStatus), default: AuditStatus.PENDING },
  auditType: { type: String, enum: Object.values(AuditType), default: AuditType.STANDARD },
  overallScore: { type: Number, min: 0, max: 100 },
  riskLevel: { type: String, enum: Object.values(RiskLevel), default: RiskLevel.UNKNOWN },
  auditDuration: { type: Number },
  cost: { type: Number },
  startedAt: { type: Date },
  completedAt: { type: Date },
  errorMessage: { type: String },
  metadata: { type: String }
}, {
  timestamps: true,
  collection: 'audits'
});

// Single column indexes
AuditSchema.index({ userId: 1 });
AuditSchema.index({ contractId: 1 });
AuditSchema.index({ projectId: 1 });
AuditSchema.index({ status: 1 });
AuditSchema.index({ auditType: 1 });
AuditSchema.index({ riskLevel: 1 });
AuditSchema.index({ createdAt: 1 });
AuditSchema.index({ completedAt: 1 });

// Composite indexes for common query patterns
AuditSchema.index({ userId: 1, status: 1 });
AuditSchema.index({ userId: 1, createdAt: 1 });
AuditSchema.index({ status: 1, createdAt: 1 });
AuditSchema.index({ projectId: 1, status: 1 });
AuditSchema.index({ auditType: 1, status: 1 });
AuditSchema.index({ riskLevel: 1, status: 1 });

export const Audit = mongoose.models.Audit || mongoose.model<IAudit>('Audit', AuditSchema);