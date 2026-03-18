import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';
import NotificationSchema from '../../schemas/Notification.model';
import MatchSchema from '../../schemas/Match.model';
import TeamSchema from '../../schemas/Team.model';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Notification', schema: NotificationSchema },
			{ name: 'Match', schema: MatchSchema },
			{ name: 'Team', schema: TeamSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
	],
	providers: [NotificationService, NotificationResolver],
	exports: [NotificationService],
})
export class NotificationModule {}

