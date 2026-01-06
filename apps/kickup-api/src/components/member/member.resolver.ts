import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { Member } from '../../schemas/Member.graphql';
import { MemberAuthType } from '../../libs/enums/member.enum';
import { AuthService } from '../../auth/auth.service';
import { AuthResponse, TelegramAuthInput } from '../../auth/auth.graphql';
import { TelegramAuthData } from '../../auth/telegram-auth.service';

@Resolver(() => Member)
export class MemberResolver {
	constructor(
		private readonly memberService: MemberService,
		private readonly authService: AuthService,
	) {}

	@Query(() => Member, { name: 'member' })
	async findOne(@Args('id', { type: () => ID }) id: string) {
		return this.memberService.findOne(id);
	}

	@Query(() => Member, { name: 'memberByNick' })
	async findByNick(@Args('memberNick') memberNick: string) {
		return this.memberService.findByNick(memberNick);
	}


	@Mutation(() => Member)
	async updateProfile(
		@Args('id', { type: () => ID }) id: string,
		@Args('updateData') updateData: any,
	) {
		return this.memberService.updateProfile(id, updateData);
	}

	@Mutation(() => Boolean)
	async updatePassword(
		@Args('id', { type: () => ID }) id: string,
		@Args('oldPassword') oldPassword: string,
		@Args('newPassword') newPassword: string,
	) {
		return this.memberService.updatePassword(id, oldPassword, newPassword);
	}

	@Mutation(() => Member)
	async followMember(
		@Args('followerId', { type: () => ID }) followerId: string,
		@Args('followingId', { type: () => ID }) followingId: string,
	): Promise<Member> {
		return this.memberService.followMember(followerId, followingId);
	}

	@Mutation(() => Boolean)
	async deleteMember(@Args('id', { type: () => ID }) id: string) {
		return this.memberService.deleteMember(id);
	}

	@Mutation(() => AuthResponse)
	async loginWithTelegram(
		@Args('telegramData') telegramData: TelegramAuthInput,
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
		return this.authService.createAuthResponse(member);
	}

	@Mutation(() => AuthResponse)
	async login(
		@Args('memberPassword') memberPassword: string,
		@Args('memberPhone', { nullable: true }) memberPhone?: string,
		@Args('memberNick', { nullable: true }) memberNick?: string,
	): Promise<AuthResponse> {
		const member = await this.memberService.login({
			memberPhone,
			memberNick,
			memberPassword,
		});
		return this.authService.createAuthResponse(member);
	}

	@Mutation(() => AuthResponse)
	async register(
		@Args('memberPhone') memberPhone: string,
		@Args('memberNick') memberNick: string,
		@Args('memberPassword') memberPassword: string,
		@Args('memberFullName', { nullable: true }) memberFullName?: string,
		@Args('memberAuthType', { nullable: true }) memberAuthType?: MemberAuthType,
	): Promise<AuthResponse> {
		const member = await this.memberService.register({
			memberPhone,
			memberNick,
			memberPassword,
			memberFullName,
			memberAuthType,
		});
		return this.authService.createAuthResponse(member);
	}
}

