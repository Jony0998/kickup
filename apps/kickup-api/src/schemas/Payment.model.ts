import { Schema, Document } from 'mongoose';

export enum PaymentStatus {
	PENDING = 'PENDING',
	PROCESSING = 'PROCESSING',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
	CANCELLED = 'CANCELLED',
	REFUNDED = 'REFUNDED',
}

export enum PaymentType {
	MATCH_FEE = 'MATCH_FEE',
	BOOKING_FEE = 'BOOKING_FEE',
	LEAGUE_ENTRY = 'LEAGUE_ENTRY',
	SUBSCRIPTION = 'SUBSCRIPTION',
	OTHER = 'OTHER',
}

export enum PaymentMethod {
	CASH = 'CASH',
	CARD = 'CARD',
	MOBILE_PAYMENT = 'MOBILE_PAYMENT', // Payme, Click, Uzum, etc.
	BANK_TRANSFER = 'BANK_TRANSFER',
	CRYPTO = 'CRYPTO',
}

export interface Payment extends Document {
	userId: any; // Member who pays
	paymentType: PaymentType;
	amount: number;
	currency: string; // "UZS", "USD", etc.
	paymentMethod: PaymentMethod;
	paymentStatus: PaymentStatus;
	// Related entity IDs
	relatedMatchId?: any;
	relatedBookingId?: any;
	relatedLeagueId?: any;
	// Payment details
	transactionId?: string; // External payment gateway transaction ID
	paymentGateway?: string; // "PAYME", "CLICK", "UZUM", "STRIPE", etc.
	paymentData?: any; // Additional payment data as JSON
	// Metadata
	description?: string;
	receiptUrl?: string;
	refundAmount?: number;
	refundReason?: string;
	refundedAt?: Date;
	paidAt?: Date;
	failedAt?: Date;
	failureReason?: string;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const PaymentSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
		paymentType: {
			type: String,
			enum: PaymentType,
			required: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 0,
		},
		currency: {
			type: String,
			default: 'UZS',
		},
		paymentMethod: {
			type: String,
			enum: PaymentMethod,
			required: true,
		},
		paymentStatus: {
			type: String,
			enum: PaymentStatus,
			default: PaymentStatus.PENDING,
		},
		relatedMatchId: {
			type: Schema.Types.ObjectId,
			ref: 'Match',
		},
		relatedBookingId: {
			type: Schema.Types.ObjectId,
			ref: 'Booking',
		},
		relatedLeagueId: {
			type: Schema.Types.ObjectId,
			ref: 'League',
		},
		transactionId: {
			type: String,
		},
		paymentGateway: {
			type: String,
		},
		paymentData: {
			type: Schema.Types.Mixed, // JSON data
		},
		description: {
			type: String,
		},
		receiptUrl: {
			type: String,
		},
		refundAmount: {
			type: Number,
			min: 0,
		},
		refundReason: {
			type: String,
		},
		refundedAt: {
			type: Date,
		},
		paidAt: {
			type: Date,
		},
		failedAt: {
			type: Date,
		},
		failureReason: {
			type: String,
		},
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'payments' },
);

// Indexes
PaymentSchema.index({ userId: 1, paymentStatus: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ relatedMatchId: 1 });
PaymentSchema.index({ relatedBookingId: 1 });
PaymentSchema.index({ relatedLeagueId: 1 });
PaymentSchema.index({ createdAt: -1 });

export default PaymentSchema;

