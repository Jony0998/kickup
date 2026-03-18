import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
	Notification,
	NotificationType,
	NotificationStatus,
} from '../../schemas/Notification.model';
import { Match } from '../../schemas/Match.model';
import { Team } from '../../schemas/Team.model';
import { Member } from '../../schemas/Member.model';

@Injectable()
export class NotificationService {
	constructor(
		@InjectModel('Notification')
		private readonly notificationModel: Model<Notification>,
		@InjectModel('Match') private readonly matchModel: Model<Match>,
		@InjectModel('Team') private readonly teamModel: Model<Team>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	async createNotification(createNotificationDto: {
		userId: string;
		notificationType: NotificationType;
		title: string;
		message: string;
		relatedMatchId?: string;
		relatedTeamId?: string;
		relatedLeagueId?: string;
		relatedMemberId?: string;
		actionUrl?: string;
		actionData?: any;
	}): Promise<Notification> {
		const notification = new this.notificationModel(createNotificationDto);
		return notification.save();
	}

	async getUserNotifications(
		userId: string,
		status?: NotificationStatus,
		limit = 50,
		skip = 0,
	): Promise<Notification[]> {
		const query: any = { userId, deletedAt: null };

		if (status) {
			query.status = status;
		}

		return this.notificationModel
			.find(query)
			.populate('relatedMatchId', 'matchTitle matchDate')
			.populate('relatedTeamId', 'teamName teamLogo')
			.populate('relatedMemberId', 'memberNick memberFullName memberImage')
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(skip)
			.exec();
	}

	async getUnreadCount(userId: string): Promise<number> {
		return this.notificationModel.countDocuments({
			userId,
			status: NotificationStatus.UNREAD,
			deletedAt: null,
		});
	}

	async markAsRead(notificationId: string, userId: string): Promise<Notification> {
		const notification = await this.notificationModel.findOne({
			_id: notificationId,
			userId,
			deletedAt: null,
		});

		if (!notification) {
			throw new NotFoundException('Notification not found');
		}

		notification.status = NotificationStatus.READ;
		notification.readAt = new Date();
		return notification.save();
	}

	async markAllAsRead(userId: string): Promise<number> {
		const result = await this.notificationModel.updateMany(
			{
				userId,
				status: NotificationStatus.UNREAD,
				deletedAt: null,
			},
			{
				$set: {
					status: NotificationStatus.READ,
					readAt: new Date(),
				},
			},
		);

		return result.modifiedCount;
	}

	async archiveNotification(notificationId: string, userId: string): Promise<Notification> {
		const notification = await this.notificationModel.findOne({
			_id: notificationId,
			userId,
			deletedAt: null,
		});

		if (!notification) {
			throw new NotFoundException('Notification not found');
		}

		notification.status = NotificationStatus.ARCHIVED;
		notification.archivedAt = new Date();
		return notification.save();
	}

	async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
		const notification = await this.notificationModel.findOne({
			_id: notificationId,
			userId,
			deletedAt: null,
		});

		if (!notification) {
			throw new NotFoundException('Notification not found');
		}

		notification.deletedAt = new Date();
		await notification.save();
		return true;
	}

	// Helper methods to create specific notification types
	async notifyMatchInvitation(
		userId: string,
		matchId: string,
		inviterId: string,
	): Promise<Notification> {
		const match = await this.matchModel.findById(matchId);
		const inviter = await this.memberModel.findById(inviterId);

		if (!match || !inviter) {
			throw new NotFoundException('Match or inviter not found');
		}

		return this.createNotification({
			userId,
			notificationType: NotificationType.MATCH_INVITATION,
			title: 'Match Taklifi',
			message: `${inviter.memberNick} sizni "${match.matchTitle}" matchiga taklif qildi`,
			relatedMatchId: matchId,
			relatedMemberId: inviterId,
			actionUrl: `/matches/${matchId}`,
		});
	}

	async notifyTeamInvitation(
		userId: string,
		teamId: string,
		inviterId: string,
	): Promise<Notification> {
		const team = await this.teamModel.findById(teamId);
		const inviter = await this.memberModel.findById(inviterId);

		if (!team || !inviter) {
			throw new NotFoundException('Team or inviter not found');
		}

		return this.createNotification({
			userId,
			notificationType: NotificationType.TEAM_INVITATION,
			title: 'Team Taklifi',
			message: `${inviter.memberNick} sizni "${team.teamName}" jamoasiga taklif qildi`,
			relatedTeamId: teamId,
			relatedMemberId: inviterId,
			actionUrl: `/teams/${teamId}`,
		});
	}

	async notifyMatchReminder(userId: string, matchId: string): Promise<Notification> {
		const match = await this.matchModel.findById(matchId);

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		return this.createNotification({
			userId,
			notificationType: NotificationType.MATCH_REMINDER,
			title: 'Match Eslatmasi',
			message: `"${match.matchTitle}" matchi ${new Date(match.matchDate).toLocaleDateString()} kuni bo'lishi kerak`,
			relatedMatchId: matchId,
			actionUrl: `/matches/${matchId}`,
		});
	}

	async notifyMatchResult(userId: string, matchId: string, result: any): Promise<Notification> {
		const match = await this.matchModel.findById(matchId);

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		return this.createNotification({
			userId,
			notificationType: NotificationType.MATCH_RESULT,
			title: 'Match Natijasi',
			message: `"${match.matchTitle}" matchi yakunlandi. Natija: ${result.homeScore} - ${result.awayScore}`,
			relatedMatchId: matchId,
			actionUrl: `/matches/${matchId}/result`,
			actionData: result,
		});
	}

	async notifyMatchJoined(userId: string, matchId: string, joinerId: string): Promise<Notification | null> {
		const match = await this.matchModel.findById(matchId);
		const joiner = await this.memberModel.findById(joinerId);

		if (!match || !joiner) {
			throw new NotFoundException('Match or member not found');
		}

		// Notify organizer
		if (match.organizerId.toString() !== joinerId) {
			return await this.createNotification({
				userId: match.organizerId.toString(),
				notificationType: NotificationType.MATCH_JOINED,
				title: 'Yangi O\'yinchi',
				message: `${joiner.memberNick} "${match.matchTitle}" matchiga qo'shildi`,
				relatedMatchId: matchId,
				relatedMemberId: joinerId,
				actionUrl: `/matches/${matchId}`,
			});
		}

		return null;
	}

	async notifyMatchCancelled(userId: string, matchId: string): Promise<Notification> {
		const match = await this.matchModel.findById(matchId);

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		return this.createNotification({
			userId,
			notificationType: NotificationType.MATCH_CANCELLED,
			title: 'Match Bekor Qilindi',
			message: `"${match.matchTitle}" matchi bekor qilindi`,
			relatedMatchId: matchId,
			actionUrl: `/matches/${matchId}`,
		});
	}

	async notifyMultipleUsers(
		userIds: string[],
		notificationData: {
			notificationType: NotificationType;
			title: string;
			message: string;
			relatedMatchId?: string;
			relatedTeamId?: string;
			relatedLeagueId?: string;
			actionUrl?: string;
		},
	): Promise<Notification[]> {
		const notifications = userIds.map((userId) => ({
			...notificationData,
			userId,
		}));

		return this.notificationModel.insertMany(notifications);
	}
}

