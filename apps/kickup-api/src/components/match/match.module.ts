import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchService } from './match.service';
import { MatchResolver } from './match.resolver';
import MatchSchema from '../../schemas/Match.model';
import { AuthModule } from '../../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Match', schema: MatchSchema }]),
		AuthModule,
		NotificationModule,
	],
	providers: [MatchService, MatchResolver],
	exports: [MatchService],
})
export class MatchModule { }

