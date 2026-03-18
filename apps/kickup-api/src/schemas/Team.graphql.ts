import { ObjectType, Field, ID, Int, InputType } from '@nestjs/graphql';
import {
	IsString,
	IsOptional,
	IsInt,
	IsNumber,
	MaxLength,
	IsHexColor,
	IsNotEmpty
} from 'class-validator';
import { TeamStatus, TeamRole } from './Team.model';

@ObjectType()
export class TeamCoordinates {
	@Field(() => Number, { nullable: true })
	@IsOptional()
	@IsNumber()
	lat?: number;

	@Field(() => Number, { nullable: true })
	@IsOptional()
	@IsNumber()
	lng?: number;
}

@ObjectType()
export class TeamLocation {
	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	city?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	district?: string;

	@Field(() => TeamCoordinates, { nullable: true })
	@IsOptional()
	coordinates?: TeamCoordinates;
}

@ObjectType()
export class TeamStatistics {
	@Field(() => Int)
	@IsInt()
	totalMatches: number;

	@Field(() => Int)
	@IsInt()
	wins: number;

	@Field(() => Int)
	@IsInt()
	draws: number;

	@Field(() => Int)
	@IsInt()
	losses: number;

	@Field(() => Int)
	@IsInt()
	goalsFor: number;

	@Field(() => Int)
	@IsInt()
	goalsAgainst: number;
}

@ObjectType()
export class TeamMember {
	@Field(() => ID)
	@IsString()
	memberId: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	memberNick?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	memberFullName?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	memberImage?: string;

	@Field(() => TeamRole)
	role: TeamRole;

	@Field()
	joinedAt: Date;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	position?: string;

	@Field(() => Int, { nullable: true })
	@IsOptional()
	@IsInt()
	jerseyNumber?: number;
}

@ObjectType()
export class SocialMedia {
	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	instagram?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	facebook?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	website?: string;
}

@ObjectType()
export class TeamContactInfo {
	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	phone?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	email?: string;

	@Field(() => SocialMedia, { nullable: true })
	@IsOptional()
	socialMedia?: SocialMedia;
}

@ObjectType()
export class TeamRating {
	@Field(() => Number)
	@IsNumber()
	average: number;

	@Field(() => Int)
	@IsInt()
	count: number;
}

@ObjectType()
export class Team {
	@Field(() => ID)
	_id: string;

	@Field()
	@IsString()
	teamName: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	teamDescription?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	teamLogo?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	teamBanner?: string;

	@Field(() => ID)
	@IsString()
	ownerId: string;

	@Field(() => ID, { nullable: true })
	@IsOptional()
	@IsString()
	captainId?: string;

	@Field(() => [TeamMember])
	members: TeamMember[];

	@Field(() => Int)
	@IsInt()
	maxMembers: number;

	@Field(() => TeamStatus)
	teamStatus: TeamStatus;

	@Field(() => TeamLocation, { nullable: true })
	@IsOptional()
	location?: TeamLocation;

	@Field(() => TeamStatistics)
	statistics: TeamStatistics;

	@Field({ nullable: true })
	@IsOptional()
	@IsHexColor()
	teamColor?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsHexColor()
	teamColorSecondary?: string;

	@Field(() => TeamContactInfo, { nullable: true })
	@IsOptional()
	contactInfo?: TeamContactInfo;

	@Field(() => Int)
	@IsInt()
	views: number;

	@Field(() => Int)
	@IsInt()
	followers: number;

	@Field(() => TeamRating)
	rating: TeamRating;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

@InputType()
export class CreateTeamInput {
	@Field()
	@IsString()
	@IsNotEmpty({ message: 'Team name is required' })
	teamName: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	teamDescription?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	teamLogo?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	teamBanner?: string;

	@Field(() => Int, { nullable: true, defaultValue: 30 })
	@IsOptional()
	@IsInt()
	maxMembers?: number;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	city?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	district?: string;

	@Field(() => Number, { nullable: true })
	@IsOptional()
	@IsNumber()
	lat?: number;

	@Field(() => Number, { nullable: true })
	@IsOptional()
	@IsNumber()
	lng?: number;

	@Field({ nullable: true })
	@IsOptional()
	@IsHexColor()
	teamColor?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsHexColor()
	teamColorSecondary?: string;
}

@InputType()
export class UpdateTeamInput {
	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	teamName?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	teamDescription?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	teamLogo?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	teamBanner?: string;

	@Field(() => Int, { nullable: true })
	@IsOptional()
	@IsInt()
	maxMembers?: number;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	city?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	district?: string;

	@Field(() => Number, { nullable: true })
	@IsOptional()
	@IsNumber()
	lat?: number;

	@Field(() => Number, { nullable: true })
	@IsOptional()
	@IsNumber()
	lng?: number;

	@Field({ nullable: true })
	@IsOptional()
	@IsHexColor()
	teamColor?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsHexColor()
	teamColorSecondary?: string;
}

@ObjectType()
export class JoinTeamResult {
	@Field()
	success: boolean;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	message?: string;
}

