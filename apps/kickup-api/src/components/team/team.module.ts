import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamService } from './team.service';
import { TeamResolver } from './team.resolver';
import TeamSchema from '../../schemas/Team.model';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../../auth/auth.module';
import { MemberModule } from '../member/member.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Team', schema: TeamSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		MemberModule,
	],
	providers: [TeamService, TeamResolver],
	exports: [TeamService],
})
export class TeamModule {}

