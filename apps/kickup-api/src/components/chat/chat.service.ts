import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	BadRequestException,
	Inject,
	forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatType } from '../../schemas/Chat.model';
import { Match } from '../../schemas/Match.model';
import { Team } from '../../schemas/Team.model';
import { League } from '../../schemas/League.model';
import { Message } from '../../libs/enums/common.enum';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
	constructor(
		@InjectModel('ChatMessage') private readonly chatMessageModel: Model<ChatMessage>,
		@InjectModel('Match') private readonly matchModel: Model<Match>,
		@InjectModel('Team') private readonly teamModel: Model<Team>,
		@InjectModel('League') private readonly leagueModel: Model<League>,
		@Inject(forwardRef(() => ChatGateway))
		private readonly chatGateway: ChatGateway,
	) { }

	private normalizeChatType(chatType: ChatType | string): ChatType {
		const s = String(chatType ?? '').toUpperCase();
		if (Object.values(ChatType).includes(s as ChatType)) return s as ChatType;
		throw new BadRequestException(`Invalid chat type: ${chatType}`);
	}

	private generateChatId(chatType: ChatType, ...ids: string[]): string {
		const sortedIds = ids.sort().join(':');
		return `${String(chatType).toLowerCase()}:${sortedIds}`;
	}

	/** Check if user can access match chat (organizer or joined player). */
	async canAccessMatchChat(userId: string, matchId: string): Promise<boolean> {
		const match = await this.matchModel.findById(matchId);
		if (!match || (match as any).deletedAt) return false;
		const toStr = (v: any) => (v && typeof v === 'object' && v._id != null ? String(v._id) : String(v));
		const isOrganizer = toStr(match.organizerId) === userId;
		const isPlayer = (match.joinedPlayers || []).some((id: any) => toStr(id) === userId);
		return !!(isOrganizer || isPlayer);
	}

	/** Check if user can access team chat (team member only). */
	async canAccessTeamChat(userId: string, teamId: string): Promise<boolean> {
		const team = await this.teamModel.findById(teamId);
		if (!team || (team as any).deletedAt) return false;
		const toStr = (v: any) => (v && typeof v === 'object' && v._id != null ? String(v._id) : String(v));
		return team.members?.some((m) => toStr(m.memberId) === userId) ?? false;
	}

	private async generateInternalChatId(chatType: ChatType | string, relatedId: string, senderId: string): Promise<string> {
		const type = this.normalizeChatType(chatType);
		if (type === ChatType.DIRECT) {
			return this.generateChatId(type, senderId, relatedId);
		} else if (type === ChatType.MATCH) {
			const match = await this.matchModel.findById(relatedId);
			if (!match || match.deletedAt) {
				throw new NotFoundException('Match not found');
			}
			return this.generateChatId(type, relatedId);
		} else if (type === ChatType.TEAM) {
			const team = await this.teamModel.findById(relatedId);
			if (!team || team.deletedAt) {
				throw new NotFoundException('Team not found');
			}
			return this.generateChatId(type, relatedId);
		} else if (type === ChatType.LEAGUE) {
			const league = await this.leagueModel.findById(relatedId);
			if (!league || league.deletedAt) {
				throw new NotFoundException('League not found');
			}
			return this.generateChatId(type, relatedId);
		}
		throw new BadRequestException('Invalid chat type');
	}

	async sendMessage(
		senderId: string,
		chatType: ChatType | string,
		message: string,
		relatedId: string, // matchId, teamId, leagueId, or otherUserId
		messageType = 'TEXT',
		mediaUrl?: string,
		replyTo?: string,
	): Promise<ChatMessage> {
		if (!message || !String(message).trim()) {
			throw new BadRequestException('Message cannot be empty');
		}
		const type = this.normalizeChatType(chatType);
		// Validate access and generate chatId
		const chatId = await this.generateInternalChatId(type, relatedId, senderId);

		// Specific access checks for non-direct chats
		if (type === ChatType.MATCH) {
			const match = await this.matchModel.findById(relatedId);
			if (!match || (match as any).deletedAt) {
				throw new NotFoundException('Match not found');
			}
			const toStr = (v: any) => (v && typeof v === 'object' && v._id != null ? String(v._id) : String(v));
			const wasInMatch =
				toStr(match.organizerId) === senderId ||
				(match.joinedPlayers || []).some((id) => toStr(id) === senderId);

			if (!wasInMatch) {
				throw new ForbiddenException('You are not part of this match');
			}
		} else if (type === ChatType.TEAM) {
			const canAccess = await this.canAccessTeamChat(senderId, relatedId);
			if (!canAccess) {
				throw new ForbiddenException('You are not a member of this team');
			}
		} else if (type === ChatType.LEAGUE) {
			const league = await this.leagueModel.findById(relatedId);
			const isOrganizer = league.organizerId.toString() === senderId;
			const isTeamMember = league.teams.some((t) => t.teamId.toString() === senderId);
			if (!isOrganizer && !isTeamMember) {
				throw new ForbiddenException('You are not part of this league');
			}
		}

		// Create message
		const chatMessage = new this.chatMessageModel({
			chatId,
			chatType: type,
			senderId,
			message: String(message).trim(),
			messageType,
			mediaUrl,
			replyTo,
			readBy: [senderId], // Sender has read their own message
		});

		const savedMessage = await chatMessage.save();

		// Emit real-time event so all clients in this room get the message in real time
		try {
			const senderIdStr = savedMessage.senderId && typeof savedMessage.senderId === 'object' && (savedMessage.senderId as any)._id
				? (savedMessage.senderId as any)._id.toString()
				: String(savedMessage.senderId);
			this.chatGateway.emitNewMessage(chatId, {
				id: savedMessage._id.toString(),
				chatId: savedMessage.chatId,
				senderId: senderIdStr,
				message: savedMessage.message,
				createdAt: savedMessage.createdAt,
			});
		} catch (error) {
			console.error('Failed to emit socket message:', error);
		}

		return savedMessage;
	}

	async getChatMessages(
		relatedId: string,
		chatType: ChatType,
		userId: string,
		limit = 50,
		skip = 0,
	): Promise<ChatMessage[]> {
		if (chatType === ChatType.MATCH) {
			const canAccess = await this.canAccessMatchChat(userId, relatedId);
			if (!canAccess) {
				throw new ForbiddenException('You do not have access to this match chat. Only participants and the organizer can view it.');
			}
		}
		if (chatType === ChatType.TEAM) {
			const canAccess = await this.canAccessTeamChat(userId, relatedId);
			if (!canAccess) {
				throw new ForbiddenException('You do not have access to this team chat. Only team members can view it.');
			}
		}

		const chatId = await this.generateInternalChatId(chatType, relatedId, userId);

		const messages = await this.chatMessageModel
			.find({ chatId, deletedAt: null, isDeleted: false })
			.populate('senderId', 'memberNick memberFullName memberImage')
			.populate('replyTo', 'message senderId')
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(skip)
			.exec();

		// Mark messages as read
		await this.markAsRead(chatId, userId, messages.map((m) => m._id.toString()));

		return messages.reverse(); // Return in chronological order
	}

	async markAsRead(chatId: string, userId: string, messageIds?: string[]): Promise<void> {
		const query: any = { chatId, deletedAt: null };

		if (messageIds && messageIds.length > 0) {
			query._id = { $in: messageIds };
		}

		await this.chatMessageModel.updateMany(
			{
				...query,
				senderId: { $ne: userId }, // Don't mark own messages
				readBy: { $ne: userId }, // Only if not already read
			},
			{
				$addToSet: { readBy: userId },
			},
		);
	}

	async updateMessage(
		messageId: string,
		userId: string,
		newMessage: string,
	): Promise<ChatMessage> {
		const message = await this.chatMessageModel.findById(messageId);

		if (!message || message.deletedAt || message.isDeleted) {
			throw new NotFoundException('Message not found');
		}

		if (message.senderId.toString() !== userId) {
			throw new ForbiddenException('Only sender can edit message');
		}

		message.message = newMessage;
		message.isEdited = true;

		return message.save();
	}

	async deleteMessage(messageId: string, userId: string): Promise<boolean> {
		const message = await this.chatMessageModel.findById(messageId);

		if (!message || message.deletedAt) {
			throw new NotFoundException('Message not found');
		}

		if (message.senderId.toString() !== userId) {
			throw new ForbiddenException('Only sender can delete message');
		}

		message.isDeleted = true;
		message.message = '[Message deleted]';
		await message.save();

		return true;
	}

	async getUnreadCount(relatedId: string, chatType: ChatType, userId: string): Promise<number> {
		if (chatType === ChatType.MATCH) {
			const canAccess = await this.canAccessMatchChat(userId, relatedId);
			if (!canAccess) return 0;
		}
		if (chatType === ChatType.TEAM) {
			const canAccess = await this.canAccessTeamChat(userId, relatedId);
			if (!canAccess) return 0;
		}
		const chatId = await this.generateInternalChatId(chatType, relatedId, userId);
		return this.chatMessageModel.countDocuments({
			chatId,
			senderId: { $ne: userId },
			readBy: { $ne: userId },
			deletedAt: null,
			isDeleted: false,
		});
	}
}

