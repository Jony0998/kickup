import { Schema, Document } from 'mongoose';

export enum PropertyStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	MAINTENANCE = 'MAINTENANCE',
}

export enum PropertyType {
	INDOOR = 'INDOOR',
	OUTDOOR = 'OUTDOOR',
	FUTSAL = 'FUTSAL',
	FULL_SIZE = 'FULL_SIZE',
}

export interface Property extends Document {
	propertyName: string;
	propertyDescription?: string;
	propertyType: PropertyType;
	propertyStatus: PropertyStatus;
	ownerId?: any;
	location: {
		address: string;
		city: string;
		district?: string;
		coordinates?: {
			lat?: number;
			lng?: number;
		};
	};
	contactInfo?: {
		phone?: string;
		email?: string;
	};
	amenities?: string[];
	fieldSize?: {
		width?: number;
		length?: number;
	};
	capacity?: number;
	hourlyRate?: number;
	images?: string[];
	rating?: {
		average: number;
		count: number;
	};
	views: number;
	bookings: number;
	isRecommended: boolean;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const PropertySchema = new Schema(
	{
		propertyName: {
			type: String,
			required: true,
		},
		propertyDescription: {
			type: String,
		},
		propertyType: {
			type: String,
			enum: PropertyType,
			default: PropertyType.OUTDOOR,
		},
		propertyStatus: {
			type: String,
			enum: PropertyStatus,
			default: PropertyStatus.ACTIVE,
		},
		ownerId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},
		location: {
			address: {
				type: String,
				required: true,
			},
			city: {
				type: String,
				required: true,
			},
			district: {
				type: String,
			},
			coordinates: {
				lat: {
					type: Number,
				},
				lng: {
					type: Number,
				},
			},
		},
		contactInfo: {
			phone: String,
			email: String,
		},
		amenities: [
			{
				type: String, // "PARKING", "SHOWER", "LOCKER", "CAFE", etc.
			},
		],
		fieldSize: {
			width: Number,
			length: Number,
		},
		capacity: {
			type: Number, // max players
		},
		hourlyRate: {
			type: Number,
			default: 0,
		},
		images: [
			{
				type: String,
			},
		],
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
		views: {
			type: Number,
			default: 0,
		},
		bookings: {
			type: Number,
			default: 0,
		},
		isRecommended: {
			type: Boolean,
			default: false,
		},
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'properties' },
);

// Indexes
PropertySchema.index({ 'location.city': 1, 'location.district': 1 });
PropertySchema.index({ propertyStatus: 1 });
PropertySchema.index({ isRecommended: 1 });
PropertySchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lng': 1 });

export default PropertySchema;

