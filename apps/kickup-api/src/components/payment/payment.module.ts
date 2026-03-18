import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './payment.resolver';
import PaymentSchema from '../../schemas/Payment.model';
import MatchSchema from '../../schemas/Match.model';
import BookingSchema from '../../schemas/Booking.model';
import LeagueSchema from '../../schemas/League.model';
import { AuthModule } from '../../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Payment', schema: PaymentSchema },
			{ name: 'Match', schema: MatchSchema },
			{ name: 'Booking', schema: BookingSchema },
			{ name: 'League', schema: LeagueSchema },
		]),
		AuthModule,
	],
	providers: [PaymentService, PaymentResolver],
	exports: [PaymentService],
})
export class PaymentModule {}

