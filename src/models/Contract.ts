import mongoose, { Schema, Document } from 'mongoose';

export interface IContract extends Document {
  _id: string;
  address?: string;
  name: string;
  sourceCode: string;
  bytecode?: string;
  abi?: string;
  compilerVersion?: string;
  optimizationEnabled?: boolean;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>({
  address: { type: String },
  name: { type: String, required: true },
  sourceCode: { type: String, required: true },
  bytecode: { type: String },
  abi: { type: String },
  compilerVersion: { type: String },
  optimizationEnabled: { type: Boolean, default: false },
  projectId: { type: String }
}, {
  timestamps: true,
  collection: 'contracts'
});

ContractSchema.index({ projectId: 1 });

export const Contract = mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);