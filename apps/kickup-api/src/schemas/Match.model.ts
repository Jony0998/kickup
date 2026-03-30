import { Schema, Document } from 'mongoose';

export enum MatchStatus {
	UPCOMING = 'UPCOMING',
	ONGOING = 'ONGOING',
	COMPLETED = 'COMPLETED',
	CANCELLED = 'CANCELLED',
}

export enum MatchType {
	FRIENDLY = 'FRIENDLY',
	TOURNAMENT = 'TOURNAMENT',
	LEAGUE = 'LEAGUE',
}

export interface Match extends Document {
	matchTitle: string;
	matchDescription?: string;
	matchType: MatchType;
	matchStatus: MatchStatus;
	fieldId: any;
	organizerId: any;
	matchDate: Date;
	matchTime: string;
	duration?: number;
	maxPlayers: number;
	currentPlayers: number;
	joinedPlayers: any[];
	checkedInPlayers: any[];
	matchFee?: number;
	skillLevel?: string;
	location?: {
		address?: string;
		city?: string;
		district?: string;
		coordinates?: {
			lat?: number;
			lng?: number;
		};
	};
	matchImage?: string;
	images?: string[];
	views: number;
	likes: number;
	likedBy: any[];
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const MatchSchema = new Schema(
	{
		matchTitle: {
			type: String,
			required: true,
		},
		matchDescription: {
			type: String,
		},
		matchType: {
			type: String,
			enum: MatchType,
			default: MatchType.FRIENDLY,
		},
		matchStatus: {
			type: String,
			enum: MatchStatus,
			default: MatchStatus.UPCOMING,
		},
		fieldId: {
			type: Schema.Types.ObjectId,
			ref: 'Property',
			required: false,
		},
		organizerId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
		matchDate: {
			type: Date,
			required: true,
		},
		matchTime: {
			type: String, // "18:00" format
			required: true,
		},
		duration: {
			type: Number, // minutes
			default: 90,
		},
		maxPlayers: {
			type: Number,
			required: true,
			default: 22, // 11 vs 11
		},
		currentPlayers: {
			type: Number,
			default: 0,
		},
		joinedPlayers: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Member',
			},
		],
		checkedInPlayers: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Member',
			},
		],
		matchFee: {
			type: Number,
			default: 0,
		},
		skillLevel: {
			type: String, // "BEGINNER", "INTERMEDIATE", "ADVANCED"
		},
		location: {
			address: String,
			city: String,
			district: String,
			coordinates: {
				lat: Number,
				lng: Number,
			},
		},
		matchImage: {
			type: String,
			default: '',
		},
		images: {
			type: [String],
			default: undefined,
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
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'matches' },
);

// Indexes for better query performance
MatchSchema.index({ matchDate: 1, matchStatus: 1 });
MatchSchema.index({ fieldId: 1 });
MatchSchema.index({ organizerId: 1 });
MatchSchema.index({ 'location.city': 1, 'location.district': 1 });
MatchSchema.index({ matchStatus: 1, matchDate: 1 });
// Services consistently filter by `deletedAt: null`:
MatchSchema.index({ matchStatus: 1, matchDate: 1, deletedAt: 1 });
MatchSchema.index({ matchDate: 1, deletedAt: 1 });
MatchSchema.index({ organizerId: 1, deletedAt: 1 });
MatchSchema.index({ joinedPlayers: 1, deletedAt: 1 });
MatchSchema.index({ checkedInPlayers: 1, deletedAt: 1 });

export default MatchSchema;

