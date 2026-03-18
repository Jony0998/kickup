import { Schema, Document } from 'mongoose';

export enum LeagueStatus {
	UPCOMING = 'UPCOMING',
	ONGOING = 'ONGOING',
	COMPLETED = 'COMPLETED',
	CANCELLED = 'CANCELLED',
}

export enum LeagueType {
	ROUND_ROBIN = 'ROUND_ROBIN', // Har bir jamoa boshqa jamoalar bilan o'ynaydi
	KNOCKOUT = 'KNOCKOUT', // Turnir formatida
	LEAGUE = 'LEAGUE', // Oddiy liga
}

export interface LeagueTeam {
	teamId: any;
	points: number;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
	goalDifference: number;
	matchesPlayed: number;
	joinedAt: Date;
}

export interface LeagueMatch {
	matchId: any;
	homeTeamId?: any;
	awayTeamId?: any;
	round?: number;
	status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

export interface League extends Document {
	leagueName: string;
	leagueDescription?: string;
	leagueLogo?: string;
	leagueBanner?: string;
	organizerId: any;
	leagueType: LeagueType;
	leagueStatus: LeagueStatus;
	teams: LeagueTeam[];
	matches: LeagueMatch[];
	maxTeams: number;
	minTeams: number;
	startDate: Date;
	endDate?: Date;
	registrationDeadline: Date;
	location?: {
		city?: string;
		district?: string;
		coordinates?: {
			lat?: number;
			lng?: number;
		};
	};
	entryFee?: number;
	prizePool?: number;
	rules?: string;
	contactInfo?: {
		phone?: string;
		email?: string;
	};
	views: number;
	followers: number;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const LeagueTeamSchema = new Schema(
	{
		teamId: {
			type: Schema.Types.ObjectId,
			ref: 'Team',
			required: true,
		},
		points: {
			type: Number,
			default: 0,
		},
		wins: {
			type: Number,
			default: 0,
		},
		draws: {
			type: Number,
			default: 0,
		},
		losses: {
			type: Number,
			default: 0,
		},
		goalsFor: {
			type: Number,
			default: 0,
		},
		goalsAgainst: {
			type: Number,
			default: 0,
		},
		goalDifference: {
			type: Number,
			default: 0,
		},
		matchesPlayed: {
			type: Number,
			default: 0,
		},
		joinedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: false },
);

const LeagueMatchSchema = new Schema(
	{
		matchId: {
			type: Schema.Types.ObjectId,
			ref: 'Match',
			required: true,
		},
		homeTeamId: {
			type: Schema.Types.ObjectId,
			ref: 'Team',
		},
		awayTeamId: {
			type: Schema.Types.ObjectId,
			ref: 'Team',
		},
		round: {
			type: Number,
		},
		status: {
			type: String,
			enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
			default: 'SCHEDULED',
		},
	},
	{ _id: false },
);

const LeagueSchema = new Schema(
	{
		leagueName: {
			type: String,
			required: true,
			trim: true,
		},
		leagueDescription: {
			type: String,
		},
		leagueLogo: {
			type: String,
			default: '',
		},
		leagueBanner: {
			type: String,
			default: '',
		},
		organizerId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
		leagueType: {
			type: String,
			enum: LeagueType,
			default: LeagueType.LEAGUE,
		},
		leagueStatus: {
			type: String,
			enum: LeagueStatus,
			default: LeagueStatus.UPCOMING,
		},
		teams: [LeagueTeamSchema],
		matches: [LeagueMatchSchema],
		maxTeams: {
			type: Number,
			required: true,
			default: 16,
		},
		minTeams: {
			type: Number,
			required: true,
			default: 4,
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
		},
		registrationDeadline: {
			type: Date,
			required: true,
		},
		location: {
			city: String,
			district: String,
			coordinates: {
				lat: Number,
				lng: Number,
			},
		},
		entryFee: {
			type: Number,
			default: 0,
		},
		prizePool: {
			type: Number,
			default: 0,
		},
		rules: {
			type: String,
		},
		contactInfo: {
			phone: String,
			email: String,
		},
		views: {
			type: Number,
			default: 0,
		},
		followers: {
			type: Number,
			default: 0,
		},
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'leagues' },
);

// Indexes
LeagueSchema.index({ leagueName: 1 });
LeagueSchema.index({ organizerId: 1 });
LeagueSchema.index({ leagueStatus: 1 });
LeagueSchema.index({ startDate: 1 });
LeagueSchema.index({ 'location.city': 1 });
LeagueSchema.index({ 'teams.teamId': 1 });

export default LeagueSchema;

