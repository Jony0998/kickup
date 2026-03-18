import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { InvitationStatus } from './MatchInvitation.model';

@ObjectType()
export class MatchInvitation {
	@Field(() => ID)
	_id: string;

	@Field(() => ID)
	matchId: string;

	@Field(() => ID)
	inviterId: string;

	@Field(() => ID)
	inviteeId: string;

	@Field()
	inviteeType: string; // 'MEMBER' | 'TEAM'

	@Field(() => InvitationStatus)
	status: InvitationStatus;

	@Field({ nullable: true })
	message?: string;

	@Field({ nullable: true })
	respondedAt?: Date;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

@InputType()
export class CreateMatchInvitationInput {
	@Field(() => ID)
	matchId: string;

	@Field(() => ID)
	inviteeId: string;

	@Field()
	inviteeType: string; // 'MEMBER' | 'TEAM'

	@Field({ nullable: true })
	message?: string;
}

