import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import { ChatMessage, SendMessageInput, UpdateMessageInput } from '../../schemas/Chat.graphql';
import { ChatType } from '../../schemas/Chat.model';
import { ChatMessage as ChatMessageModel } from '../../schemas/Chat.model';

@Resolver(() => ChatMessage)
export class ChatResolver {
	constructor(private readonly chatService: ChatService) { }

	private convertToGraphQLChatMessage(message: ChatMessageModel): ChatMessage {
		const senderId = message.senderId && typeof message.senderId === 'object' && (message.senderId as any)._id
			? (message.senderId as any)._id.toString()
			: (message.senderId as any)?.toString?.() || String(message.senderId);
		return {
			_id: message._id.toString(),
			chatId: message.chatId,
			chatType: message.chatType as any,
			senderId,
			message: message.message,
			messageType: message.messageType,
			mediaUrl: message.mediaUrl,
			replyTo: message.replyTo?.toString(),
			isEdited: message.isEdited,
			isDeleted: message.isDeleted,
			readBy: message.readBy.map((id) => id.toString()),
			createdAt: message.createdAt,
			updatedAt: message.updatedAt,
		} as ChatMessage;
	}

	@UseGuards(AuthGuard)
	@Query(() => [ChatMessage], { name: 'chatMessages' })
	async getChatMessages(
		@CurrentUser() user: JwtPayload,
		@Args('chatId') chatId: string,
		@Args('chatType', { type: () => ChatType }) chatType: ChatType,
		@Args('limit', { nullable: true, defaultValue: 50, type: () => Int }) limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0, type: () => Int }) skip?: number,
	) {
		const messages = await this.chatService.getChatMessages(chatId, chatType, user.sub, limit, skip);
		return messages.map((m) => this.convertToGraphQLChatMessage(m));
	}

	@UseGuards(AuthGuard)
	@Query(() => Int, { name: 'unreadMessageCount' })
	async getUnreadCount(
		@CurrentUser() user: JwtPayload,
		@Args('chatId') chatId: string,
		@Args('chatType', { type: () => ChatType }) chatType: ChatType,
	) {
		return this.chatService.getUnreadCount(chatId, chatType, user.sub);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => ChatMessage)
	async sendMessage(
		@CurrentUser() user: JwtPayload,
		@Args('input') input: SendMessageInput,
		@Args('relatedId') relatedId: string, // matchId, teamId, leagueId, or otherUserId
	) {
		const chatType = input.chatType != null ? String(input.chatType) : undefined;
		const messageText = input.message != null ? String(input.message).trim() : '';
		const relId = relatedId != null ? String(relatedId).trim() : '';
		if (!relId) {
			throw new BadRequestException('relatedId is required');
		}
		const message = await this.chatService.sendMessage(
			user.sub,
			chatType,
			messageText,
			relId,
			input.messageType || 'TEXT',
			input.mediaUrl,
			input.replyTo,
		);
		return this.convertToGraphQLChatMessage(message);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => ChatMessage)
	async updateMessage(
		@CurrentUser() user: JwtPayload,
		@Args('messageId', { type: () => ID }) messageId: string,
		@Args('input') input: UpdateMessageInput,
	) {
		const message = await this.chatService.updateMessage(messageId, user.sub, input.message);
		return this.convertToGraphQLChatMessage(message);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async deleteMessage(
		@CurrentUser() user: JwtPayload,
		@Args('messageId', { type: () => ID }) messageId: string,
	) {
		return this.chatService.deleteMessage(messageId, user.sub);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async markMessagesAsRead(
		@CurrentUser() user: JwtPayload,
		@Args('chatId') chatId: string,
		@Args('messageIds', { nullable: true, type: () => [ID] }) messageIds?: string[],
	) {
		await this.chatService.markAsRead(chatId, user.sub, messageIds);
		return true;
	}
}

