import { Schema, Document } from 'mongoose';

export enum MatchResultStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	DISPUTED = 'DISPUTED',
}

export interface Goal {
	playerId: any;
	minute: number;
	assistPlayerId?: any;
	isOwnGoal?: boolean;
	isPenalty?: boolean;
}

export interface MatchResult extends Document {
	matchId: any;
	homeTeamId?: any; // Team ID (if team match)
	awayTeamId?: any; // Team ID (if team match)
	homeScore: number;
	awayScore: number;
	homePlayers?: any[]; // Member IDs for home team
	awayPlayers?: any[]; // Member IDs for away team
	goals: Goal[];
	resultStatus: MatchResultStatus;
	confirmedBy?: any[]; // Member IDs who confirmed the result
	disputedBy?: any; // Member ID who disputed
	disputeReason?: string;
	refereeId?: any; // Referee Member ID
	refereeNotes?: string;
	matchDuration?: number; // Actual match duration in minutes
	weather?: {
		temperature?: number;
		condition?: string; // "SUNNY", "CLOUDY", "RAINY", etc.
	};
	createdBy: any; // Member ID who created the result
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const GoalSchema = new Schema(
	{
		playerId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
		minute: {
			type: Number,
			required: true,
			min: 0,
			max: 120,
		},
		assistPlayerId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},
		isOwnGoal: {
			type: Boolean,
			default: false,
		},
		isPenalty: {
			type: Boolean,
			default: false,
		},
	},
	{ _id: false },
);

const MatchResultSchema = new Schema(
	{
		matchId: {
			type: Schema.Types.ObjectId,
			ref: 'Match',
			required: true,
			unique: true, // One result per match
		},
		homeTeamId: {
			type: Schema.Types.ObjectId,
			ref: 'Team',
		},
		awayTeamId: {
			type: Schema.Types.ObjectId,
			ref: 'Team',
		},
		homeScore: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
		},
		awayScore: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
		},
		homePlayers: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Member',
			},
		],
		awayPlayers: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Member',
			},
		],
		goals: [GoalSchema],
		resultStatus: {
			type: String,
			enum: MatchResultStatus,
			default: MatchResultStatus.PENDING,
		},
		confirmedBy: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Member',
			},
		],
		disputedBy: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},
		disputeReason: {
			type: String,
		},
		refereeId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},
		refereeNotes: {
			type: String,
		},
		matchDuration: {
			type: Number, // minutes
		},
		weather: {
			temperature: Number,
			condition: String, // "SUNNY", "CLOUDY", "RAINY", "SNOWY"
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'match_results' },
);

// Indexes
MatchResultSchema.index({ matchId: 1 });
MatchResultSchema.index({ homeTeamId: 1 });
MatchResultSchema.index({ awayTeamId: 1 });
MatchResultSchema.index({ resultStatus: 1 });
MatchResultSchema.index({ 'goals.playerId': 1 });

export default MatchResultSchema;

