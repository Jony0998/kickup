import {
	Injectable,
	NotFoundException,
	ConflictException,
	BadRequestException,
	ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Team, TeamMember, TeamRole, TeamStatus } from '../../schemas/Team.model';
import { Member } from '../../schemas/Member.model';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class TeamService {
	constructor(
		@InjectModel('Team') private readonly teamModel: Model<Team>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) { }

	async createTeam(ownerId: string, createTeamDto: any): Promise<Team> {
		console.log('=== CREATE TEAM STARTED ===');
		console.log('Owner ID:', ownerId);
		console.log('Create Team DTO:', createTeamDto);

		// Check if team name already exists
		const existingTeam = await this.teamModel.findOne({
			teamName: createTeamDto.teamName,
			deletedAt: null,
		});

		if (existingTeam) {
			console.log('Team name already exists:', createTeamDto.teamName);
			throw new ConflictException('Team name already exists');
		}

		// Create team with owner as first member
		const team = new this.teamModel({
			...createTeamDto,
			ownerId,
			captainId: ownerId,
			members: [
				{
					memberId: ownerId,
					role: TeamRole.OWNER,
					joinedAt: new Date(),
				},
			],
			location: createTeamDto.city
				? {
					city: createTeamDto.city,
					district: createTeamDto.district,
					coordinates:
						createTeamDto.lat && createTeamDto.lng
							? {
								lat: createTeamDto.lat,
								lng: createTeamDto.lng,
							}
							: undefined,
				}
				: undefined,
		});

		console.log('Attempting to save team to DB...');
		const savedTeam = await team.save();
		console.log('Team saved successfully:', savedTeam._id);
		return savedTeam;
	}

	async findAll(filters?: {
		city?: string;
		status?: TeamStatus;
		limit?: number;
		skip?: number;
	}): Promise<Team[]> {
		const query: any = { deletedAt: null };

		if (filters?.city) {
			query['location.city'] = filters.city;
		}

		if (filters?.status) {
			query.teamStatus = filters.status;
		}

		return this.teamModel
			.find(query)
			.populate('ownerId', 'memberNick memberFullName memberImage')
			.populate('captainId', 'memberNick memberFullName memberImage')
			.populate('members.memberId', 'memberNick memberFullName memberImage')
			.sort({ createdAt: -1 })
			.limit(filters?.limit || 50)
			.skip(filters?.skip || 0)
			.exec();
	}

	async findOne(teamId: string): Promise<Team> {
		if (!isValidObjectId(teamId)) {
			console.log('TeamService: Invalid ObjectId requested:', teamId);
			throw new NotFoundException('Team not found');
		}

		const team = await this.teamModel
			.findOne({ _id: teamId, deletedAt: null })
			.populate('ownerId', 'memberNick memberFullName memberImage')
			.populate('captainId', 'memberNick memberFullName memberImage')
			.populate('members.memberId', 'memberNick memberFullName memberImage')
			.exec();

		if (!team) {
			throw new NotFoundException('Team not found');
		}

		// Increment views
		team.views += 1;
		await team.save();

		return team;
	}

	async updateTeam(teamId: string, ownerId: string, updateData: any): Promise<Team> {
		const team = await this.teamModel.findById(teamId);

		if (!team || team.deletedAt) {
			throw new NotFoundException('Team not found');
		}

		// Only owner can update team
		if (team.ownerId.toString() !== ownerId) {
			throw new ForbiddenException('Only team owner can update team');
		}

		// Update location if provided
		if (updateData.city || updateData.lat || updateData.lng) {
			updateData.location = {
				city: updateData.city || team.location?.city,
				district: updateData.district || team.location?.district,
				coordinates:
					updateData.lat && updateData.lng
						? {
							lat: updateData.lat,
							lng: updateData.lng,
						}
						: team.location?.coordinates,
			};
		}

		Object.assign(team, updateData);
		return team.save();
	}

	async addMember(teamId: string, memberId: string, requesterId: string, position?: string, jerseyNumber?: number): Promise<Team> {
		const team = await this.teamModel.findById(teamId);

		if (!team || team.deletedAt) {
			throw new NotFoundException('Team not found');
		}

		// Check if member already in team
		const existingMember = team.members.find(
			(m) => m.memberId.toString() === memberId,
		);

		if (existingMember) {
			throw new ConflictException('Member already in team');
		}

		// Check if team is full
		if (team.members.length >= team.maxMembers) {
			throw new BadRequestException('Team is full');
		}

		// Permission Check
		if (memberId !== requesterId) {
			// Adding someone else: Requester must be Owner or Captain
			const requester = team.members.find(
				(m) => m.memberId.toString() === requesterId,
			);
			const isOwnerOrCaptain =
				team.ownerId.toString() === requesterId ||
				requester?.role === TeamRole.CAPTAIN;

			if (!isOwnerOrCaptain) {
				throw new ForbiddenException('Only owner/captain can add other members');
			}
		}

		// Add member
		team.members.push({
			memberId: memberId as any,
			role: TeamRole.MEMBER,
			joinedAt: new Date(),
			position,
			jerseyNumber,
		});

		return team.save();
	}

	/** Current user joins a team by team id (self-add). */
	async joinTeam(teamId: string, userId: string): Promise<{ success: boolean; message?: string }> {
		try {
			await this.addMember(teamId, userId, userId);
			return { success: true, message: 'Joined team successfully' };
		} catch (e: any) {
			if (e instanceof ConflictException) return { success: false, message: 'You are already in this team' };
			if (e instanceof BadRequestException) return { success: false, message: e.message || 'Team is full' };
			if (e instanceof ForbiddenException || e instanceof NotFoundException) return { success: false, message: e.message };
			throw e;
		}
	}

	async removeMember(teamId: string, memberId: string, requesterId: string): Promise<Team> {
		const team = await this.teamModel.findById(teamId);

		if (!team || team.deletedAt) {
			throw new NotFoundException('Team not found');
		}

		// Check if requester is owner or captain
		const requester = team.members.find(
			(m) => m.memberId.toString() === requesterId,
		);
		const isOwnerOrCaptain =
			team.ownerId.toString() === requesterId ||
			requester?.role === TeamRole.CAPTAIN;

		// Owner cannot be removed
		if (memberId === team.ownerId.toString()) {
			throw new BadRequestException('Cannot remove team owner');
		}

		// Only owner/captain can remove members, or member can leave themselves
		if (memberId !== requesterId && !isOwnerOrCaptain) {
			throw new ForbiddenException('Only owner/captain can remove members');
		}

		// Remove member
		team.members = team.members.filter(
			(m) => m.memberId.toString() !== memberId,
		);

		// If removed member was captain, clear captain
		if (team.captainId?.toString() === memberId) {
			team.captainId = undefined;
		}

		return team.save();
	}

	async updateMemberRole(
		teamId: string,
		memberId: string,
		role: TeamRole,
		ownerId: string,
	): Promise<Team> {
		const team = await this.teamModel.findById(teamId);

		if (!team || team.deletedAt) {
			throw new NotFoundException('Team not found');
		}

		// Only owner can update roles
		if (team.ownerId.toString() !== ownerId) {
			throw new ForbiddenException('Only team owner can update member roles');
		}

		// Cannot change owner role
		if (memberId === team.ownerId.toString() && role !== TeamRole.OWNER) {
			throw new BadRequestException('Cannot change owner role');
		}

		const member = team.members.find((m) => m.memberId.toString() === memberId);
		if (!member) {
			throw new NotFoundException('Member not found in team');
		}

		member.role = role;

		// If setting as captain, update captainId
		if (role === TeamRole.CAPTAIN) {
			team.captainId = memberId as any;
		} else {
			// If member was captain and role changed, clear captain
			if (team.captainId?.toString() === memberId) {
				team.captainId = undefined;
			}
		}

		return team.save();
	}

	async deleteTeam(teamId: string, ownerId: string): Promise<boolean> {
		const team = await this.teamModel.findById(teamId);

		if (!team || team.deletedAt) {
			throw new NotFoundException('Team not found');
		}

		// Only owner can delete team
		if (team.ownerId.toString() !== ownerId) {
			throw new ForbiddenException('Only team owner can delete team');
		}

		team.deletedAt = new Date();
		team.teamStatus = TeamStatus.DISBANDED;
		await team.save();

		return true;
	}

	async getMyTeams(memberId: string): Promise<Team[]> {
		return this.teamModel
			.find({
				'members.memberId': memberId,
				deletedAt: null,
			})
			.populate('ownerId', 'memberNick memberFullName memberImage')
			.populate('captainId', 'memberNick memberFullName memberImage')
			.sort({ createdAt: -1 })
			.exec();
	}

	async searchTeams(searchTerm: string, limit = 20): Promise<Team[]> {
		return this.teamModel
			.find({
				$or: [
					{ teamName: { $regex: searchTerm, $options: 'i' } },
					{ teamDescription: { $regex: searchTerm, $options: 'i' } },
				],
				deletedAt: null,
				teamStatus: TeamStatus.ACTIVE,
			})
			.populate('ownerId', 'memberNick memberFullName memberImage')
			.sort({ views: -1 })
			.limit(limit)
			.exec();
	}

	async followTeam(teamId: string, memberId: string): Promise<Team> {
		const team = await this.teamModel.findById(teamId);

		if (!team || team.deletedAt) {
			throw new NotFoundException('Team not found');
		}

		// Check if already following (you can implement a separate Follow model for this)
		// For now, we'll just increment followers
		team.followers += 1;
		return team.save();
	}
}

