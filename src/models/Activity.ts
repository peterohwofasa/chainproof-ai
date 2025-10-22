import mongoose, { Schema, Document } from 'mongoose'

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId
  action: string
  target?: string
  metadata?: string
  createdAt: Date
  updatedAt: Date
}

const ActivitySchema = new Schema<IActivity>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  target: {
    type: String,
    trim: true
  },
  metadata: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Create indexes for efficient querying
ActivitySchema.index({ userId: 1, createdAt: -1 })
ActivitySchema.index({ action: 1 })

export const Activity = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema)