import { Schema, Document } from 'mongoose';

export enum ChatType {
	DIRECT = 'DIRECT', // One-on-one chat
	TEAM = 'TEAM', // Team chat
	MATCH = 'MATCH', // Match chat
	LEAGUE = 'LEAGUE', // League chat
}

export interface ChatMessage extends Document {
	chatId: string; // Unique chat identifier (e.g., "direct:userId1:userId2", "team:teamId", "match:matchId")
	chatType: ChatType;
	senderId: any; // Member ID
	message: string;
	messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'SYSTEM';
	mediaUrl?: string;
	replyTo?: any; // Message ID this is replying to
	isEdited: boolean;
	isDeleted: boolean;
	readBy: any[]; // Array of member IDs who read this message
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const ChatMessageSchema = new Schema(
	{
		chatId: {
			type: String,
			required: true,
			index: true,
		},
		chatType: {
			type: String,
			enum: ChatType,
			required: true,
		},
		senderId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
		messageType: {
			type: String,
			enum: ['TEXT', 'IMAGE', 'VIDEO', 'FILE', 'SYSTEM'],
			default: 'TEXT',
		},
		mediaUrl: {
			type: String,
		},
		replyTo: {
			type: Schema.Types.ObjectId,
			ref: 'ChatMessage',
		},
		isEdited: {
			type: Boolean,
			default: false,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
		readBy: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Member',
			},
		],
		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'chat_messages' },
);

// Indexes
ChatMessageSchema.index({ chatId: 1, createdAt: -1 });
ChatMessageSchema.index({ senderId: 1 });
ChatMessageSchema.index({ chatType: 1 });

export default ChatMessageSchema;

