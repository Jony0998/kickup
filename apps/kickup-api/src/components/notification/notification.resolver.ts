import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import { Notification, CreateNotificationInput } from '../../schemas/Notification.graphql';
import { NotificationStatus, NotificationType } from '../../schemas/Notification.model';
import { Notification as NotificationModel } from '../../schemas/Notification.model';

@Resolver(() => Notification)
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	private convertToGraphQLNotification(notification: NotificationModel): Notification {
		return {
			_id: notification._id.toString(),
			userId: notification.userId.toString(),
			notificationType: notification.notificationType as any,
			title: notification.title,
			message: notification.message,
			status: notification.status as any,
			relatedMatchId: notification.relatedMatchId?.toString(),
			relatedTeamId: notification.relatedTeamId?.toString(),
			relatedLeagueId: notification.relatedLeagueId?.toString(),
			relatedMemberId: notification.relatedMemberId?.toString(),
			relatedReviewId: notification.relatedReviewId?.toString(),
			actionUrl: notification.actionUrl,
			isPushSent: notification.isPushSent,
			pushSentAt: notification.pushSentAt,
			readAt: notification.readAt,
			archivedAt: notification.archivedAt,
			createdAt: notification.createdAt,
			updatedAt: notification.updatedAt,
		} as Notification;
	}

	@UseGuards(AuthGuard)
	@Query(() => [Notification], { name: 'myNotifications' })
	async getUserNotifications(
		@CurrentUser() user: JwtPayload,
		@Args('status', { nullable: true, type: () => NotificationStatus }) status?: NotificationStatus,
		@Args('limit', { nullable: true, defaultValue: 50, type: () => Int }) limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0, type: () => Int }) skip?: number,
	) {
		const notifications = await this.notificationService.getUserNotifications(
			user.sub,
			status,
			limit,
			skip,
		);
		return notifications.map((n) => this.convertToGraphQLNotification(n));
	}

	@UseGuards(AuthGuard)
	@Query(() => Int, { name: 'unreadNotificationCount' })
	async getUnreadCount(@CurrentUser() user: JwtPayload) {
		return this.notificationService.getUnreadCount(user.sub);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	async markNotificationAsRead(
		@CurrentUser() user: JwtPayload,
		@Args('notificationId', { type: () => ID }) notificationId: string,
	) {
		const notification = await this.notificationService.markAsRead(notificationId, user.sub);
		return this.convertToGraphQLNotification(notification);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Int)
	async markAllNotificationsAsRead(@CurrentUser() user: JwtPayload) {
		return this.notificationService.markAllAsRead(user.sub);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	async archiveNotification(
		@CurrentUser() user: JwtPayload,
		@Args('notificationId', { type: () => ID }) notificationId: string,
	) {
		const notification = await this.notificationService.archiveNotification(
			notificationId,
			user.sub,
		);
		return this.convertToGraphQLNotification(notification);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async deleteNotification(
		@CurrentUser() user: JwtPayload,
		@Args('notificationId', { type: () => ID }) notificationId: string,
	) {
		return this.notificationService.deleteNotification(notificationId, user.sub);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	async createNotification(
		@CurrentUser() user: JwtPayload,
		@Args('input') input: CreateNotificationInput,
	) {
		const notification = await this.notificationService.createNotification({
			...input,
			userId: input.userId,
		});
		return this.convertToGraphQLNotification(notification);
	}
}

