import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RefereeService } from './referee.service';
import { RefereeResolver } from './referee.resolver';
import RefereeSchema from '../../schemas/Referee.model';
import MemberSchema from '../../schemas/Member.model';
import MatchSchema from '../../schemas/Match.model';
import { AuthModule } from '../../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Referee', schema: RefereeSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Match', schema: MatchSchema },
		]),
		AuthModule,
	],
	providers: [RefereeService, RefereeResolver],
	exports: [RefereeService],
})
export class RefereeModule {}

