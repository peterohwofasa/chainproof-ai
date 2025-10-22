import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  token: string;
  acceptedAt?: Date;
  expiresAt: Date;
  invitedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamInvitationSchema = new Schema<ITeamInvitation>({
  teamId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Team', 
    required: true 
  },
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  role: { 
    type: String, 
    enum: ['OWNER', 'ADMIN', 'MEMBER'], 
    default: 'MEMBER',
    required: true 
  },
  token: { 
    type: String, 
    required: true,
    unique: true
  },
  acceptedAt: { 
    type: Date 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  invitedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true,
  collection: 'teaminvitations'
});

// Indexes for performance
TeamInvitationSchema.index({ teamId: 1 });
TeamInvitationSchema.index({ email: 1 });
TeamInvitationSchema.index({ token: 1 });
TeamInvitationSchema.index({ expiresAt: 1 });
TeamInvitationSchema.index({ acceptedAt: 1 });

// Composite indexes
TeamInvitationSchema.index({ teamId: 1, email: 1 });
TeamInvitationSchema.index({ email: 1, acceptedAt: 1 });
TeamInvitationSchema.index({ expiresAt: 1, acceptedAt: 1 });

export const TeamInvitation = mongoose.models.TeamInvitation || mongoose.model<ITeamInvitation>('TeamInvitation', TeamInvitationSchema);