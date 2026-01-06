import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { BookingService } from './booking.service';
import { Booking, TimeSlot } from '../../schemas/Booking.graphql';
import { BookingStatus } from '../../schemas/Booking.model';

@Resolver(() => Booking)
export class BookingResolver {
	constructor(private readonly bookingService: BookingService) {}

	@Query(() => [Booking], { name: 'bookings' })
	async getBookingsByField(
		@Args('fieldId', { type: () => ID }) fieldId: string,
		@Args('date', { nullable: true }) date?: Date,
		@Args('limit', { nullable: true, defaultValue: 50 }) limit?: number,
	) {
		return this.bookingService.getBookingsByField(fieldId, date, limit);
	}

	@Query(() => [Booking], { name: 'myBookings' })
	async getMyBookings(
		@Args('bookerId', { type: () => ID }) bookerId: string,
		@Args('status', { nullable: true }) status?: BookingStatus,
		@Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
	) {
		return this.bookingService.getMyBookings(bookerId, status, limit);
	}

	@Query(() => [TimeSlot], { name: 'fieldAvailability' })
	async getFieldAvailability(
		@Args('fieldId', { type: () => ID }) fieldId: string,
		@Args('date') date: Date,
	) {
		return this.bookingService.getFieldAvailability(fieldId, date);
	}

	@Query(() => Boolean, { name: 'checkAvailability' })
	async checkFieldAvailability(
		@Args('fieldId', { type: () => ID }) fieldId: string,
		@Args('date') date: Date,
		@Args('startTime') startTime: string,
		@Args('endTime') endTime: string,
	) {
		return this.bookingService.checkFieldAvailability(
			fieldId,
			date,
			startTime,
			endTime,
		);
	}

	@Mutation(() => Booking)
	async createBooking(
		@Args('fieldId', { type: () => ID }) fieldId: string,
		@Args('bookerId', { type: () => ID }) bookerId: string,
		@Args('bookingDate') bookingDate: Date,
		@Args('startTime') startTime: string,
		@Args('endTime') endTime: string,
		@Args('duration', { type: () => Number }) duration: number,
		@Args('matchId', { nullable: true, type: () => ID }) matchId?: string,
		@Args('totalAmount', { nullable: true, type: () => Number })
		totalAmount?: number,
		@Args('notes', { nullable: true }) notes?: string,
	) {
		return this.bookingService.createBooking({
			fieldId,
			bookerId,
			matchId,
			bookingDate,
			startTime,
			endTime,
			duration,
			totalAmount,
			notes,
		});
	}

	@Mutation(() => Booking)
	async updateBooking(
		@Args('bookingId', { type: () => ID }) bookingId: string,
		@Args('bookerId', { type: () => ID }) bookerId: string,
		@Args('startTime', { nullable: true }) startTime?: string,
		@Args('endTime', { nullable: true }) endTime?: string,
		@Args('duration', { nullable: true, type: () => Number }) duration?: number,
		@Args('notes', { nullable: true }) notes?: string,
	) {
		return this.bookingService.updateBooking(bookingId, bookerId, {
			startTime,
			endTime,
			duration,
			notes,
		});
	}

	@Mutation(() => Booking)
	async cancelBooking(
		@Args('bookingId', { type: () => ID }) bookingId: string,
		@Args('bookerId', { type: () => ID }) bookerId: string,
		@Args('reason', { nullable: true }) reason?: string,
	) {
		return this.bookingService.cancelBooking(bookingId, bookerId, reason);
	}

	@Mutation(() => Booking)
	async confirmBooking(
		@Args('bookingId', { type: () => ID }) bookingId: string,
	) {
		return this.bookingService.confirmBooking(bookingId);
	}
}

