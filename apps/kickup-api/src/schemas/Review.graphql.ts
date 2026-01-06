import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { ReviewType } from './Review.model';

@ObjectType()
export class Review {
	@Field(() => ID)
	_id: string;

	@Field(() => ReviewType)
	reviewType: ReviewType;

	@Field(() => ID)
	targetId: string;

	@Field(() => ID)
	reviewerId: string;

	@Field(() => Int)
	rating: number;

	@Field({ nullable: true })
	comment?: string;

	@Field(() => [String], { nullable: true })
	images?: string[];

	@Field(() => Int)
	likes: number;

	@Field(() => [ID], { nullable: true })
	likedBy?: string[];

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

@ObjectType()
export class RatingSummary {
	@Field(() => Float)
	average: number;

	@Field(() => Int)
	count: number;
}

