import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchMediaService } from './match-media.service';
import { MatchMediaResolver } from './match-media.resolver';
import MatchMediaSchema from '../../schemas/MatchMedia.model';
import MatchSchema from '../../schemas/Match.model';
import { AuthModule } from '../../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'MatchMedia', schema: MatchMediaSchema },
			{ name: 'Match', schema: MatchSchema },
		]),
		AuthModule,
	],
	providers: [MatchMediaService, MatchMediaResolver],
	exports: [MatchMediaService],
})
export class MatchMediaModule {}

