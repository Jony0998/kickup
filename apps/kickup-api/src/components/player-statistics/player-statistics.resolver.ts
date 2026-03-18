import { Resolver, Query, Args, ID, Int } from '@nestjs/graphql';
import { PlayerStatisticsService } from './player-statistics.service';
import { PlayerStatistics } from '../../schemas/PlayerStatistics.graphql';
import { PlayerStatistics as PlayerStatisticsModel } from '../../schemas/PlayerStatistics.model';

@Resolver(() => PlayerStatistics)
export class PlayerStatisticsResolver {
	constructor(private readonly playerStatsService: PlayerStatisticsService) {}

	private convertToGraphQLPlayerStats(stats: PlayerStatisticsModel): PlayerStatistics {
		return {
			_id: stats._id.toString(),
			memberId: stats.memberId.toString(),
			totalMatches: stats.totalMatches,
			matchesWon: stats.matchesWon,
			matchesDrawn: stats.matchesDrawn,
			matchesLost: stats.matchesLost,
			totalGoals: stats.totalGoals,
			totalAssists: stats.totalAssists,
			totalOwnGoals: stats.totalOwnGoals,
			totalPenalties: stats.totalPenalties,
			matchesAsGK: stats.matchesAsGK,
			matchesAsDF: stats.matchesAsDF,
			matchesAsMF: stats.matchesAsMF,
			matchesAsFW: stats.matchesAsFW,
			teamsJoined: stats.teamsJoined,
			currentTeams: stats.currentTeams,
			averageRating: stats.averageRating,
			totalRatings: stats.totalRatings,
			recentGoals: stats.recentGoals,
			recentAssists: stats.recentAssists,
			recentWins: stats.recentWins,
			bestGoalsInMatch: stats.bestGoalsInMatch,
			bestAssistsInMatch: stats.bestAssistsInMatch,
			lastMatchDate: stats.lastMatchDate,
			lastGoalDate: stats.lastGoalDate,
			streakMatches: stats.streakMatches,
			manOfTheMatch: stats.manOfTheMatch,
			cleanSheets: stats.cleanSheets,
			createdAt: stats.createdAt,
			updatedAt: stats.updatedAt,
		} as PlayerStatistics;
	}

	@Query(() => PlayerStatistics, { name: 'playerStatistics' })
	async getPlayerStatistics(@Args('memberId', { type: () => ID }) memberId: string) {
		const stats = await this.playerStatsService.getPlayerStatistics(memberId);
		return this.convertToGraphQLPlayerStats(stats);
	}

	@Query(() => [PlayerStatistics], { name: 'topScorers' })
	async getTopScorers(
		@Args('limit', { nullable: true, defaultValue: 10, type: () => Int }) limit?: number,
	) {
		const stats = await this.playerStatsService.getTopScorers(limit);
		return stats.map((s) => this.convertToGraphQLPlayerStats(s));
	}

	@Query(() => [PlayerStatistics], { name: 'topAssists' })
	async getTopAssists(
		@Args('limit', { nullable: true, defaultValue: 10, type: () => Int }) limit?: number,
	) {
		const stats = await this.playerStatsService.getTopAssists(limit);
		return stats.map((s) => this.convertToGraphQLPlayerStats(s));
	}

	@Query(() => [PlayerStatistics], { name: 'topRated' })
	async getTopRated(
		@Args('limit', { nullable: true, defaultValue: 10, type: () => Int }) limit?: number,
	) {
		const stats = await this.playerStatsService.getTopRated(limit);
		return stats.map((s) => this.convertToGraphQLPlayerStats(s));
	}

	@Query(() => [PlayerStatistics], { name: 'mostMatches' })
	async getMostMatches(
		@Args('limit', { nullable: true, defaultValue: 10, type: () => Int }) limit?: number,
	) {
		const stats = await this.playerStatsService.getMostMatches(limit);
		return stats.map((s) => this.convertToGraphQLPlayerStats(s));
	}
}

