import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchInvitationService } from './match-invitation.service';
import { MatchInvitationResolver } from './match-invitation.resolver';
import MatchInvitationSchema from '../../schemas/MatchInvitation.model';
import MatchSchema from '../../schemas/Match.model';
import MemberSchema from '../../schemas/Member.model';
import TeamSchema from '../../schemas/Team.model';
import { AuthModule } from '../../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'MatchInvitation', schema: MatchInvitationSchema },
			{ name: 'Match', schema: MatchSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Team', schema: TeamSchema },
		]),
		AuthModule,
		NotificationModule,
	],
	providers: [MatchInvitationService, MatchInvitationResolver],
	exports: [MatchInvitationService],
})
export class MatchInvitationModule {}

