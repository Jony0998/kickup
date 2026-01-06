import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchService } from './match.service';
import { MatchResolver } from './match.resolver';
import MatchSchema from '../../schemas/Match.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Match', schema: MatchSchema }]),
	],
	providers: [MatchService, MatchResolver],
	exports: [MatchService],
})
export class MatchModule {}

