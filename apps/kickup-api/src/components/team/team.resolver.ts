import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import { Team, CreateTeamInput, UpdateTeamInput, JoinTeamResult } from '../../schemas/Team.graphql';
import { TeamRole, TeamStatus } from '../../schemas/Team.model';
import { Team as TeamModel } from '../../schemas/Team.model';

@Resolver(() => Team)
export class TeamResolver {
	constructor(private readonly teamService: TeamService) { }

	private convertToGraphQLTeam(team: TeamModel): Team {
		const ownerId = team.ownerId != null ? String(team.ownerId) : '';
		const members = (team.members || []).map((m) => {
			const member = m.memberId as any;
			const memberId = member?._id ? member._id.toString() : (m.memberId != null ? String(m.memberId) : '');
			return {
				memberId,
				memberNick: member?.memberNick ?? '',
				memberFullName: member?.memberFullName ?? '',
				memberImage: member?.memberImage,
				role: m.role as any,
				joinedAt: m.joinedAt,
				position: m.position,
				jerseyNumber: m.jerseyNumber,
			};
		});
		return {
			_id: team._id.toString(),
			teamName: team.teamName,
			teamDescription: team.teamDescription,
			teamLogo: team.teamLogo,
			teamBanner: team.teamBanner,
			ownerId,
			captainId: team.captainId?.toString(),
			members,
			maxMembers: team.maxMembers,
			teamStatus: team.teamStatus as any,
			location: team.location
				? {
					city: team.location.city,
					district: team.location.district,
					coordinates: team.location.coordinates
						? {
							lat: team.location.coordinates.lat,
							lng: team.location.coordinates.lng,
						}
						: undefined,
				}
				: undefined,
			statistics: {
				totalMatches: team.statistics?.totalMatches || 0,
				wins: team.statistics?.wins || 0,
				draws: team.statistics?.draws || 0,
				losses: team.statistics?.losses || 0,
				goalsFor: team.statistics?.goalsFor || 0,
				goalsAgainst: team.statistics?.goalsAgainst || 0,
			},
			teamColor: team.teamColor,
			teamColorSecondary: team.teamColorSecondary,
			contactInfo: team.contactInfo
				? {
					phone: team.contactInfo.phone,
					email: team.contactInfo.email,
					socialMedia: team.contactInfo.socialMedia
						? {
							instagram: team.contactInfo.socialMedia.instagram,
							facebook: team.contactInfo.socialMedia.facebook,
							website: team.contactInfo.socialMedia.website,
						}
						: undefined,
				}
				: undefined,
			views: team.views || 0,
			followers: team.followers || 0,
			rating: {
				average: team.rating?.average || 0,
				count: team.rating?.count || 0,
			},
			createdAt: team.createdAt,
			updatedAt: team.updatedAt,
		} as Team;
	}

	@Query(() => [Team], { name: 'teams' })
	async findAll(
		@Args('city', { nullable: true }) city?: string,
		@Args('status', { nullable: true, type: () => TeamStatus }) status?: TeamStatus,
		@Args('limit', { nullable: true, defaultValue: 50, type: () => Int }) limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0, type: () => Int }) skip?: number,
	) {
		const teams = await this.teamService.findAll({ city, status, limit, skip });
		return teams.map((t) => this.convertToGraphQLTeam(t));
	}

	@Query(() => Team, { name: 'team' })
	async findOne(@Args('id', { type: () => ID }) id: string) {
		const team = await this.teamService.findOne(id);
		return this.convertToGraphQLTeam(team);
	}

	@UseGuards(AuthGuard)
	@Query(() => [Team], { name: 'myTeams' })
	async getMyTeams(@CurrentUser() user: JwtPayload) {
		const teams = await this.teamService.getMyTeams(user.sub);
		return teams.map((t) => this.convertToGraphQLTeam(t));
	}

	@Query(() => [Team], { name: 'searchTeams' })
	async searchTeams(
		@Args('searchTerm') searchTerm: string,
		@Args('limit', { nullable: true, defaultValue: 20, type: () => Int }) limit?: number,
	) {
		const teams = await this.teamService.searchTeams(searchTerm, limit);
		return teams.map((t) => this.convertToGraphQLTeam(t));
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Team)
	async createTeam(
		@CurrentUser() user: JwtPayload,
		@Args('input') input: CreateTeamInput,
	) {
		console.log('=== CREATE TEAM RESOLVER STARTED ===');
		console.log('User:', user.sub);
		console.log('Input:', input);
		const team = await this.teamService.createTeam(user.sub, input);
		console.log('Team created in service, converting to GraphQL type...');
		return this.convertToGraphQLTeam(team);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Team)
	async updateTeam(
		@CurrentUser() user: JwtPayload,
		@Args('teamId', { type: () => ID }) teamId: string,
		@Args('input') input: UpdateTeamInput,
	) {
		const team = await this.teamService.updateTeam(teamId, user.sub, input);
		return this.convertToGraphQLTeam(team);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Team)
	async addTeamMember(
		@CurrentUser() user: JwtPayload,
		@Args('teamId', { type: () => ID }) teamId: string,
		@Args('memberId', { type: () => ID }) memberId: string,
		@Args('position', { nullable: true }) position?: string,
		@Args('jerseyNumber', { nullable: true, type: () => Int }) jerseyNumber?: number,
	) {
		const team = await this.teamService.addMember(teamId, memberId, user.sub, position, jerseyNumber);
		return this.convertToGraphQLTeam(team);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Team)
	async removeTeamMember(
		@CurrentUser() user: JwtPayload,
		@Args('teamId', { type: () => ID }) teamId: string,
		@Args('memberId', { type: () => ID }) memberId: string,
	) {
		const team = await this.teamService.removeMember(teamId, memberId, user.sub);
		return this.convertToGraphQLTeam(team);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Team)
	async updateMemberRole(
		@CurrentUser() user: JwtPayload,
		@Args('teamId', { type: () => ID }) teamId: string,
		@Args('memberId', { type: () => ID }) memberId: string,
		@Args('role', { type: () => TeamRole }) role: TeamRole,
	) {
		const team = await this.teamService.updateMemberRole(teamId, memberId, role, user.sub);
		return this.convertToGraphQLTeam(team);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async deleteTeam(
		@CurrentUser() user: JwtPayload,
		@Args('teamId', { type: () => ID }) teamId: string,
	) {
		return this.teamService.deleteTeam(teamId, user.sub);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Team)
	async followTeam(
		@CurrentUser() user: JwtPayload,
		@Args('teamId', { type: () => ID }) teamId: string,
	) {
		const team = await this.teamService.followTeam(teamId, user.sub);
		return this.convertToGraphQLTeam(team);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => JoinTeamResult)
	async joinTeam(
		@CurrentUser() user: JwtPayload,
		@Args('teamId', { type: () => ID }) teamId: string,
	) {
		return this.teamService.joinTeam(teamId, user.sub);
	}
}

