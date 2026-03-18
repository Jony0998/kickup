import { Schema, Document } from 'mongoose';

export enum TeamStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	DISBANDED = 'DISBANDED',
}

export enum TeamRole {
	OWNER = 'OWNER',
	CAPTAIN = 'CAPTAIN',
	MEMBER = 'MEMBER',
}

export interface TeamMember {
	memberId: any;
	role: TeamRole;
	joinedAt: Date;
	position?: string; // "GK", "DF", "MF", "FW"
	jerseyNumber?: number;
}

export interface Team extends Document {
	teamName: string;
	teamDescription?: string;
	teamLogo?: string;
	teamBanner?: string;
	ownerId: any;
	captainId?: any;
	members: TeamMember[];
	maxMembers: number;
	teamStatus: TeamStatus;
	location?: {
		city?: string;
		district?: string;
		coordinates?: {
			lat?: number;
			lng?: number;
		};
	};
	statistics: {
		totalMatches: number;
		wins: number;
		draws: number;
		losses: number;
		goalsFor: number;
		goalsAgainst: number;
	};
	teamColor?: string; // Primary team color
	teamColorSecondary?: string; // Secondary team color
	contactInfo?: {
		phone?: string;
		email?: string;
		socialMedia?: {
			instagram?: string;
			facebook?: string;
			website?: string;
		};
	};
	views: number;
	followers: number;
	rating: {
		average: number;
		count: number;
	};
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const TeamMemberSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
		role: {
			type: String,
			enum: TeamRole,
			default: TeamRole.MEMBER,
		},
		joinedAt: {
			type: Date,
			default: Date.now,
		},
		position: {
			type: String, // "GK", "DF", "MF", "FW"
		},
		jerseyNumber: {
			type: Number,
			min: 1,
			max: 99,
		},
	},
	{ _id: false },
);

const TeamSchema = new Schema(
	{
		teamName: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		teamDescription: {
			type: String,
		},
		teamLogo: {
			type: String,
			default: '',
		},
		teamBanner: {
			type: String,
			default: '',
		},
		ownerId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
		captainId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},
		members: [TeamMemberSchema],
		maxMembers: {
			type: Number,
			default: 30,
			min: 1,
			max: 50,
		},
		teamStatus: {
			type: String,
			enum: TeamStatus,
			default: TeamStatus.ACTIVE,
		},
		location: {
			city: String,
			district: String,
			coordinates: {
				lat: Number,
				lng: Number,
			},
		},
		statistics: {
			totalMatches: {
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
		},
		teamColor: {
			type: String, // Hex color code
		},
		teamColorSecondary: {
			type: String,
		},
		contactInfo: {
			phone: String,
			email: String,
			socialMedia: {
				instagram: String,
				facebook: String,
				website: String,
			},
		},
		views: {
			type: Number,
			default: 0,
		},
		followers: {
			type: Number,
			default: 0,
		},
		rating: {
			average: {
				type: Number,
				default: 0,
			},
			count: {
				type: Number,
				default: 0,
			},
		},
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'teams' },
);

// Indexes
TeamSchema.index({ teamName: 1 });
TeamSchema.index({ ownerId: 1 });
TeamSchema.index({ 'location.city': 1 });
TeamSchema.index({ teamStatus: 1 });
TeamSchema.index({ 'members.memberId': 1 });

export default TeamSchema;

