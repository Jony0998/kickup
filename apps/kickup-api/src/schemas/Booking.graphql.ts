import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { BookingStatus } from './Booking.model';

@ObjectType()
export class Booking {
	@Field(() => ID)
	_id: string;

	@Field(() => ID)
	fieldId: string;

	@Field(() => ID)
	bookerId: string;

	@Field(() => ID, { nullable: true })
	matchId?: string;

	@Field()
	bookingDate: Date;

	@Field()
	startTime: string;

	@Field()
	endTime: string;

	@Field(() => Float)
	duration: number;

	@Field(() => Float)
	totalAmount: number;

	@Field(() => BookingStatus)
	status: BookingStatus;

	@Field()
	paymentStatus: string;

	@Field({ nullable: true })
	notes?: string;

	@Field({ nullable: true })
	cancelledAt?: Date;

	@Field({ nullable: true })
	cancellationReason?: string;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

@ObjectType()
export class TimeSlot {
	@Field()
	startTime: string;

	@Field()
	endTime: string;

	@Field()
	available: boolean;
}

