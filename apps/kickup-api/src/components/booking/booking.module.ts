import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingService } from './booking.service';
import { BookingResolver } from './booking.resolver';
import BookingSchema from '../../schemas/Booking.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Booking', schema: BookingSchema }]),
	],
	providers: [BookingService, BookingResolver],
	exports: [BookingService],
})
export class BookingModule {}

