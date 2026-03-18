import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchResultService } from './match-result.service';
import { MatchResultResolver } from './match-result.resolver';
import MatchResultSchema from '../../schemas/MatchResult.model';
import MatchSchema from '../../schemas/Match.model';
import PlayerStatisticsSchema from '../../schemas/PlayerStatistics.model';
import { AuthModule } from '../../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'MatchResult', schema: MatchResultSchema },
			{ name: 'Match', schema: MatchSchema },
			{ name: 'PlayerStatistics', schema: PlayerStatisticsSchema },
		]),
		AuthModule,
		NotificationModule,
	],
	providers: [MatchResultService, MatchResultResolver],
	exports: [MatchResultService],
})
export class MatchResultModule { }

