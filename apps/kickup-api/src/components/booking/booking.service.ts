import {
	Injectable,
	NotFoundException,
	ConflictException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingStatus } from '../../schemas/Booking.model';

@Injectable()
export class BookingService {
	constructor(
		@InjectModel('Booking') private readonly bookingModel: Model<Booking>,
	) { }

	async createBooking(createBookingDto: {
		fieldId: string;
		bookerId: string;
		matchId?: string;
		bookingDate: Date;
		startTime: string;
		endTime: string;
		duration: number;
		totalAmount?: number;
		notes?: string;
	}): Promise<Booking> {
		// Check if field is available
		const isAvailable = await this.checkFieldAvailability(
			createBookingDto.fieldId,
			createBookingDto.bookingDate,
			createBookingDto.startTime,
			createBookingDto.endTime,
		);

		if (!isAvailable) {
			throw new ConflictException(
				'Field is not available at this time slot',
			);
		}

		// Calculate total amount if not provided
		if (!createBookingDto.totalAmount) {
			const Property = this.bookingModel.db.model('Property');
			const field = await Property.findById(createBookingDto.fieldId);
			if (field && field.hourlyRate) {
				const hours = createBookingDto.duration / 60;
				createBookingDto.totalAmount = field.hourlyRate * hours;
			}
		}

		const booking = new this.bookingModel(createBookingDto);
		const savedBooking = await booking.save();

		// Increment field bookings count
		await this.incrementFieldBookings(createBookingDto.fieldId);

		return savedBooking;
	}

	async updateBooking(
		bookingId: string,
		bookerId: string,
		updateDto: {
			startTime?: string;
			endTime?: string;
			duration?: number;
			notes?: string;
		},
	): Promise<Booking> {
		const booking = await this.bookingModel.findOne({
			_id: bookingId,
			bookerId,
			status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
		});

		if (!booking) {
			throw new NotFoundException('Booking not found or cannot be updated');
		}

		// If time is changed, check availability
		if (updateDto.startTime || updateDto.endTime) {
			const startTime = updateDto.startTime || booking.startTime;
			const endTime = updateDto.endTime || booking.endTime;

			const isAvailable = await this.checkFieldAvailability(
				booking.fieldId.toString(),
				booking.bookingDate,
				startTime,
				endTime,
				bookingId, // Exclude current booking
			);

			if (!isAvailable) {
				throw new ConflictException(
					'Field is not available at this time slot',
				);
			}
		}

		Object.assign(booking, updateDto);
		return booking.save();
	}

	async cancelBooking(
		bookingId: string,
		bookerId: string,
		reason?: string,
	): Promise<Booking> {
		const booking = await this.bookingModel.findOne({
			_id: bookingId,
			bookerId,
			status: { $ne: BookingStatus.CANCELLED },
		});

		if (!booking) {
			throw new NotFoundException('Booking not found');
		}

		// Check if booking can be cancelled (e.g., not too close to booking time)
		const bookingDateTime = new Date(booking.bookingDate);
		const [hours, minutes] = booking.startTime.split(':').map(Number);
		bookingDateTime.setHours(hours, minutes, 0, 0);

		const now = new Date();
		const hoursUntilBooking =
			(bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

		if (hoursUntilBooking < 2) {
			throw new BadRequestException(
				'Cannot cancel booking less than 2 hours before start time',
			);
		}

		booking.status = BookingStatus.CANCELLED;
		booking.cancelledAt = new Date();
		booking.cancellationReason = reason;

		return booking.save();
	}

	async confirmBooking(bookingId: string): Promise<Booking> {
		const booking = await this.bookingModel.findById(bookingId);

		if (!booking) {
			throw new NotFoundException('Booking not found');
		}

		booking.status = BookingStatus.CONFIRMED;
		return booking.save();
	}

	async getBookingsByField(
		fieldId: string,
		date?: Date,
		limit: number = 50,
	): Promise<Booking[]> {
		const query: any = {
			fieldId,
			status: { $ne: BookingStatus.CANCELLED },
			deletedAt: null,
		};

		if (date) {
			const startOfDay = new Date(date);
			startOfDay.setHours(0, 0, 0, 0);
			const endOfDay = new Date(date);
			endOfDay.setHours(23, 59, 59, 999);
			query.bookingDate = { $gte: startOfDay, $lte: endOfDay };
		}

		return this.bookingModel
			.find(query)
			.populate('bookerId', 'memberNick memberFullName memberImage')
			.populate('matchId', 'matchTitle matchDate')
			.sort({ bookingDate: 1, startTime: 1 })
			.limit(limit)
			.exec();
	}

	async getBookingsByOwner(
		ownerId: string,
		status?: BookingStatus,
		limit: number = 50,
	): Promise<Booking[]> {
		const Property = this.bookingModel.db.model('Property');
		const fields = await Property.find({ ownerId, deletedAt: null }).select('_id');
		const fieldIds = fields.map((f) => f._id);

		const query: any = {
			fieldId: { $in: fieldIds },
			deletedAt: null,
		};

		if (status) {
			query.status = status;
		}

		return this.bookingModel
			.find(query)
			.populate('fieldId', 'propertyName location images')
			.populate('bookerId', 'memberNick memberFullName memberImage')
			.populate('matchId', 'matchTitle matchDate')
			.sort({ bookingDate: -1, startTime: -1 })
			.limit(limit)
			.exec();
	}

	async getMyBookings(
		bookerId: string,
		status?: BookingStatus,
		limit: number = 20,
	): Promise<Booking[]> {
		const query: any = {
			bookerId,
			deletedAt: null,
		};

		if (status) {
			query.status = status;
		}

		return this.bookingModel
			.find(query)
			.populate('fieldId', 'propertyName location images')
			.populate('matchId', 'matchTitle matchDate')
			.sort({ bookingDate: -1 })
			.limit(limit)
			.exec();
	}

	async checkFieldAvailability(
		fieldId: string,
		date: Date,
		startTime: string,
		endTime: string,
		excludeBookingId?: string,
	): Promise<boolean> {
		const query: any = {
			fieldId,
			bookingDate: date,
			status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
			deletedAt: null,
			$or: [
				{
					$and: [
						{ startTime: { $lte: startTime } },
						{ endTime: { $gt: startTime } },
					],
				},
				{
					$and: [
						{ startTime: { $lt: endTime } },
						{ endTime: { $gte: endTime } },
					],
				},
				{
					$and: [
						{ startTime: { $gte: startTime } },
						{ endTime: { $lte: endTime } },
					],
				},
			],
		};

		if (excludeBookingId) {
			query._id = { $ne: excludeBookingId };
		}

		const conflictingBooking = await this.bookingModel.findOne(query);
		return !conflictingBooking;
	}

	private async incrementFieldBookings(fieldId: string): Promise<void> {
		const Property = this.bookingModel.db.model('Property');
		await Property.findByIdAndUpdate(fieldId, {
			$inc: { bookings: 1 },
		});
	}

	async getFieldAvailability(
		fieldId: string,
		date: Date,
	): Promise<{ startTime: string; endTime: string; available: boolean }[]> {
		// Get all bookings for this field on this date
		const bookings = await this.bookingModel.find({
			fieldId,
			bookingDate: date,
			status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
			deletedAt: null,
		});

		// Generate time slots (e.g., every hour from 8:00 to 22:00)
		const timeSlots: { startTime: string; endTime: string; available: boolean }[] =
			[];
		const startHour = 8;
		const endHour = 22;

		for (let hour = startHour; hour < endHour; hour++) {
			const startTime = `${hour.toString().padStart(2, '0')}:00`;
			const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

			// Check if this time slot conflicts with any booking
			const isAvailable = !bookings.some((booking) => {
				return (
					(booking.startTime <= startTime && booking.endTime > startTime) ||
					(booking.startTime < endTime && booking.endTime >= endTime) ||
					(booking.startTime >= startTime && booking.endTime <= endTime)
				);
			});

			timeSlots.push({ startTime, endTime, available: isAvailable });
		}

		return timeSlots;
	}
}

