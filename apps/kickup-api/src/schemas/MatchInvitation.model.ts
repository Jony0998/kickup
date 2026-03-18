import { Schema, Document } from 'mongoose';

export enum InvitationStatus {
	PENDING = 'PENDING',
	ACCEPTED = 'ACCEPTED',
	REJECTED = 'REJECTED',
	CANCELLED = 'CANCELLED',
}

export interface MatchInvitation extends Document {
	matchId: any;
	inviterId: any; // Member who sends invitation
	inviteeId: any; // Member or Team who receives invitation
	inviteeType: 'MEMBER' | 'TEAM';
	status: InvitationStatus;
	message?: string;
	respondedAt?: Date;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const MatchInvitationSchema = new Schema(
	{
		matchId: {
			type: Schema.Types.ObjectId,
			ref: 'Match',
			required: true,
		},
		inviterId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
		inviteeId: {
			type: Schema.Types.ObjectId,
			required: true,
		},
		inviteeType: {
			type: String,
			enum: ['MEMBER', 'TEAM'],
			required: true,
		},
		status: {
			type: String,
			enum: InvitationStatus,
			default: InvitationStatus.PENDING,
		},
		message: {
			type: String,
		},
		respondedAt: {
			type: Date,
		},
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'match_invitations' },
);

// Indexes
MatchInvitationSchema.index({ matchId: 1, inviteeId: 1 });
MatchInvitationSchema.index({ inviteeId: 1, status: 1 });
MatchInvitationSchema.index({ inviterId: 1 });

export default MatchInvitationSchema;

