import { Schema } from 'mongoose';

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
			required: true,
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

export default MatchSchema;

