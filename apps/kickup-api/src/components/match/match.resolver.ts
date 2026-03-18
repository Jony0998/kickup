import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { MatchService } from './match.service';
import { Match, CreateMatchInput } from '../../schemas/Match.graphql';
import { MatchStatus, MatchType } from '../../libs/enums/match.enum';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';

@Resolver(() => Match)
export class MatchResolver {
	constructor(private readonly matchService: MatchService) { }

	@Query(() => [Match], { name: 'matches' })
	async findAll(
		@Args('status', { nullable: true, type: () => MatchStatus })
		status?: MatchStatus,
		@Args('city', { nullable: true }) city?: string,
		@Args('district', { nullable: true }) district?: string,
		@Args('date', { nullable: true }) date?: Date,
		@Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0 }) skip?: number,
	) {
		return this.matchService.findAll({
			status,
			city,
			district,
			date,
			limit,
			skip,
		});
	}

	@Query(() => Match, { name: 'match' })
	async findOne(@Args('id', { type: () => ID }) id: string) {
		return this.matchService.findOne(id);
	}

	@Query(() => [Match], { name: 'upcomingMatches' })
	async getUpcomingMatches(
		@Args('limit', { nullable: true, defaultValue: 10 }) limit?: number,
	) {
		return this.matchService.getUpcomingMatches(limit);
	}

	@UseGuards(AuthGuard)
	@Query(() => [Match], { name: 'myMatches' })
	async getMyMatches(@CurrentUser() user: JwtPayload) {
		return this.matchService.getMatchesByOrganizer(user.sub);
	}

	@UseGuards(AuthGuard)
	@Query(() => [Match], { name: 'myJoinedMatches' })
	async getMyJoinedMatches(@CurrentUser() user: JwtPayload) {
		return this.matchService.getMyJoinedMatches(user.sub);
	}

	@Query(() => [Match], { name: 'searchMatches' })
	async searchMatches(
		@Args('city', { nullable: true }) city?: string,
		@Args('district', { nullable: true }) district?: string,
		@Args('dateFrom', { nullable: true }) dateFrom?: Date,
		@Args('dateTo', { nullable: true }) dateTo?: Date,
		@Args('skillLevel', { nullable: true }) skillLevel?: string,
		@Args('maxFee', { nullable: true }) maxFee?: number,
		@Args('minPlayers', { nullable: true }) minPlayers?: number,
		@Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0 }) skip?: number,
	) {
		return this.matchService.searchMatches({
			city,
			district,
			dateFrom,
			dateTo,
			skillLevel,
			maxFee,
			minPlayers,
			limit,
			skip,
		});
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Match)
	async createMatch(
		@CurrentUser() user: JwtPayload,
		@Args('input') input: CreateMatchInput,
	) {
		// Only ADMIN and AGENT can create matches
		if (user.memberType === 'USER') {
			throw new UnauthorizedException('Only stadium owners and admins can create matches');
		}

		return this.matchService.createMatch({
			...input,
			organizerId: user.sub,
		});
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Match)
	async joinMatch(
		@CurrentUser() user: JwtPayload,
		@Args('matchId', { type: () => ID }) matchId: string,
	) {
		return this.matchService.joinMatch(matchId, user.sub);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Match)
	async leaveMatch(
		@CurrentUser() user: JwtPayload,
		@Args('matchId', { type: () => ID }) matchId: string,
	) {
		return this.matchService.leaveMatch(matchId, user.sub);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Match)
	async likeMatch(
		@CurrentUser() user: JwtPayload,
		@Args('matchId', { type: () => ID }) matchId: string,
	) {
		return this.matchService.likeMatch(matchId, user.sub);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async deleteMatch(
		@CurrentUser() user: JwtPayload,
		@Args('id', { type: () => ID }) id: string,
	) {
		// Check if user is organizer
		const match = await this.matchService.findOne(id);
		if (match.organizerId.toString() !== user.sub) {
			throw new Error('Only organizer can delete the match');
		}
		return this.matchService.deleteMatch(id);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Match)
	async updateMatchStatus(
		@CurrentUser() user: JwtPayload,
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('status', { type: () => MatchStatus }) status: MatchStatus,
	) {
		// Check if user is organizer
		const match = await this.matchService.findOne(matchId);
		if (match.organizerId.toString() !== user.sub) {
			throw new Error('Only organizer can update match status');
		}
		return this.matchService.updateMatchStatus(matchId, status);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Match)
	async cancelMatch(
		@CurrentUser() user: JwtPayload,
		@Args('matchId', { type: () => ID }) matchId: string,
	) {
		return this.matchService.cancelMatch(matchId, user.sub);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Match)
	async checkIn(
		@CurrentUser() user: JwtPayload,
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('memberId', { type: () => ID }) memberId: string,
	) {
		// Check if user is organizer
		const match = await this.matchService.findOne(matchId);
		if (match.organizerId.toString() !== user.sub) {
			throw new Error('Only organizer can check in players');
		}
		return this.matchService.checkIn(matchId, memberId);
	}
}

