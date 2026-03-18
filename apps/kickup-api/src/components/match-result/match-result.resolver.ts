import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MatchResultService } from './match-result.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import { MatchResult, CreateMatchResultInput } from '../../schemas/MatchResult.graphql';
import { MatchResult as MatchResultModel } from '../../schemas/MatchResult.model';

@Resolver(() => MatchResult)
export class MatchResultResolver {
	constructor(private readonly matchResultService: MatchResultService) {}

	private convertToGraphQLMatchResult(result: MatchResultModel): MatchResult {
		return {
			_id: result._id.toString(),
			matchId: result.matchId.toString(),
			homeTeamId: result.homeTeamId?.toString(),
			awayTeamId: result.awayTeamId?.toString(),
			homeScore: result.homeScore,
			awayScore: result.awayScore,
			homePlayers: result.homePlayers?.map((id) => id.toString()),
			awayPlayers: result.awayPlayers?.map((id) => id.toString()),
			goals: result.goals.map((g) => ({
				playerId: g.playerId.toString(),
				minute: g.minute,
				assistPlayerId: g.assistPlayerId?.toString(),
				isOwnGoal: g.isOwnGoal,
				isPenalty: g.isPenalty,
			})),
			resultStatus: result.resultStatus as any,
			confirmedBy: result.confirmedBy?.map((id) => id.toString()),
			disputedBy: result.disputedBy?.toString(),
			disputeReason: result.disputeReason,
			refereeId: result.refereeId?.toString(),
			refereeNotes: result.refereeNotes,
			matchDuration: result.matchDuration,
			weather: result.weather
				? {
						temperature: result.weather.temperature,
						condition: result.weather.condition,
					}
				: undefined,
			createdBy: result.createdBy.toString(),
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
		} as MatchResult;
	}

	@Query(() => MatchResult, { name: 'matchResult' })
	async findOne(@Args('matchId', { type: () => ID }) matchId: string) {
		const result = await this.matchResultService.findOne(matchId);
		return this.convertToGraphQLMatchResult(result);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MatchResult)
	async createMatchResult(
		@CurrentUser() user: JwtPayload,
		@Args('input') input: CreateMatchResultInput,
	) {
		const result = await this.matchResultService.createMatchResult(user.sub, input);
		return this.convertToGraphQLMatchResult(result);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MatchResult)
	async confirmMatchResult(
		@CurrentUser() user: JwtPayload,
		@Args('matchId', { type: () => ID }) matchId: string,
	) {
		const result = await this.matchResultService.confirmResult(matchId, user.sub);
		return this.convertToGraphQLMatchResult(result);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MatchResult)
	async disputeMatchResult(
		@CurrentUser() user: JwtPayload,
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('reason') reason: string,
	) {
		const result = await this.matchResultService.disputeResult(matchId, user.sub, reason);
		return this.convertToGraphQLMatchResult(result);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MatchResult)
	async updateMatchResult(
		@CurrentUser() user: JwtPayload,
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('input') input: CreateMatchResultInput,
	) {
		const result = await this.matchResultService.updateResult(matchId, user.sub, input);
		return this.convertToGraphQLMatchResult(result);
	}
}

