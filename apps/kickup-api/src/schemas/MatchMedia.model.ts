import { Schema, Document } from 'mongoose';

export enum MediaType {
	IMAGE = 'IMAGE',
	VIDEO = 'VIDEO',
}

export interface MatchMedia extends Document {
	matchId: any;
	uploadedBy: any; // Member ID
	mediaType: MediaType;
	mediaUrl: string;
	thumbnailUrl?: string;
	title?: string;
	description?: string;
	duration?: number; // For videos, in seconds
	fileSize?: number; // In bytes
	mimeType?: string;
	views: number;
	likes: number;
	likedBy: any[];
	tags?: string[];
	isPublic: boolean;
	order: number; // For sorting in gallery
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const MatchMediaSchema = new Schema(
	{
		matchId: {
			type: Schema.Types.ObjectId,
			ref: 'Match',
			required: true,
		},
		uploadedBy: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
		mediaType: {
			type: String,
			enum: MediaType,
			required: true,
		},
		mediaUrl: {
			type: String,
			required: true,
		},
		thumbnailUrl: {
			type: String,
		},
		title: {
			type: String,
		},
		description: {
			type: String,
		},
		duration: {
			type: Number, // seconds
		},
		fileSize: {
			type: Number, // bytes
		},
		mimeType: {
			type: String,
		},
		views: {
			type: Number,
			default: 0,
		},
		likes: {
			type: Number,
			default: 0,
		},
		likedBy: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Member',
			},
		],
		tags: [
			{
				type: String,
			},
		],
		isPublic: {
			type: Boolean,
			default: true,
		},
		order: {
			type: Number,
			default: 0,
		},
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'match_media' },
);

// Indexes
MatchMediaSchema.index({ matchId: 1, order: 1 });
MatchMediaSchema.index({ uploadedBy: 1 });
MatchMediaSchema.index({ mediaType: 1 });
MatchMediaSchema.index({ createdAt: -1 });

export default MatchMediaSchema;

