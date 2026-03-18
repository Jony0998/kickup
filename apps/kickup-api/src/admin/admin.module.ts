import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';
import MemberSchema from '../schemas/Member.model';
import MatchSchema from '../schemas/Match.model';
import PropertySchema from '../schemas/Property.model';
import BookingSchema from '../schemas/Booking.model';
import ReviewSchema from '../schemas/Review.model';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Match', schema: MatchSchema },
			{ name: 'Property', schema: PropertySchema },
			{ name: 'Booking', schema: BookingSchema },
			{ name: 'Review', schema: ReviewSchema },
		]),
		AuthModule,
	],
	providers: [AdminService, AdminResolver],
	exports: [AdminService],
})
export class AdminModule {}

