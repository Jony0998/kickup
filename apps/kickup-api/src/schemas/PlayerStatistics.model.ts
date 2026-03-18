import { Schema, Document } from 'mongoose';

export interface PlayerStatistics extends Document {
	memberId: any;
	// Match Statistics
	totalMatches: number;
	matchesWon: number;
	matchesDrawn: number;
	matchesLost: number;
	// Goal Statistics
	totalGoals: number;
	totalAssists: number;
	totalOwnGoals: number;
	totalPenalties: number;
	// Position Statistics
	matchesAsGK: number; // Goalkeeper
	matchesAsDF: number; // Defender
	matchesAsMF: number; // Midfielder
	matchesAsFW: number; // Forward
	// Team Statistics
	teamsJoined: number;
	currentTeams: number;
	// Rating
	averageRating: number;
	totalRatings: number;
	// Recent Performance (last 10 matches)
	recentGoals: number;
	recentAssists: number;
	recentWins: number;
	// Career Best
	bestGoalsInMatch: number;
	bestAssistsInMatch: number;
	// Activity
	lastMatchDate?: Date;
	lastGoalDate?: Date;
	streakMatches: number; // Consecutive matches played
	// Awards/Achievements (can be expanded)
	manOfTheMatch: number;
	cleanSheets: number; // For goalkeepers
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const PlayerStatisticsSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
			unique: true,
		},
		// Match Statistics
		totalMatches: {
			type: Number,
			default: 0,
		},
		matchesWon: {
			type: Number,
			default: 0,
		},
		matchesDrawn: {
			type: Number,
			default: 0,
		},
		matchesLost: {
			type: Number,
			default: 0,
		},
		// Goal Statistics
		totalGoals: {
			type: Number,
			default: 0,
		},
		totalAssists: {
			type: Number,
			default: 0,
		},
		totalOwnGoals: {
			type: Number,
			default: 0,
		},
		totalPenalties: {
			type: Number,
			default: 0,
		},
		// Position Statistics
		matchesAsGK: {
			type: Number,
			default: 0,
		},
		matchesAsDF: {
			type: Number,
			default: 0,
		},
		matchesAsMF: {
			type: Number,
			default: 0,
		},
		matchesAsFW: {
			type: Number,
			default: 0,
		},
		// Team Statistics
		teamsJoined: {
			type: Number,
			default: 0,
		},
		currentTeams: {
			type: Number,
			default: 0,
		},
		// Rating
		averageRating: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
		totalRatings: {
			type: Number,
			default: 0,
		},
		// Recent Performance
		recentGoals: {
			type: Number,
			default: 0,
		},
		recentAssists: {
			type: Number,
			default: 0,
		},
		recentWins: {
			type: Number,
			default: 0,
		},
		// Career Best
		bestGoalsInMatch: {
			type: Number,
			default: 0,
		},
		bestAssistsInMatch: {
			type: Number,
			default: 0,
		},
		// Activity
		lastMatchDate: {
			type: Date,
		},
		lastGoalDate: {
			type: Date,
		},
		streakMatches: {
			type: Number,
			default: 0,
		},
		// Awards
		manOfTheMatch: {
			type: Number,
			default: 0,
		},
		cleanSheets: {
			type: Number,
			default: 0,
		},
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'player_statistics' },
);

// Indexes
PlayerStatisticsSchema.index({ memberId: 1 });
PlayerStatisticsSchema.index({ totalGoals: -1 });
PlayerStatisticsSchema.index({ totalAssists: -1 });
PlayerStatisticsSchema.index({ averageRating: -1 });

export default PlayerStatisticsSchema;

