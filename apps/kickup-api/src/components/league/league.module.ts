import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeagueService } from './league.service';
import { LeagueResolver, LeagueMatchResolver } from './league.resolver';
import LeagueSchema from '../../schemas/League.model';
import TeamSchema from '../../schemas/Team.model';
import MatchSchema from '../../schemas/Match.model';
import { AuthModule } from '../../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'League', schema: LeagueSchema },
			{ name: 'Team', schema: TeamSchema },
			{ name: 'Match', schema: MatchSchema },
		]),
		AuthModule,
	],
	providers: [LeagueService, LeagueResolver, LeagueMatchResolver],
	exports: [LeagueService],
})
export class LeagueModule { }

