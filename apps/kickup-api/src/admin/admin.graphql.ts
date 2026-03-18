import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { Member } from '../schemas/Member.graphql';
import { Match } from '../schemas/Match.graphql';
import { Property } from '../schemas/Property.graphql';
import { MemberType } from '../libs/enums/member.enum';

@ObjectType()
export class AdminStatistics {
	@Field(() => Int)
	totalMembers: number;

	@Field(() => Int)
	activeMembers: number;

	@Field(() => Int)
	blockedMembers: number;

	@Field(() => Int)
	totalMatches: number;

	@Field(() => Int)
	totalProperties: number;

	@Field(() => Int)
	totalBookings: number;

	@Field(() => Int)
	totalReviews: number;
}

@InputType()
export class CreateAdminInput {
	@Field()
	memberPhone: string;

	@Field()
	memberNick: string;

	@Field()
	memberPassword: string;

	@Field()
	memberFullName: string;

	@Field()
	secretKey: string;
}

