import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../schemas/Member.model';
import { Member as GraphQLMember } from '../schemas/Member.graphql';
import { RefreshToken } from '../schemas/RefreshToken.model';
import * as crypto from 'crypto';

export interface JwtPayload {
	sub: string; // member ID
	memberNick: string;
	memberType: string;
}

export interface AuthResponse {
	member: GraphQLMember;
	accessToken: string;
	refreshToken?: string;
}

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		@InjectModel('RefreshToken') private readonly refreshTokenModel: Model<RefreshToken>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) { }

	async generateAccessToken(member: Member): Promise<string> {
		const payload: JwtPayload = {
			sub: member._id.toString(),
			memberNick: member.memberNick,
			memberType: member.memberType,
		};

		const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m'; // Short-lived access token
		return this.jwtService.sign(payload, { expiresIn });
	}

	async generateRefreshToken(): Promise<string> {
		// Generate secure random token
		return crypto.randomBytes(64).toString('hex');
	}

	async createRefreshToken(
		userId: string,
		deviceInfo?: {
			userAgent?: string;
			ipAddress?: string;
			deviceType?: string;
		},
	): Promise<RefreshToken> {
		const token = await this.generateRefreshToken();
		const expiresInDays = parseInt(this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN_DAYS') || '30');
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expiresInDays);

		const refreshToken = new this.refreshTokenModel({
			userId,
			token,
			deviceInfo,
			isActive: true,
			expiresAt,
		});

		return refreshToken.save();
	}

	async verifyRefreshToken(token: string): Promise<RefreshToken> {
		const refreshToken = await this.refreshTokenModel.findOne({
			token,
			deletedAt: null,
		});

		if (!refreshToken) {
			throw new UnauthorizedException('Invalid refresh token');
		}

		// Reuse Protection: If token is used but inactive, it means it's being reused!
		// This suggests the token was stolen. Revoke ALL tokens for this user.
		if (!refreshToken.isActive) {
			console.warn(`[SECURITY] Token Reuse Detected! Revoking all tokens for user: ${refreshToken.userId}`);
			await this.revokeAllUserTokens(refreshToken.userId);
			throw new UnauthorizedException('Security Alert: Token reuse detected. Re-login required.');
		}

		if (refreshToken.expiresAt < new Date()) {
			refreshToken.isActive = false;
			await refreshToken.save();
			throw new UnauthorizedException('Refresh token expired');
		}

		// Update last used
		refreshToken.lastUsedAt = new Date();
		await refreshToken.save();

		return refreshToken;
	}

	async verifyToken(token: string): Promise<JwtPayload> {
		try {
			return this.jwtService.verify(token);
		} catch (error) {
			throw new UnauthorizedException('Invalid or expired token');
		}
	}


	async refreshAccessToken(refreshTokenString: string): Promise<AuthResponse> {
		// 1. Verify incoming refresh token
		const existingRefreshToken = await this.verifyRefreshToken(refreshTokenString);

		// 2. Get member
		const member = await this.memberModel.findById(existingRefreshToken.userId);
		if (!member || member.deletedAt) {
			throw new UnauthorizedException('Member not found');
		}

		// 3. Token Rotation: Invalidate the used token
		existingRefreshToken.isActive = false;
		existingRefreshToken.deletedAt = new Date();
		await existingRefreshToken.save();

		// 4. Generate NEW tokens (Rotation)
		const accessToken = await this.generateAccessToken(member);
		const newRefreshToken = await this.createRefreshToken(member._id.toString(), existingRefreshToken.deviceInfo);

		// 5. Convert to GraphQL format
		const graphQLMember: GraphQLMember = {
			_id: member._id.toString(),
			memberType: member.memberType as any,
			memberStatus: member.memberStatus as any,
			memberAuthType: member.memberAuthType as any,
			memberSkillLevel: member.memberSkillLevel as any,
			memberPhone: member.memberPhone,
			memberNick: member.memberNick,
			memberFullName: member.memberFullName,
			memberImage: member.memberImage ?? '',
			memberAddress: member.memberAddress,
			memberDesc: member.memberDesc,
			memberProperties: member.memberProperties,
			memberArticles: member.memberArticles,
			memberFollowers: member.memberFollowers,
			memberFollowings: member.memberFollowings,
			memberPoints: member.memberPoints,
			memberLikes: member.memberLikes,
			memberViews: member.memberViews,
			memberComments: member.memberComments,
			memberRank: member.memberRank,
			memberWarnings: member.memberWarnings,
			memberBlocks: member.memberBlocks,
			createdAt: member.createdAt,
			updatedAt: member.updatedAt,
		};

		return {
			member: graphQLMember,
			accessToken,
			refreshToken: newRefreshToken.token, // Return NEW refresh token
		};
	}

	async createAuthResponse(
		member: Member,
		deviceInfo?: {
			userAgent?: string;
			ipAddress?: string;
			deviceType?: string;
		},
	): Promise<AuthResponse> {
		const accessToken = await this.generateAccessToken(member);
		const refreshToken = await this.createRefreshToken(member._id.toString(), deviceInfo);

		// Convert MongoDB Member to GraphQL Member format (memberImage always string so it persists after logout/login)
		const graphQLMember: GraphQLMember = {
			_id: member._id.toString(),
			memberType: member.memberType as any,
			memberStatus: member.memberStatus as any,
			memberAuthType: member.memberAuthType as any,
			memberSkillLevel: member.memberSkillLevel as any,
			memberPhone: member.memberPhone,
			memberNick: member.memberNick,
			memberFullName: member.memberFullName,
			memberImage: member.memberImage ?? '',
			memberAddress: member.memberAddress,
			memberDesc: member.memberDesc,
			memberProperties: member.memberProperties,
			memberArticles: member.memberArticles,
			memberFollowers: member.memberFollowers,
			memberFollowings: member.memberFollowings,
			memberPoints: member.memberPoints,
			memberLikes: member.memberLikes,
			memberViews: member.memberViews,
			memberComments: member.memberComments,
			memberRank: member.memberRank,
			memberWarnings: member.memberWarnings,
			memberBlocks: member.memberBlocks,
			createdAt: member.createdAt,
			updatedAt: member.updatedAt,
		};

		return {
			member: graphQLMember,
			accessToken,
			refreshToken: refreshToken.token,
		};
	}

	async revokeRefreshToken(token: string): Promise<boolean> {
		const refreshToken = await this.refreshTokenModel.findOne({ token });
		if (refreshToken) {
			refreshToken.isActive = false;
			refreshToken.deletedAt = new Date();
			await refreshToken.save();
		}
		return true;
	}

	async revokeAllUserTokens(userId: string): Promise<boolean> {
		await this.refreshTokenModel.updateMany(
			{ userId, isActive: true },
			{
				$set: {
					isActive: false,
					deletedAt: new Date(),
				},
			},
		);
		return true;
	}

	async getUserRefreshTokens(userId: string): Promise<RefreshToken[]> {
		return this.refreshTokenModel
			.find({
				userId,
				isActive: true,
				deletedAt: null,
				expiresAt: { $gt: new Date() },
			})
			.sort({ createdAt: -1 })
			.exec();
	}
}

