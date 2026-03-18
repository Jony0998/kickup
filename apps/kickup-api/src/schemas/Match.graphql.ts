import { ObjectType, Field, ID, Int, Float, InputType } from '@nestjs/graphql';
import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsInt,
	IsNumber,
	IsEnum,
	IsDate,
	IsDateString
} from 'class-validator';
import { MatchStatus, MatchType } from './Match.model';
import { Member } from './Member.graphql';
import { Property } from './Property.graphql';

@ObjectType('MatchCoordinates')
@InputType('MatchCoordinatesInput')
export class Coordinates {
	@Field(() => Float, { nullable: true })
	@IsOptional()
	@IsNumber()
	lat?: number;

	@Field(() => Float, { nullable: true })
	@IsOptional()
	@IsNumber()
	lng?: number;
}

@ObjectType()
@InputType('MatchLocationInput')
export class Location {
	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	address?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	city?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	district?: string;

	@Field(() => Coordinates, { nullable: true })
	@IsOptional()
	coordinates?: Coordinates;
}

@ObjectType()
export class Match {
	@Field(() => ID)
	_id: string;

	@Field()
	@IsString()
	@IsNotEmpty()
	matchTitle: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	matchDescription?: string;

	@Field(() => MatchType)
	@IsEnum(MatchType)
	matchType: MatchType;

	@Field(() => MatchStatus)
	@IsEnum(MatchStatus)
	matchStatus: MatchStatus;

	@Field(() => Property, { nullable: true })
	fieldId?: Property;

	@Field(() => Member)
	organizerId: Member;

	@Field()
	@IsDate()
	matchDate: Date;

	@Field()
	@IsString()
	@IsNotEmpty()
	matchTime: string;

	@Field(() => Int, { nullable: true })
	@IsOptional()
	@IsInt()
	duration?: number;

	@Field(() => Int)
	@IsInt()
	maxPlayers: number;

	@Field(() => Int)
	@IsInt()
	currentPlayers: number;

	@Field(() => [Member], { nullable: true })
	joinedPlayers?: Member[];

	@Field(() => [Member], { nullable: true })
	checkedInPlayers?: Member[];

	@Field(() => Float, { nullable: true })
	@IsOptional()
	@IsNumber()
	matchFee?: number;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	skillLevel?: string;

	@Field(() => Location, { nullable: true })
	@IsOptional()
	location?: Location;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	matchImage?: string;

	@Field(() => [String], { nullable: true })
	@IsOptional()
	images?: string[];

	@Field(() => Int)
	@IsInt()
	views: number;

	@Field(() => Int)
	@IsInt()
	likes: number;

	@Field(() => [String], { nullable: true })
	@IsOptional()
	likedBy?: string[];

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

@ObjectType()
export class CheckInResponse {
	@Field(() => Match)
	match: Match;

	@Field()
	checkedInMemberId: string;

	@Field()
	checkedInAt: Date;
}

@InputType()
export class CreateMatchInput {
	@Field()
	@IsString()
	@IsNotEmpty()
	matchTitle: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	matchDescription?: string;

	@Field(() => MatchType, { nullable: true })
	@IsOptional()
	@IsEnum(MatchType)
	matchType?: MatchType;

	@Field(() => ID, { nullable: true })
	@IsOptional()
	fieldId?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	address?: string;

	@Field()
	@IsDate()
	matchDate: Date;

	@Field()
	@IsString()
	@IsNotEmpty()
	matchTime: string;

	@Field(() => Int, { nullable: true })
	@IsOptional()
	@IsInt()
	duration?: number;

	@Field(() => Int, { nullable: true })
	@IsOptional()
	@IsInt()
	maxPlayers?: number;

	@Field(() => Float, { nullable: true })
	@IsOptional()
	@IsNumber()
	matchFee?: number;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	skillLevel?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	matchImage?: string;

	@Field(() => [String], { nullable: true })
	@IsOptional()
	images?: string[];
}

