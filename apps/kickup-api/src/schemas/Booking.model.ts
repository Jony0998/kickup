import { Schema, Document } from 'mongoose';

export enum BookingStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	CANCELLED = 'CANCELLED',
	COMPLETED = 'COMPLETED',
}

export interface Booking extends Document {
	fieldId: any;
	bookerId: any;
	matchId?: any;
	bookingDate: Date;
	startTime: string;
	endTime: string;
	duration: number;
	totalAmount: number;
	status: BookingStatus;
	paymentStatus: string;
	notes?: string;
	cancelledAt?: Date;
	cancellationReason?: string;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const BookingSchema = new Schema(
	{
		fieldId: {
			type: Schema.Types.ObjectId,
			ref: 'Property',
			required: true,
		},
		bookerId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
		matchId: {
			type: Schema.Types.ObjectId,
			ref: 'Match',
		},
		bookingDate: {
			type: Date,
			required: true,
		},
		startTime: {
			type: String, // "18:00"
			required: true,
		},
		endTime: {
			type: String, // "20:00"
			required: true,
		},
		duration: {
			type: Number, // minutes
			required: true,
		},
		totalAmount: {
			type: Number,
			required: true,
			default: 0,
		},
		status: {
			type: String,
			enum: BookingStatus,
			default: BookingStatus.PENDING,
		},
		paymentStatus: {
			type: String,
			enum: ['PENDING', 'PAID', 'REFUNDED'],
			default: 'PENDING',
		},
		notes: {
			type: String,
		},
		cancelledAt: {
			type: Date,
		},
		cancellationReason: {
			type: String,
		},
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'bookings' },
);

// Indexes
BookingSchema.index({ fieldId: 1, bookingDate: 1 });
BookingSchema.index({ bookerId: 1 });
BookingSchema.index({ matchId: 1 });
BookingSchema.index({ status: 1, bookingDate: 1 });
BookingSchema.index({ bookingDate: 1, startTime: 1, endTime: 1 });

export default BookingSchema;

