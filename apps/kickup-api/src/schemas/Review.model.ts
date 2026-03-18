import { Schema, Document } from 'mongoose';

export enum ReviewType {
	FIELD = 'FIELD',
	MATCH = 'MATCH',
	MEMBER = 'MEMBER',
}

export interface Review extends Document {
	reviewType: ReviewType;
	targetId: any;
	reviewTypeRef: string;
	reviewerId: any;
	rating: number;
	comment?: string;
	images?: string[];
	likes: number;
	likedBy: any[];
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const ReviewSchema = new Schema(
	{
		reviewType: {
			type: String,
			enum: ReviewType,
			required: true,
		},
		targetId: {
			type: Schema.Types.ObjectId,
			required: true,
			refPath: 'reviewTypeRef',
		},
		reviewTypeRef: {
			type: String,
			enum: ['Property', 'Match', 'Member'],
		},
		reviewerId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		comment: {
			type: String,
		},
		images: [
			{
				type: String,
			},
		],
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
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'reviews' },
);

// Indexes
ReviewSchema.index({ targetId: 1, reviewType: 1 });
ReviewSchema.index({ reviewerId: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });

export default ReviewSchema;

