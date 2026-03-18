import { ObjectType, Field, ID, Int, InputType } from '@nestjs/graphql';
import { IsString, Length, IsOptional, IsEnum } from 'class-validator';
import { MemberType, MemberStatus, MemberAuthType, SkillLevel } from '../libs/enums/member.enum';

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

	@Field(() => SkillLevel, { nullable: true })
	memberSkillLevel?: SkillLevel;

	@Field({ nullable: true })
	memberPhone?: string;

	@Field({ nullable: true })
	memberNick?: string;

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

@InputType()
export class LoginInput {
	@Field()
	@IsString()
	memberPassword: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	memberPhone?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	memberNick?: string;
}

@InputType()
export class RegisterInput {
	@Field()
	@IsString()
	memberPhone: string;

	@Field()
	@IsString()
	memberNick: string;

	@Field()
	@IsString()
	@Length(6, 100)
	memberPassword: string;

	@Field({ nullable: true })
	@IsString()
	@IsOptional()
	memberFullName?: string;

	@Field(() => MemberAuthType, { nullable: true })
	@IsEnum(MemberAuthType)
	@IsOptional()
	memberAuthType?: MemberAuthType;

	@Field(() => MemberType, { nullable: true })
	@IsEnum(MemberType)
	@IsOptional()
	memberType?: MemberType;

	@Field({ nullable: true, defaultValue: false })
	@IsOptional()
	isAdmin?: boolean;

	@Field({ nullable: true })
	@IsString()
	@IsOptional()
	adminSecretKey?: string;
}

