import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { Member } from '../schemas/Member.graphql';
import { Match } from '../schemas/Match.graphql';
import { Property } from '../schemas/Property.graphql';
import { MemberType } from '../libs/enums/member.enum';
import { AdminStatistics, CreateAdminInput } from './admin.graphql';
import { Member as MemberModel } from '../schemas/Member.model';
import { BadRequestException } from '@nestjs/common';

@Resolver()
export class AdminResolver {
	constructor(private readonly adminService: AdminService) {}

	private convertToGraphQLMember(member: MemberModel): Member {
		return {
			_id: member._id.toString(),
			memberType: member.memberType as any,
			memberStatus: member.memberStatus as any,
			memberAuthType: member.memberAuthType as any,
			memberPhone: member.memberPhone,
			memberNick: member.memberNick,
			memberFullName: member.memberFullName,
			memberImage: member.memberImage,
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

	// ========== MEMBER MANAGEMENT ==========

	@UseGuards(AdminGuard)
	@Query(() => [Member], { name: 'adminAllMembers' })
	async getAllMembers(
		@CurrentUser() user: JwtPayload,
		@Args('limit', { nullable: true, defaultValue: 50, type: () => Int })
		limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0, type: () => Int })
		skip?: number,
	) {
		const members = await this.adminService.getAllMembers(limit, skip);
		return members.map((m) => this.convertToGraphQLMember(m));
	}

	@UseGuards(AdminGuard)
	@Query(() => Member, { name: 'adminMember' })
	async getMemberById(
		@CurrentUser() user: JwtPayload,
		@Args('id', { type: () => ID }) id: string,
	) {
		const member = await this.adminService.getMemberById(id);
		return this.convertToGraphQLMember(member);
	}

	@UseGuards(AdminGuard)
	@Mutation(() => Member)
	async updateMemberType(
		@CurrentUser() user: JwtPayload,
		@Args('memberId', { type: () => ID }) memberId: string,
		@Args('memberType', { type: () => MemberType }) memberType: MemberType,
	) {
		// XAVFSIZLIK: ADMIN type'ni o'zgartirish MUTLAQO taqiqlangan
		if (memberType === MemberType.ADMIN) {
			throw new BadRequestException('Cannot set memberType to ADMIN. Admin can only be created once using createAdminWithSecret mutation with secret key.');
		}
		const member = await this.adminService.updateMemberType(memberId, memberType, user.sub);
		return this.convertToGraphQLMember(member);
	}

	@UseGuards(AdminGuard)
	@Mutation(() => Member)
	async blockMember(
		@CurrentUser() user: JwtPayload,
		@Args('memberId', { type: () => ID }) memberId: string,
	) {
		const member = await this.adminService.blockMember(memberId);
		return this.convertToGraphQLMember(member);
	}

	@UseGuards(AdminGuard)
	@Mutation(() => Member)
	async unblockMember(
		@CurrentUser() user: JwtPayload,
		@Args('memberId', { type: () => ID }) memberId: string,
	) {
		const member = await this.adminService.unblockMember(memberId);
		return this.convertToGraphQLMember(member);
	}

	@UseGuards(AdminGuard)
	@Mutation(() => Boolean)
	async deleteMember(
		@CurrentUser() user: JwtPayload,
		@Args('memberId', { type: () => ID }) memberId: string,
	) {
		await this.adminService.deleteMember(memberId);
		return true;
	}

	// ========== MATCH MANAGEMENT ==========

	@UseGuards(AdminGuard)
	@Query(() => [Match], { name: 'adminAllMatches' })
	async getAllMatches(
		@CurrentUser() user: JwtPayload,
		@Args('limit', { nullable: true, defaultValue: 50, type: () => Int })
		limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0, type: () => Int })
		skip?: number,
	) {
		return this.adminService.getAllMatches(limit, skip);
	}

	@UseGuards(AdminGuard)
	@Mutation(() => Boolean)
	async deleteMatch(
		@CurrentUser() user: JwtPayload,
		@Args('matchId', { type: () => ID }) matchId: string,
	) {
		await this.adminService.deleteMatch(matchId);
		return true;
	}

	// ========== PROPERTY MANAGEMENT ==========

	@UseGuards(AdminGuard)
	@Query(() => [Property], { name: 'adminAllProperties' })
	async getAllProperties(
		@CurrentUser() user: JwtPayload,
		@Args('limit', { nullable: true, defaultValue: 50, type: () => Int })
		limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0, type: () => Int })
		skip?: number,
	) {
		return this.adminService.getAllProperties(limit, skip);
	}

	@UseGuards(AdminGuard)
	@Mutation(() => Boolean)
	async deleteProperty(
		@CurrentUser() user: JwtPayload,
		@Args('propertyId', { type: () => ID }) propertyId: string,
	) {
		await this.adminService.deleteProperty(propertyId);
		return true;
	}

	// ========== ADMIN CREATION (SECRET KEY REQUIRED) ==========

	@Mutation(() => Member)
	async createAdminWithSecret(
		@Args('input') input: CreateAdminInput,
	) {
		const member = await this.adminService.createAdminWithSecret(
			input.memberPhone,
			input.memberNick,
			input.memberPassword,
			input.memberFullName,
			input.secretKey,
		);
		return this.convertToGraphQLMember(member);
	}

	// ========== STATISTICS ==========

	@UseGuards(AdminGuard)
	@Query(() => AdminStatistics, { name: 'adminStatistics' })
	async getStatistics(@CurrentUser() user: JwtPayload) {
		return this.adminService.getStatistics();
	}
}

