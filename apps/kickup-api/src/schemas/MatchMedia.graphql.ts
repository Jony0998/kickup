import { ObjectType, Field, ID, Int, InputType } from '@nestjs/graphql';
import { MediaType } from './MatchMedia.model';

@ObjectType()
export class MatchMedia {
	@Field(() => ID)
	_id: string;

	@Field(() => ID)
	matchId: string;

	@Field(() => ID)
	uploadedBy: string;

	@Field(() => MediaType)
	mediaType: MediaType;

	@Field()
	mediaUrl: string;

	@Field({ nullable: true })
	thumbnailUrl?: string;

	@Field({ nullable: true })
	title?: string;

	@Field({ nullable: true })
	description?: string;

	@Field(() => Int, { nullable: true })
	duration?: number;

	@Field(() => Int, { nullable: true })
	fileSize?: number;

	@Field({ nullable: true })
	mimeType?: string;

	@Field(() => Int)
	views: number;

	@Field(() => Int)
	likes: number;

	@Field(() => [String], { nullable: true })
	tags?: string[];

	@Field(() => Boolean)
	isPublic: boolean;

	@Field(() => Int)
	order: number;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

@InputType()
export class CreateMatchMediaInput {
	@Field(() => ID)
	matchId: string;

	@Field(() => MediaType)
	mediaType: MediaType;

	@Field()
	mediaUrl: string;

	@Field({ nullable: true })
	thumbnailUrl?: string;

	@Field({ nullable: true })
	title?: string;

	@Field({ nullable: true })
	description?: string;

	@Field(() => Int, { nullable: true })
	duration?: number;

	@Field(() => Int, { nullable: true })
	fileSize?: number;

	@Field({ nullable: true })
	mimeType?: string;

	@Field(() => [String], { nullable: true })
	tags?: string[];

	@Field(() => Boolean, { nullable: true, defaultValue: true })
	isPublic?: boolean;

	@Field(() => Int, { nullable: true, defaultValue: 0 })
	order?: number;
}

@InputType()
export class UpdateMatchMediaInput {
	@Field({ nullable: true })
	title?: string;

	@Field({ nullable: true })
	description?: string;

	@Field(() => [String], { nullable: true })
	tags?: string[];

	@Field(() => Boolean, { nullable: true })
	isPublic?: boolean;

	@Field(() => Int, { nullable: true })
	order?: number;
}

