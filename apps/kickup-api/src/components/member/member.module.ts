import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberService } from './member.service';
import { MemberResolver } from './member.resolver';
import { AuthModule } from '../../auth/auth.module';
import MemberSchema from '../../schemas/Member.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		AuthModule,
	],
	providers: [MemberService, MemberResolver],
	exports: [MemberService],
})
export class MemberModule {}
