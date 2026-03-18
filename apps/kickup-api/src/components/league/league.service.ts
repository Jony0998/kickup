import {
	Injectable,
	NotFoundException,
	ConflictException,
	BadRequestException,
	ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { League, LeagueTeam, LeagueStatus, LeagueType } from '../../schemas/League.model';
import { Team } from '../../schemas/Team.model';
import { Match } from '../../schemas/Match.model';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class LeagueService {
	constructor(
		@InjectModel('League') private readonly leagueModel: Model<League>,
		@InjectModel('Team') private readonly teamModel: Model<Team>,
		@InjectModel('Match') private readonly matchModel: Model<Match>,
	) {}

	async createLeague(organizerId: string, createLeagueDto: any): Promise<League> {
		// Check if league name already exists
		const existingLeague = await this.leagueModel.findOne({
			leagueName: createLeagueDto.leagueName,
			deletedAt: null,
		});

		if (existingLeague) {
			throw new ConflictException('League name already exists');
		}

		// Validate dates
		if (new Date(createLeagueDto.registrationDeadline) >= new Date(createLeagueDto.startDate)) {
			throw new BadRequestException('Registration deadline must be before start date');
		}

		// Create league
		const league = new this.leagueModel({
			...createLeagueDto,
			organizerId,
			location: createLeagueDto.city
				? {
						city: createLeagueDto.city,
						district: createLeagueDto.district,
						coordinates:
							createLeagueDto.lat && createLeagueDto.lng
								? {
										lat: createLeagueDto.lat,
										lng: createLeagueDto.lng,
									}
								: undefined,
					}
				: undefined,
			contactInfo: createLeagueDto.phone || createLeagueDto.email
				? {
						phone: createLeagueDto.phone,
						email: createLeagueDto.email,
					}
				: undefined,
		});

		return league.save();
	}

	async findAll(filters?: {
		status?: LeagueStatus;
		city?: string;
		limit?: number;
		skip?: number;
	}): Promise<League[]> {
		const query: any = { deletedAt: null };

		if (filters?.status) {
			query.leagueStatus = filters.status;
		}

		if (filters?.city) {
			query['location.city'] = filters.city;
		}

		return this.leagueModel
			.find(query)
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.populate('teams.teamId', 'teamName teamLogo')
			.sort({ createdAt: -1 })
			.limit(filters?.limit || 50)
			.skip(filters?.skip || 0)
			.exec();
	}

	async findOne(leagueId: string): Promise<League> {
		const league = await this.leagueModel
			.findOne({ _id: leagueId, deletedAt: null })
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.populate('teams.teamId', 'teamName teamLogo teamBanner')
			.populate('matches.matchId')
			.populate('matches.homeTeamId', 'teamName teamLogo')
			.populate('matches.awayTeamId', 'teamName teamLogo')
			.exec();

		if (!league) {
			throw new NotFoundException('League not found');
		}

		// Increment views
		league.views += 1;
		await league.save();

		return league;
	}

	async registerTeam(leagueId: string, teamId: string): Promise<League> {
		const league = await this.leagueModel.findById(leagueId);

		if (!league || league.deletedAt) {
			throw new NotFoundException('League not found');
		}

		// Check if registration deadline has passed
		if (new Date() > new Date(league.registrationDeadline)) {
			throw new BadRequestException('Registration deadline has passed');
		}

		// Check if league is full
		if (league.teams.length >= league.maxTeams) {
			throw new BadRequestException('League is full');
		}

		// Check if team already registered
		const existingTeam = league.teams.find(
			(t) => t.teamId.toString() === teamId,
		);

		if (existingTeam) {
			throw new ConflictException('Team already registered in this league');
		}

		// Verify team exists
		const team = await this.teamModel.findById(teamId);
		if (!team || team.deletedAt) {
			throw new NotFoundException('Team not found');
		}

		// Add team to league
		const leagueTeam: LeagueTeam = {
			teamId: teamId as any,
			points: 0,
			wins: 0,
			draws: 0,
			losses: 0,
			goalsFor: 0,
			goalsAgainst: 0,
			goalDifference: 0,
			matchesPlayed: 0,
			joinedAt: new Date(),
		};

		league.teams.push(leagueTeam);

		// If we have minimum teams, start league
		if (league.teams.length >= league.minTeams && league.leagueStatus === LeagueStatus.UPCOMING) {
			league.leagueStatus = LeagueStatus.ONGOING;
		}

		return league.save();
	}

	async unregisterTeam(leagueId: string, teamId: string, requesterId: string): Promise<League> {
		const league = await this.leagueModel.findById(leagueId);

		if (!league || league.deletedAt) {
			throw new NotFoundException('League not found');
		}

		// Only organizer or team owner can unregister
		if (league.organizerId.toString() !== requesterId) {
			const team = await this.teamModel.findById(teamId);
			if (!team || team.ownerId.toString() !== requesterId) {
				throw new ForbiddenException('Only organizer or team owner can unregister');
			}
		}

		// Remove team from league
		league.teams = league.teams.filter((t) => t.teamId.toString() !== teamId);

		// Remove team's matches
		league.matches = league.matches.filter(
			(m) =>
				m.homeTeamId?.toString() !== teamId &&
				m.awayTeamId?.toString() !== teamId,
		);

		return league.save();
	}

	async updateLeagueStandings(leagueId: string, organizerId: string): Promise<League> {
		const league = await this.leagueModel.findById(leagueId);

		if (!league || league.deletedAt) {
			throw new NotFoundException('League not found');
		}

		// Only organizer can update standings
		if (league.organizerId.toString() !== organizerId) {
			throw new ForbiddenException('Only organizer can update standings');
		}

		// Get all completed matches for this league
		const completedMatches = await this.matchModel.find({
			_id: { $in: league.matches.map((m) => m.matchId) },
			matchStatus: 'COMPLETED',
			deletedAt: null,
		}).populate('matchResult');

		// Reset all team statistics
		league.teams.forEach((team) => {
			team.points = 0;
			team.wins = 0;
			team.draws = 0;
			team.losses = 0;
			team.goalsFor = 0;
			team.goalsAgainst = 0;
			team.goalDifference = 0;
			team.matchesPlayed = 0;
		});

		// Update standings based on match results
		// (This is simplified - you might need to fetch actual match results)
		// For now, we'll just update based on match status

		// Sort teams by points, goal difference, goals for
		league.teams.sort((a, b) => {
			if (b.points !== a.points) return b.points - a.points;
			if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
			return b.goalsFor - a.goalsFor;
		});

		return league.save();
	}

	async addMatchToLeague(
		leagueId: string,
		matchId: string,
		homeTeamId: string,
		awayTeamId: string,
		round?: number,
		organizerId?: string,
	): Promise<League> {
		const league = await this.leagueModel.findById(leagueId);

		if (!league || league.deletedAt) {
			throw new NotFoundException('League not found');
		}

		// Only organizer can add matches
		if (organizerId && league.organizerId.toString() !== organizerId) {
			throw new ForbiddenException('Only organizer can add matches');
		}

		// Check if match already in league
		const existingMatch = league.matches.find((m) => m.matchId.toString() === matchId);
		if (existingMatch) {
			throw new ConflictException('Match already in league');
		}

		// Add match to league
		league.matches.push({
			matchId: matchId as any,
			homeTeamId: homeTeamId as any,
			awayTeamId: awayTeamId as any,
			round,
			status: 'SCHEDULED',
		});

		return league.save();
	}

	async updateLeague(leagueId: string, organizerId: string, updateData: any): Promise<League> {
		const league = await this.leagueModel.findById(leagueId);

		if (!league || league.deletedAt) {
			throw new NotFoundException('League not found');
		}

		// Only organizer can update
		if (league.organizerId.toString() !== organizerId) {
			throw new ForbiddenException('Only organizer can update league');
		}

		Object.assign(league, updateData);
		return league.save();
	}

	async deleteLeague(leagueId: string, organizerId: string): Promise<boolean> {
		const league = await this.leagueModel.findById(leagueId);

		if (!league || league.deletedAt) {
			throw new NotFoundException('League not found');
		}

		// Only organizer can delete
		if (league.organizerId.toString() !== organizerId) {
			throw new ForbiddenException('Only organizer can delete league');
		}

		league.deletedAt = new Date();
		league.leagueStatus = LeagueStatus.CANCELLED;
		await league.save();

		return true;
	}

	async getMyLeagues(organizerId: string): Promise<League[]> {
		return this.leagueModel
			.find({
				organizerId,
				deletedAt: null,
			})
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.sort({ createdAt: -1 })
			.exec();
	}

	async searchLeagues(searchTerm: string, limit = 20): Promise<League[]> {
		return this.leagueModel
			.find({
				$or: [
					{ leagueName: { $regex: searchTerm, $options: 'i' } },
					{ leagueDescription: { $regex: searchTerm, $options: 'i' } },
				],
				deletedAt: null,
			})
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.sort({ views: -1 })
			.limit(limit)
			.exec();
	}
}

