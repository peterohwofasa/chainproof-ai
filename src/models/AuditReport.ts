import mongoose, { Schema, Document } from 'mongoose';

export enum ReportType {
  SUMMARY = 'SUMMARY',
  FULL = 'FULL',
  TECHNICAL = 'TECHNICAL'
}

export interface IAuditReport extends Document {
  _id: string;
  auditId: string;
  reportType: ReportType;
  content: string; // JSON string containing the report data
  ipfsHash?: string;
  blockchainTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditReportSchema = new Schema<IAuditReport>({
  auditId: { type: String, required: true },
  reportType: { type: String, enum: Object.values(ReportType), default: ReportType.FULL },
  content: { type: String, required: true },
  ipfsHash: { type: String },
  blockchainTxHash: { type: String }
}, {
  timestamps: true,
  collection: 'auditReports'
});

// Indexes
AuditReportSchema.index({ auditId: 1 });
AuditReportSchema.index({ reportType: 1 });
AuditReportSchema.index({ createdAt: 1 });
AuditReportSchema.index({ auditId: 1, reportType: 1 });

export const AuditReport = mongoose.models.AuditReport || mongoose.model<IAuditReport>('AuditReport', AuditReportSchema);