import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlayerStatisticsService } from './player-statistics.service';
import { PlayerStatisticsResolver } from './player-statistics.resolver';
import PlayerStatisticsSchema from '../../schemas/PlayerStatistics.model';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'PlayerStatistics', schema: PlayerStatisticsSchema },
		]),
	],
	providers: [PlayerStatisticsService, PlayerStatisticsResolver],
	exports: [PlayerStatisticsService],
})
export class PlayerStatisticsModule {}

