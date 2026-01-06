import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { MatchService } from './match.service';
import { Match } from '../../schemas/Match.graphql';
import { MatchStatus, MatchType } from '../../schemas/Match.model';

@Resolver(() => Match)
export class MatchResolver {
	constructor(private readonly matchService: MatchService) {}

	@Query(() => [Match], { name: 'matches' })
	async findAll(
		@Args('status', { nullable: true }) status?: MatchStatus,
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

	@Query(() => [Match], { name: 'myMatches' })
	async getMyMatches(@Args('organizerId', { type: () => ID }) organizerId: string) {
		return this.matchService.getMatchesByOrganizer(organizerId);
	}

	@Query(() => [Match], { name: 'myJoinedMatches' })
	async getMyJoinedMatches(@Args('memberId', { type: () => ID }) memberId: string) {
		return this.matchService.getMyJoinedMatches(memberId);
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

	@Mutation(() => Match)
	async createMatch(
		@Args('matchTitle') matchTitle: string,
		@Args('fieldId', { type: () => ID }) fieldId: string,
		@Args('organizerId', { type: () => ID }) organizerId: string,
		@Args('matchDate') matchDate: Date,
		@Args('matchTime') matchTime: string,
		@Args('maxPlayers', { nullable: true, defaultValue: 22 }) maxPlayers?: number,
		@Args('matchType', { nullable: true }) matchType?: MatchType,
		@Args('matchDescription', { nullable: true }) matchDescription?: string,
		@Args('matchFee', { nullable: true, defaultValue: 0 }) matchFee?: number,
	) {
		return this.matchService.createMatch({
			matchTitle,
			fieldId,
			organizerId,
			matchDate,
			matchTime,
			maxPlayers,
			matchType,
			matchDescription,
			matchFee,
		});
	}

	@Mutation(() => Match)
	async joinMatch(
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('memberId', { type: () => ID }) memberId: string,
	) {
		return this.matchService.joinMatch(matchId, memberId);
	}

	@Mutation(() => Match)
	async leaveMatch(
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('memberId', { type: () => ID }) memberId: string,
	) {
		return this.matchService.leaveMatch(matchId, memberId);
	}

	@Mutation(() => Match)
	async likeMatch(
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('memberId', { type: () => ID }) memberId: string,
	) {
		return this.matchService.likeMatch(matchId, memberId);
	}

	@Mutation(() => Boolean)
	async deleteMatch(@Args('id', { type: () => ID }) id: string) {
		return this.matchService.deleteMatch(id);
	}

	@Mutation(() => Match)
	async updateMatchStatus(
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('status') status: MatchStatus,
	) {
		return this.matchService.updateMatchStatus(matchId, status);
	}

	@Mutation(() => Match)
	async cancelMatch(
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('organizerId', { type: () => ID }) organizerId: string,
	) {
		return this.matchService.cancelMatch(matchId, organizerId);
	}
}

