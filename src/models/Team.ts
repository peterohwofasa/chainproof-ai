import mongoose, { Schema, Document } from 'mongoose'

export interface ITeam extends Document {
  name: string
  description?: string
  ownerId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const TeamSchema = new Schema<ITeam>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Create index for owner
TeamSchema.index({ ownerId: 1 })

export const Team = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema)