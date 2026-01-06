import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { MemberType, MemberStatus, MemberAuthType } from '../libs/enums/member.enum';

@ObjectType()
export class Member {
	@Field(() => ID)
	_id: string;

	@Field(() => MemberType)
	memberType: MemberType;

	@Field(() => MemberStatus)
	memberStatus: MemberStatus;

	@Field(() => MemberAuthType)
	memberAuthType: MemberAuthType;

	@Field()
	memberPhone: string;

	@Field()
	memberNick: string;

	@Field({ nullable: true })
	memberFullName?: string;

	@Field({ nullable: true })
	memberImage?: string;

	@Field({ nullable: true })
	memberAddress?: string;

	@Field({ nullable: true })
	memberDesc?: string;

	@Field(() => Int)
	memberProperties: number;

	@Field(() => Int)
	memberArticles: number;

	@Field(() => Int)
	memberFollowers: number;

	@Field(() => Int)
	memberFollowings: number;

	@Field(() => Int)
	memberPoints: number;

	@Field(() => Int)
	memberLikes: number;

	@Field(() => Int)
	memberViews: number;

	@Field(() => Int)
	memberComments: number;

	@Field(() => Int)
	memberRank: number;

	@Field(() => Int)
	memberWarnings: number;

	@Field(() => Int)
	memberBlocks: number;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

