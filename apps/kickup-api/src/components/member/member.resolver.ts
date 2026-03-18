import { Resolver, Query, Mutation, Args, ID, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MemberService } from './member.service';
import { Member } from '../../schemas/Member.graphql';
import { Member as MemberModel } from '../../schemas/Member.model';
import { LoginInput, RegisterInput } from '../../schemas/Member.graphql';
import { MemberAuthType } from '../../libs/enums/member.enum';
import { AuthService } from '../../auth/auth.service';
import { AuthResponse, TelegramAuthInput } from '../../auth/auth.graphql';
import { TelegramAuthData } from '../../auth/telegram-auth.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';

@Resolver(() => Member)
export class MemberResolver {
	constructor(
		private readonly memberService: MemberService,
		private readonly authService: AuthService,
	) { }

	private convertToGraphQLMember(member: MemberModel): Member {
		return {
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
		} as Member;
	}

	@Query(() => Member, { name: 'member' })
	async findOne(@Args('id', { type: () => ID }) id: string) {
		const member = await this.memberService.findOne(id);
		return this.convertToGraphQLMember(member);
	}

	@Query(() => Member, { name: 'memberByNick' })
	async findByNick(@Args('memberNick') memberNick: string) {
		const member = await this.memberService.findByNick(memberNick);
		return this.convertToGraphQLMember(member);
	}

	@Query(() => [Member], { name: 'topMembers' })
	async getTopMembers(
		@Args('limit', { nullable: true, defaultValue: 10, type: () => Int }) limit: number,
	) {
		const members = await this.memberService.getTopMembers(limit);
		return members.map((m) => this.convertToGraphQLMember(m));
	}

	/** Public query: true if an admin already exists (signup page hides "Register as administrator" when true). */
	@Query(() => Boolean, { name: 'adminExists' })
	async adminExists(): Promise<boolean> {
		return this.memberService.hasAdmin();
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	async updateProfile(
		@CurrentUser() user: JwtPayload,
		@Args('updateData', { type: () => String }) updateData: string,
	) {
		const parsed = updateData ? JSON.parse(updateData) : {};
		const member = await this.memberService.updateProfile(user.sub, parsed);
		return this.convertToGraphQLMember(member);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async updatePassword(
		@CurrentUser() user: JwtPayload,
		@Args('oldPassword') oldPassword: string,
		@Args('newPassword') newPassword: string,
	) {
		return this.memberService.updatePassword(user.sub, oldPassword, newPassword);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	async followMember(
		@CurrentUser() user: JwtPayload,
		@Args('followingId', { type: () => ID }) followingId: string,
	): Promise<Member> {
		const member = await this.memberService.followMember(user.sub, followingId);
		return this.convertToGraphQLMember(member);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async deleteMember(@CurrentUser() user: JwtPayload) {
		return this.memberService.deleteMember(user.sub);
	}

	@Mutation(() => AuthResponse)
	async loginWithTelegram(
		@Args('telegramData') telegramData: TelegramAuthInput,
		@Context() ctx: any,
	): Promise<AuthResponse> {
		const authData: TelegramAuthData = {
			id: telegramData.id,
			first_name: telegramData.first_name,
			last_name: telegramData.last_name,
			username: telegramData.username,
			photo_url: telegramData.photo_url,
			auth_date: telegramData.auth_date,
			hash: telegramData.hash,
		};

		const member = await this.memberService.loginWithTelegram(authData);
		const deviceInfo = this.getDeviceInfo(ctx?.req);
		const auth = await this.authService.createAuthResponse(member, deviceInfo);
		this.setAuthCookie(ctx?.res, auth.accessToken, auth.refreshToken);
		return auth;
	}

	@Mutation(() => AuthResponse)
	async login(
		@Args('input') input: LoginInput,
		@Context() ctx?: any,
	): Promise<AuthResponse> {
		const member = await this.memberService.login(input);
		const deviceInfo = this.getDeviceInfo(ctx?.req);
		const auth = await this.authService.createAuthResponse(member, deviceInfo);
		this.setAuthCookie(ctx?.res, auth.accessToken, auth.refreshToken);
		return auth;
	}

	@Mutation(() => AuthResponse)
	async register(
		@Args('input') input: RegisterInput,
		@Context() ctx?: any,
	): Promise<AuthResponse> {
		try {
			console.log('=== REGISTER MUTATION STARTED ===');
			console.log('Input data:', {
				memberPhone: input.memberPhone,
				memberNick: input.memberNick,
				isAdmin: input.isAdmin,
				hasPassword: !!input.memberPassword,
				memberAuthType: input.memberAuthType
			});

			const member = await this.memberService.register(input);

			console.log('Member created in service, ID:', member._id);
			console.log('Creating auth response...');

			const deviceInfo = this.getDeviceInfo(ctx?.req);
			const auth = await this.authService.createAuthResponse(member, deviceInfo);

			console.log('Auth response created, setting cookie...');
			this.setAuthCookie(ctx?.res, auth.accessToken, auth.refreshToken);

			console.log('=== REGISTER MUTATION SUCCESS ===');
			console.log('Returning auth response with member ID:', auth.member._id);

			return auth;
		} catch (error) {
			console.error('=== REGISTER MUTATION ERROR ===');
			console.error('Error details:', {
				name: error.name,
				message: error.message,
				stack: error.stack,
			});
			throw error;
		}
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async logout(@CurrentUser() user: JwtPayload, @Context() ctx: any): Promise<boolean> {
		// Revoke refresh token
		const cookieHeader = ctx?.req?.headers?.cookie;
		const cookies = this.parseCookies(cookieHeader);
		if (cookies.refreshToken) {
			await this.authService.revokeRefreshToken(cookies.refreshToken);
		}

		// Clear cookies
		const isProd = process.env.NODE_ENV === 'production';
		ctx?.res?.clearCookie?.('accessToken', {
			httpOnly: true,
			secure: isProd,
			sameSite: isProd ? 'none' : 'lax',
			path: '/',
		});
		ctx?.res?.clearCookie?.('refreshToken', {
			httpOnly: true,
			secure: isProd,
			sameSite: isProd ? 'none' : 'lax',
			path: '/',
		});
		return true;
	}

	@Mutation(() => AuthResponse, { name: 'refreshToken' })
	async refreshToken(@Context() ctx?: any): Promise<AuthResponse> {
		const cookieHeader = ctx?.req?.headers?.cookie;
		const cookies = this.parseCookies(cookieHeader);
		const refreshToken = cookies.refreshToken;

		if (!refreshToken) {
			throw new Error('Refresh token not found');
		}

		const auth = await this.authService.refreshAccessToken(refreshToken);
		this.setAuthCookie(ctx?.res, auth.accessToken, auth.refreshToken);
		return auth;
	}

	@UseGuards(AuthGuard)
	@Query(() => Member, { name: 'me' })
	async getCurrentUser(@CurrentUser() user: JwtPayload): Promise<Member> {
		const member = await this.memberService.findOne(user.sub);
		return this.convertToGraphQLMember(member);
	}

	private getDeviceInfo(req: any): {
		userAgent?: string;
		ipAddress?: string;
		deviceType?: string;
	} {
		if (!req) return {};

		const userAgent = req.headers['user-agent'] || '';
		const ipAddress = req.ip || req.connection?.remoteAddress || '';

		// Determine device type
		let deviceType = 'DESKTOP';
		if (/mobile|android|iphone|ipad/i.test(userAgent)) {
			deviceType = 'MOBILE';
		} else if (/tablet|ipad/i.test(userAgent)) {
			deviceType = 'TABLET';
		}

		return {
			userAgent,
			ipAddress,
			deviceType,
		};
	}

	private parseCookies(cookieHeader?: string): Record<string, string> {
		if (!cookieHeader) return {};
		return cookieHeader.split(';').reduce((acc, part) => {
			const [rawKey, ...rest] = part.split('=');
			const key = rawKey?.trim();
			if (!key) return acc;
			const value = rest.join('=').trim();
			acc[key] = decodeURIComponent(value);
			return acc;
		}, {} as Record<string, string>);
	}

	private setAuthCookie(res: any, accessToken: string, refreshToken?: string) {
		if (!res?.cookie) return;
		const isProd = process.env.NODE_ENV === 'production';

		// Set access token (short-lived)
		res.cookie('accessToken', accessToken, {
			httpOnly: true,
			secure: isProd,
			sameSite: isProd ? 'none' : 'lax',
			path: '/',
			maxAge: 15 * 60 * 1000, // 15 minutes
		});

		// Set refresh token (long-lived) if provided
		if (refreshToken) {
			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: isProd,
				sameSite: isProd ? 'none' : 'lax',
				path: '/',
				maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
			});
		}
	}
}

