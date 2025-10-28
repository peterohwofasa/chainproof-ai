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
  contractId?: string;
  projectId?: string;
  
  // Contract details
  contractCode: string;
  contractName?: string;
  network: string; // base, ethereum, polygon, etc.
  
  // Audit status
  status: AuditStatus;
  auditType: AuditType;
  
  // Results
  overallScore?: number; // 0-100 security score
  riskLevel?: RiskLevel;
  results?: any; // Audit analysis results
  vulnerabilities?: Array<{
    severity: string;
    title: string;
    description: string;
    location?: string;
    recommendation?: string;
  }>;
  
  // Blockchain proof
  blockchainProof?: {
    transactionHash?: string;
    blockNumber?: number;
    proofHash?: string;
    timestamp?: Date;
  };
  
  // Timing & cost
  auditDuration?: number; // Duration in seconds
  cost?: number; // Cost in credits/USD
  startedAt?: Date;
  completedAt?: Date;
  
  // Error handling
  errorMessage?: string; // Error message if audit fails
  metadata?: any; // Additional audit data
  
  createdAt: Date;
  updatedAt: Date;
}

const AuditSchema = new Schema<IAudit>({
  userId: { type: String, required: true },
  contractId: { type: String },
  projectId: { type: String },
  
  // Contract details
  contractCode: { type: String, required: true },
  contractName: { type: String },
  network: { type: String, default: 'base' },
  
  // Audit status
  status: { type: String, enum: Object.values(AuditStatus), default: AuditStatus.PENDING },
  auditType: { type: String, enum: Object.values(AuditType), default: AuditType.STANDARD },
  
  // Results
  overallScore: { type: Number, min: 0, max: 100 },
  riskLevel: { type: String, enum: Object.values(RiskLevel), default: RiskLevel.UNKNOWN },
  results: { type: Schema.Types.Mixed },
  vulnerabilities: [{
    severity: { type: String },
    title: { type: String },
    description: { type: String },
    location: { type: String },
    recommendation: { type: String }
  }],
  
  // Blockchain proof
  blockchainProof: {
    transactionHash: { type: String },
    blockNumber: { type: Number },
    proofHash: { type: String },
    timestamp: { type: Date }
  },
  
  // Timing & cost
  auditDuration: { type: Number },
  cost: { type: Number },
  startedAt: { type: Date },
  completedAt: { type: Date },
  
  // Error handling
  errorMessage: { type: String },
  metadata: { type: Schema.Types.Mixed }
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
AuditSchema.index({ network: 1 });
AuditSchema.index({ createdAt: 1 });
AuditSchema.index({ completedAt: 1 });

// Composite indexes for common query patterns
AuditSchema.index({ userId: 1, status: 1 });
AuditSchema.index({ userId: 1, createdAt: -1 });
AuditSchema.index({ userId: 1, network: 1 });
AuditSchema.index({ status: 1, createdAt: 1 });
AuditSchema.index({ projectId: 1, status: 1 });
AuditSchema.index({ auditType: 1, status: 1 });
AuditSchema.index({ riskLevel: 1, status: 1 });
AuditSchema.index({ network: 1, status: 1 });

export const Audit = mongoose.models.Audit || mongoose.model<IAudit>('Audit', AuditSchema);