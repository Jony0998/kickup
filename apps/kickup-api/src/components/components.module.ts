import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PropertyModule } from './property/property.module';
import { MatchModule } from './match/match.module';
import { ReviewModule } from './review/review.module';
import { BookingModule } from './booking/booking.module';

@Module({
	imports: [
		MemberModule,
		PropertyModule,
		MatchModule,
		ReviewModule,
		BookingModule,
	],
})
export class ComponentsModule {}
