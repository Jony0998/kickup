import { ObjectType, Field, ID, Int, InputType } from '@nestjs/graphql';
import { NotificationType, NotificationStatus } from './Notification.model';

@ObjectType()
export class Notification {
	@Field(() => ID)
	_id: string;

	@Field(() => ID)
	userId: string;

	@Field(() => NotificationType)
	notificationType: NotificationType;

	@Field()
	title: string;

	@Field()
	message: string;

	@Field(() => NotificationStatus)
	status: NotificationStatus;

	@Field(() => ID, { nullable: true })
	relatedMatchId?: string;

	@Field(() => ID, { nullable: true })
	relatedTeamId?: string;

	@Field(() => ID, { nullable: true })
	relatedLeagueId?: string;

	@Field(() => ID, { nullable: true })
	relatedMemberId?: string;

	@Field(() => ID, { nullable: true })
	relatedReviewId?: string;

	@Field({ nullable: true })
	actionUrl?: string;

	@Field(() => Boolean)
	isPushSent: boolean;

	@Field({ nullable: true })
	pushSentAt?: Date;

	@Field({ nullable: true })
	readAt?: Date;

	@Field({ nullable: true })
	archivedAt?: Date;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

@InputType()
export class CreateNotificationInput {
	@Field(() => ID)
	userId: string;

	@Field(() => NotificationType)
	notificationType: NotificationType;

	@Field()
	title: string;

	@Field()
	message: string;

	@Field(() => ID, { nullable: true })
	relatedMatchId?: string;

	@Field(() => ID, { nullable: true })
	relatedTeamId?: string;

	@Field(() => ID, { nullable: true })
	relatedLeagueId?: string;

	@Field(() => ID, { nullable: true })
	relatedMemberId?: string;

	@Field({ nullable: true })
	actionUrl?: string;
}

