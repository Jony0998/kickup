import { Schema, Document } from 'mongoose';

export enum RefereeStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	SUSPENDED = 'SUSPENDED',
}

export enum RefereeLevel {
	BEGINNER = 'BEGINNER',
	INTERMEDIATE = 'INTERMEDIATE',
	ADVANCED = 'ADVANCED',
	PROFESSIONAL = 'PROFESSIONAL',
}

export interface Referee extends Document {
	memberId: any; // Reference to Member
	refereeLevel: RefereeLevel;
	refereeStatus: RefereeStatus;
	certificationNumber?: string;
	certificationDate?: Date;
	experienceYears: number;
	totalMatches: number;
	rating: {
		average: number;
		count: number;
	};
	specializations?: string[]; // ["FOOTBALL", "FUTSAL", "BEACH_SOCCER"]
	availability?: {
		daysOfWeek?: number[]; // [0,1,2,3,4,5,6] Sunday to Saturday
		timeSlots?: string[]; // ["09:00-12:00", "18:00-21:00"]
		city?: string;
		district?: string;
	};
	contactInfo?: {
		phone?: string;
		email?: string;
	};
	notes?: string;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const RefereeSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
			unique: true,
		},
		refereeLevel: {
			type: String,
			enum: RefereeLevel,
			default: RefereeLevel.BEGINNER,
		},
		refereeStatus: {
			type: String,
			enum: RefereeStatus,
			default: RefereeStatus.ACTIVE,
		},
		certificationNumber: {
			type: String,
		},
		certificationDate: {
			type: Date,
		},
		experienceYears: {
			type: Number,
			default: 0,
			min: 0,
		},
		totalMatches: {
			type: Number,
			default: 0,
		},
		rating: {
			average: {
				type: Number,
				default: 0,
				min: 0,
				max: 5,
			},
			count: {
				type: Number,
				default: 0,
			},
		},
		specializations: [
			{
				type: String,
			},
		],
		availability: {
			daysOfWeek: [Number], // 0-6
			timeSlots: [String],
			city: String,
			district: String,
		},
		contactInfo: {
			phone: String,
			email: String,
		},
		notes: {
			type: String,
		},
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'referees' },
);

// Indexes
RefereeSchema.index({ memberId: 1 });
RefereeSchema.index({ refereeStatus: 1 });
RefereeSchema.index({ refereeLevel: 1 });
RefereeSchema.index({ 'availability.city': 1 });
RefereeSchema.index({ rating: -1 });

export default RefereeSchema;

