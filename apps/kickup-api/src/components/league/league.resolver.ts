import { Resolver, Query, Mutation, Args, ID, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LeagueService } from './league.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import { League, CreateLeagueInput, UpdateLeagueInput, LeagueMatch, LeagueTeam } from '../../schemas/League.graphql';
import { Match } from '../../schemas/Match.graphql';
import { Team } from '../../schemas/Team.graphql';
import { LeagueStatus, LeagueType } from '../../schemas/League.model';
import { League as LeagueModel } from '../../schemas/League.model';
import { Match as MatchModel } from '../../schemas/Match.model';
import { Team as TeamModel } from '../../schemas/Team.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Resolver(() => LeagueMatch)
export class LeagueMatchResolver {
	constructor(
		@InjectModel('Match') private readonly matchModel: Model<MatchModel>,
		@InjectModel('Team') private readonly teamModel: Model<TeamModel>,
	) { }

	@ResolveField(() => Match, { nullable: true })
	async match(@Parent() leagueMatch: LeagueMatch) {
		if (!leagueMatch.matchId) return null;
		return this.matchModel.findById(leagueMatch.matchId).exec();
	}

	@ResolveField(() => Team, { nullable: true })
	async homeTeam(@Parent() leagueMatch: LeagueMatch) {
		if (!leagueMatch.homeTeamId) return null;
		return this.teamModel.findById(leagueMatch.homeTeamId).exec();
	}

	@ResolveField(() => Team, { nullable: true })
	async awayTeam(@Parent() leagueMatch: LeagueMatch) {
		if (!leagueMatch.awayTeamId) return null;
		return this.teamModel.findById(leagueMatch.awayTeamId).exec();
	}
}

@Resolver(() => LeagueTeam)
export class LeagueTeamResolver {
	constructor(@InjectModel('Team') private readonly teamModel: Model<TeamModel>) { }

	@ResolveField(() => Team, { nullable: true })
	async team(@Parent() leagueTeam: LeagueTeam) {
		if (!leagueTeam.teamId) return null;
		return this.teamModel.findById(leagueTeam.teamId).exec();
	}
}

@Resolver(() => League)
export class LeagueResolver {
	constructor(private readonly leagueService: LeagueService) { }

	private convertToGraphQLLeague(league: LeagueModel): League {
		return {
			_id: league._id.toString(),
			leagueName: league.leagueName,
			leagueDescription: league.leagueDescription,
			leagueLogo: league.leagueLogo,
			leagueBanner: league.leagueBanner,
			organizerId: league.organizerId.toString(),
			leagueType: league.leagueType as any,
			leagueStatus: league.leagueStatus as any,
			teams: league.teams.map((t) => ({
				teamId: t.teamId.toString(),
				points: t.points,
				wins: t.wins,
				draws: t.draws,
				losses: t.losses,
				goalsFor: t.goalsFor,
				goalsAgainst: t.goalsAgainst,
				goalDifference: t.goalDifference,
				matchesPlayed: t.matchesPlayed,
				joinedAt: t.joinedAt,
			})),
			matches: league.matches.map((m) => ({
				matchId: m.matchId.toString(),
				homeTeamId: m.homeTeamId?.toString(),
				awayTeamId: m.awayTeamId?.toString(),
				round: m.round,
				status: m.status,
			})),
			maxTeams: league.maxTeams,
			minTeams: league.minTeams,
			startDate: league.startDate,
			endDate: league.endDate,
			registrationDeadline: league.registrationDeadline,
			location: league.location
				? {
					city: league.location.city,
					district: league.location.district,
					coordinates: league.location.coordinates
						? {
							lat: league.location.coordinates.lat,
							lng: league.location.coordinates.lng,
						}
						: undefined,
				}
				: undefined,
			entryFee: league.entryFee,
			prizePool: league.prizePool,
			rules: league.rules,
			contactInfo: league.contactInfo
				? {
					phone: league.contactInfo.phone,
					email: league.contactInfo.email,
				}
				: undefined,
			views: league.views,
			followers: league.followers,
			createdAt: league.createdAt,
			updatedAt: league.updatedAt,
		} as League;
	}

	@Query(() => [League], { name: 'leagues' })
	async findAll(
		@Args('status', { nullable: true, type: () => LeagueStatus }) status?: LeagueStatus,
		@Args('city', { nullable: true }) city?: string,
		@Args('limit', { nullable: true, defaultValue: 50, type: () => Int }) limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0, type: () => Int }) skip?: number,
	) {
		const leagues = await this.leagueService.findAll({ status, city, limit, skip });
		return leagues.map((l) => this.convertToGraphQLLeague(l));
	}

	@Query(() => League, { name: 'league' })
	async findOne(@Args('id', { type: () => ID }) id: string) {
		const league = await this.leagueService.findOne(id);
		return this.convertToGraphQLLeague(league);
	}

	@UseGuards(AuthGuard)
	@Query(() => [League], { name: 'myLeagues' })
	async getMyLeagues(@CurrentUser() user: JwtPayload) {
		const leagues = await this.leagueService.getMyLeagues(user.sub);
		return leagues.map((l) => this.convertToGraphQLLeague(l));
	}

	@Query(() => [League], { name: 'searchLeagues' })
	async searchLeagues(
		@Args('searchTerm') searchTerm: string,
		@Args('limit', { nullable: true, defaultValue: 20, type: () => Int }) limit?: number,
	) {
		const leagues = await this.leagueService.searchLeagues(searchTerm, limit);
		return leagues.map((l) => this.convertToGraphQLLeague(l));
	}

	@UseGuards(AuthGuard)
	@Mutation(() => League)
	async createLeague(
		@CurrentUser() user: JwtPayload,
		@Args('input') input: CreateLeagueInput,
	) {
		const league = await this.leagueService.createLeague(user.sub, input);
		return this.convertToGraphQLLeague(league);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => League)
	async updateLeague(
		@CurrentUser() user: JwtPayload,
		@Args('leagueId', { type: () => ID }) leagueId: string,
		@Args('input') input: UpdateLeagueInput,
	) {
		const league = await this.leagueService.updateLeague(leagueId, user.sub, input);
		return this.convertToGraphQLLeague(league);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => League)
	async registerTeamInLeague(
		@CurrentUser() user: JwtPayload,
		@Args('leagueId', { type: () => ID }) leagueId: string,
		@Args('teamId', { type: () => ID }) teamId: string,
	) {
		const league = await this.leagueService.registerTeam(leagueId, teamId);
		return this.convertToGraphQLLeague(league);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => League)
	async unregisterTeamFromLeague(
		@CurrentUser() user: JwtPayload,
		@Args('leagueId', { type: () => ID }) leagueId: string,
		@Args('teamId', { type: () => ID }) teamId: string,
	) {
		const league = await this.leagueService.unregisterTeam(leagueId, teamId, user.sub);
		return this.convertToGraphQLLeague(league);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => League)
	async updateLeagueStandings(
		@CurrentUser() user: JwtPayload,
		@Args('leagueId', { type: () => ID }) leagueId: string,
	) {
		const league = await this.leagueService.updateLeagueStandings(leagueId, user.sub);
		return this.convertToGraphQLLeague(league);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => League)
	async addMatchToLeague(
		@CurrentUser() user: JwtPayload,
		@Args('leagueId', { type: () => ID }) leagueId: string,
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('homeTeamId', { type: () => ID }) homeTeamId: string,
		@Args('awayTeamId', { type: () => ID }) awayTeamId: string,
		@Args('round', { nullable: true, type: () => Int }) round?: number,
	) {
		const league = await this.leagueService.addMatchToLeague(
			leagueId,
			matchId,
			homeTeamId,
			awayTeamId,
			round,
			user.sub,
		);
		return this.convertToGraphQLLeague(league);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async deleteLeague(
		@CurrentUser() user: JwtPayload,
		@Args('leagueId', { type: () => ID }) leagueId: string,
	) {
		return this.leagueService.deleteLeague(leagueId, user.sub);
	}
}

