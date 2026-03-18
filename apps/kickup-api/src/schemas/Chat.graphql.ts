import { ObjectType, Field, ID, Int, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ChatType } from './Chat.model';

@ObjectType()
export class ChatMessage {
	@Field(() => ID)
	_id: string;

	@Field()
	chatId: string;

	@Field(() => ChatType)
	chatType: ChatType;

	@Field(() => ID)
	senderId: string;

	@Field()
	message: string;

	@Field()
	messageType: string; // 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'SYSTEM'

	@Field({ nullable: true })
	mediaUrl?: string;

	@Field(() => ID, { nullable: true })
	replyTo?: string;

	@Field(() => Boolean)
	isEdited: boolean;

	@Field(() => Boolean)
	isDeleted: boolean;

	@Field(() => [ID])
	readBy: string[];

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

@InputType()
export class SendMessageInput {
	@Field()
	@IsString()
	chatId: string;

	@Field(() => ChatType)
	@IsEnum(ChatType)
	chatType: ChatType;

	@Field()
	@IsString()
	message: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	messageType?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	mediaUrl?: string;

	@Field(() => ID, { nullable: true })
	@IsOptional()
	@IsString()
	replyTo?: string;
}

@InputType()
export class UpdateMessageInput {
	@Field()
	message: string;
}

