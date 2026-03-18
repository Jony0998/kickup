import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import ChatMessageSchema from '../../schemas/Chat.model';
import MatchSchema from '../../schemas/Match.model';
import TeamSchema from '../../schemas/Team.model';
import LeagueSchema from '../../schemas/League.model';
import { AuthModule } from '../../auth/auth.module';

import { ChatGateway } from './chat.gateway';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'ChatMessage', schema: ChatMessageSchema },
			{ name: 'Match', schema: MatchSchema },
			{ name: 'Team', schema: TeamSchema },
			{ name: 'League', schema: LeagueSchema },
		]),
		AuthModule,
	],
	providers: [ChatService, ChatResolver, ChatGateway],
	exports: [ChatService],
})
export class ChatModule { }

