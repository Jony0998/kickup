import {
	Injectable,
	NotFoundException,
	ConflictException,
	BadRequestException,
	ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
	MatchInvitation,
	InvitationStatus,
} from '../../schemas/MatchInvitation.model';
import { Match } from '../../schemas/Match.model';
import { Member } from '../../schemas/Member.model';
import { Team } from '../../schemas/Team.model';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MatchInvitationService {
	constructor(
		@InjectModel('MatchInvitation')
		private readonly invitationModel: Model<MatchInvitation>,
		@InjectModel('Match') private readonly matchModel: Model<Match>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Team') private readonly teamModel: Model<Team>,
		private readonly notificationService: NotificationService,
	) {}

	async sendInvitation(
		inviterId: string,
		matchId: string,
		inviteeId: string,
		inviteeType: 'MEMBER' | 'TEAM',
		message?: string,
	): Promise<MatchInvitation> {
		// Check if match exists
		const match = await this.matchModel.findById(matchId);
		if (!match || match.deletedAt) {
			throw new NotFoundException('Match not found');
		}

		// Only organizer can send invitations
		if (match.organizerId.toString() !== inviterId) {
			throw new ForbiddenException('Only match organizer can send invitations');
		}

		// Check if invitee exists
		if (inviteeType === 'MEMBER') {
			const member = await this.memberModel.findById(inviteeId);
			if (!member || member.deletedAt) {
				throw new NotFoundException('Member not found');
			}
		} else {
			const team = await this.teamModel.findById(inviteeId);
			if (!team || team.deletedAt) {
				throw new NotFoundException('Team not found');
			}
		}

		// Check if invitation already exists
		const existingInvitation = await this.invitationModel.findOne({
			matchId,
			inviteeId,
			status: InvitationStatus.PENDING,
			deletedAt: null,
		});

		if (existingInvitation) {
			throw new ConflictException('Invitation already sent');
		}

		// Create invitation
		const invitation = new this.invitationModel({
			matchId,
			inviterId,
			inviteeId,
			inviteeType,
			message,
			status: InvitationStatus.PENDING,
		});

		const savedInvitation = await invitation.save();

		// Send notification
		try {
			await this.notificationService.notifyMatchInvitation(
				inviteeId,
				matchId,
				inviterId,
			);
		} catch (error) {
			// Log error but don't fail invitation creation
			console.error('Failed to send notification:', error);
		}

		return savedInvitation;
	}

	async respondToInvitation(
		invitationId: string,
		inviteeId: string,
		status: 'ACCEPTED' | 'REJECTED',
	): Promise<MatchInvitation> {
		const invitation = await this.invitationModel.findById(invitationId);

		if (!invitation || invitation.deletedAt) {
			throw new NotFoundException('Invitation not found');
		}

		// Check if invitee is correct
		if (invitation.inviteeId.toString() !== inviteeId) {
			throw new ForbiddenException('You are not authorized to respond to this invitation');
		}

		// Check if already responded
		if (invitation.status !== InvitationStatus.PENDING) {
			throw new BadRequestException('Invitation already responded');
		}

		// Update status
		invitation.status =
			status === 'ACCEPTED' ? InvitationStatus.ACCEPTED : InvitationStatus.REJECTED;
		invitation.respondedAt = new Date();

		// If accepted, add to match
		if (status === 'ACCEPTED') {
			const match = await this.matchModel.findById(invitation.matchId);
			if (match) {
				if (invitation.inviteeType === 'MEMBER') {
					// Add member to match
					if (!match.joinedPlayers.includes(invitation.inviteeId)) {
						match.joinedPlayers.push(invitation.inviteeId);
						match.currentPlayers += 1;
						await match.save();
					}
				} else {
					// Add team members to match
					const team = await this.teamModel.findById(invitation.inviteeId);
					if (team) {
						team.members.forEach((member) => {
							if (!match.joinedPlayers.includes(member.memberId)) {
								match.joinedPlayers.push(member.memberId);
							}
						});
						match.currentPlayers = match.joinedPlayers.length;
						await match.save();
					}
				}
			}
		}

		return invitation.save();
	}

	async cancelInvitation(invitationId: string, inviterId: string): Promise<MatchInvitation> {
		const invitation = await this.invitationModel.findById(invitationId);

		if (!invitation || invitation.deletedAt) {
			throw new NotFoundException('Invitation not found');
		}

		// Only inviter can cancel
		if (invitation.inviterId.toString() !== inviterId) {
			throw new ForbiddenException('Only inviter can cancel invitation');
		}

		if (invitation.status !== InvitationStatus.PENDING) {
			throw new BadRequestException('Can only cancel pending invitations');
		}

		invitation.status = InvitationStatus.CANCELLED;
		return invitation.save();
	}

	async getMyInvitations(inviteeId: string, status?: InvitationStatus): Promise<MatchInvitation[]> {
		const query: any = { inviteeId, deletedAt: null };

		if (status) {
			query.status = status;
		}

		return this.invitationModel
			.find(query)
			.populate('matchId', 'matchTitle matchDate matchTime location')
			.populate('inviterId', 'memberNick memberFullName memberImage')
			.sort({ createdAt: -1 })
			.exec();
	}

	async getMatchInvitations(matchId: string): Promise<MatchInvitation[]> {
		return this.invitationModel
			.find({ matchId, deletedAt: null })
			.populate('inviteeId')
			.populate('inviterId', 'memberNick memberFullName memberImage')
			.sort({ createdAt: -1 })
			.exec();
	}

	async deleteInvitation(invitationId: string, userId: string): Promise<boolean> {
		const invitation = await this.invitationModel.findById(invitationId);

		if (!invitation || invitation.deletedAt) {
			throw new NotFoundException('Invitation not found');
		}

		// Only inviter or invitee can delete
		if (
			invitation.inviterId.toString() !== userId &&
			invitation.inviteeId.toString() !== userId
		) {
			throw new ForbiddenException('Not authorized to delete this invitation');
		}

		invitation.deletedAt = new Date();
		await invitation.save();
		return true;
	}
}

