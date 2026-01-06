import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { MatchStatus, MatchType } from './Match.model';

@ObjectType()
export class Location {
	@Field({ nullable: true })
	address?: string;

	@Field({ nullable: true })
	city?: string;

	@Field({ nullable: true })
	district?: string;

	@Field(() => Coordinates, { nullable: true })
	coordinates?: Coordinates;
}

@ObjectType()
export class Coordinates {
	@Field(() => Float, { nullable: true })
	lat?: number;

	@Field(() => Float, { nullable: true })
	lng?: number;
}

@ObjectType()
export class Match {
	@Field(() => ID)
	_id: string;

	@Field()
	matchTitle: string;

	@Field({ nullable: true })
	matchDescription?: string;

	@Field(() => MatchType)
	matchType: MatchType;

	@Field(() => MatchStatus)
	matchStatus: MatchStatus;

	@Field(() => ID)
	fieldId: string;

	@Field(() => ID)
	organizerId: string;

	@Field()
	matchDate: Date;

	@Field()
	matchTime: string;

	@Field(() => Int, { nullable: true })
	duration?: number;

	@Field(() => Int)
	maxPlayers: number;

	@Field(() => Int)
	currentPlayers: number;

	@Field(() => [ID], { nullable: true })
	joinedPlayers?: string[];

	@Field(() => Float, { nullable: true })
	matchFee?: number;

	@Field({ nullable: true })
	skillLevel?: string;

	@Field(() => Location, { nullable: true })
	location?: Location;

	@Field({ nullable: true })
	matchImage?: string;

	@Field(() => Int)
	views: number;

	@Field(() => Int)
	likes: number;

	@Field(() => [ID], { nullable: true })
	likedBy?: string[];

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

