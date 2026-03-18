import { Schema, Document } from 'mongoose';

export enum NotificationType {
	MATCH_INVITATION = 'MATCH_INVITATION',
	TEAM_INVITATION = 'TEAM_INVITATION',
	MATCH_REMINDER = 'MATCH_REMINDER',
	MATCH_RESULT = 'MATCH_RESULT',
	LEAGUE_UPDATE = 'LEAGUE_UPDATE',
	TEAM_UPDATE = 'TEAM_UPDATE',
	MATCH_CANCELLED = 'MATCH_CANCELLED',
	MATCH_JOINED = 'MATCH_JOINED',
	MATCH_LEFT = 'MATCH_LEFT',
	REVIEW_RECEIVED = 'REVIEW_RECEIVED',
	FOLLOW = 'FOLLOW',
	COMMENT = 'COMMENT',
	LIKE = 'LIKE',
	SYSTEM = 'SYSTEM',
}

export enum NotificationStatus {
	UNREAD = 'UNREAD',
	READ = 'READ',
	ARCHIVED = 'ARCHIVED',
}

export interface Notification extends Document {
	userId: any; // Member ID who receives notification
	notificationType: NotificationType;
	title: string;
	message: string;
	status: NotificationStatus;
	// Related entity IDs
	relatedMatchId?: any;
	relatedTeamId?: any;
	relatedLeagueId?: any;
	relatedMemberId?: any; // For follow, comment, like notifications
	relatedReviewId?: any;
	// Action data
	actionUrl?: string; // Deep link to related content
	actionData?: any; // Additional data as JSON
	// Metadata
	isPushSent: boolean;
	pushSentAt?: Date;
	readAt?: Date;
	archivedAt?: Date;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const NotificationSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
			index: true,
		},
		notificationType: {
			type: String,
			enum: NotificationType,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: NotificationStatus,
			default: NotificationStatus.UNREAD,
		},
		relatedMatchId: {
			type: Schema.Types.ObjectId,
			ref: 'Match',
		},
		relatedTeamId: {
			type: Schema.Types.ObjectId,
			ref: 'Team',
		},
		relatedLeagueId: {
			type: Schema.Types.ObjectId,
			ref: 'League',
		},
		relatedMemberId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},
		relatedReviewId: {
			type: Schema.Types.ObjectId,
			ref: 'Review',
		},
		actionUrl: {
			type: String,
		},
		actionData: {
			type: Schema.Types.Mixed, // JSON data
		},
		isPushSent: {
			type: Boolean,
			default: false,
		},
		pushSentAt: {
			type: Date,
		},
		readAt: {
			type: Date,
		},
		archivedAt: {
			type: Date,
		},
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'notifications' },
);

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, notificationType: 1 });
NotificationSchema.index({ relatedMatchId: 1 });
NotificationSchema.index({ relatedTeamId: 1 });
NotificationSchema.index({ createdAt: -1 });

export default NotificationSchema;

