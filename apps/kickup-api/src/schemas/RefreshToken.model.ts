import { Schema, Document } from 'mongoose';

export interface RefreshToken extends Document {
	userId: any; // Member ID
	token: string; // Refresh token string
	deviceInfo?: {
		userAgent?: string;
		ipAddress?: string;
		deviceType?: string; // "MOBILE", "DESKTOP", "TABLET"
	};
	isActive: boolean;
	expiresAt: Date;
	lastUsedAt?: Date;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const RefreshTokenSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
			index: true,
		},
		token: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		deviceInfo: {
			userAgent: String,
			ipAddress: String,
			deviceType: String, // "MOBILE", "DESKTOP", "TABLET"
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		expiresAt: {
			type: Date,
			required: true,
			index: true,
		},
		lastUsedAt: {
			type: Date,
		},
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'refresh_tokens' },
);

// Indexes for efficient queries
RefreshTokenSchema.index({ userId: 1, isActive: 1 });
RefreshTokenSchema.index({ token: 1, isActive: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }); // For cleanup expired tokens

export default RefreshTokenSchema;

