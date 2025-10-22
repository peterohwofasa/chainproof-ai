import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  description: { type: String },
  userId: { type: String, required: true },
  teamId: { type: String }
}, {
  timestamps: true,
  collection: 'projects'
});

// Performance indexes
ProjectSchema.index({ userId: 1 });
ProjectSchema.index({ teamId: 1 });
ProjectSchema.index({ createdAt: 1 });
ProjectSchema.index({ userId: 1, createdAt: 1 });
ProjectSchema.index({ teamId: 1, createdAt: 1 });

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);