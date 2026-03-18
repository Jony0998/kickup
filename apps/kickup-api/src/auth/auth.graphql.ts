import { ObjectType, Field, InputType, Int } from '@nestjs/graphql';
import { Member } from '../schemas/Member.graphql';

@ObjectType()
export class AuthResponse {
	@Field(() => Member)
	member: Member;

	@Field()
	accessToken: string;

	@Field({ nullable: true })
	refreshToken?: string;
}

@InputType()
export class TelegramAuthInput {
	@Field(() => Int)
	id: number;

	@Field()
	first_name: string;

	@Field({ nullable: true })
	last_name?: string;

	@Field({ nullable: true })
	username?: string;

	@Field({ nullable: true })
	photo_url?: string;

	@Field(() => Int)
	auth_date: number;

	@Field()
	hash: string;
}

