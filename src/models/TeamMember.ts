import mongoose, { Schema, Document } from 'mongoose'

export interface ITeamMember extends Document {
  teamId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  joinedAt: Date
  createdAt: Date
  updatedAt: Date
}

const TeamMemberSchema = new Schema<ITeamMember>({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['OWNER', 'ADMIN', 'MEMBER'],
    default: 'MEMBER',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Create compound index for team and user
TeamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true })

export const TeamMember = mongoose.models.TeamMember || mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema)