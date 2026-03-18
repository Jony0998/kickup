import {
	Injectable,
	NotFoundException,
	BadRequestException,
	ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
	Payment,
	PaymentStatus,
	PaymentType,
	PaymentMethod,
} from '../../schemas/Payment.model';
import { Match } from '../../schemas/Match.model';
import { Booking } from '../../schemas/Booking.model';
import { League } from '../../schemas/League.model';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class PaymentService {
	constructor(
		@InjectModel('Payment') private readonly paymentModel: Model<Payment>,
		@InjectModel('Match') private readonly matchModel: Model<Match>,
		@InjectModel('Booking') private readonly bookingModel: Model<Booking>,
		@InjectModel('League') private readonly leagueModel: Model<League>,
	) { }

	async createPayment(userId: string, createPaymentDto: any): Promise<Payment> {
		// Validate related entity exists
		if (createPaymentDto.relatedMatchId) {
			const match = await this.matchModel.findById(createPaymentDto.relatedMatchId);
			if (!match || match.deletedAt) {
				throw new NotFoundException('Match not found');
			}

			// Check if user is part of match
			const wasInMatch =
				match.organizerId.toString() === userId ||
				match.joinedPlayers.some((id) => id.toString() === userId);

			if (!wasInMatch) {
				throw new ForbiddenException('You are not part of this match');
			}
		}

		if (createPaymentDto.relatedBookingId) {
			const booking = await this.bookingModel.findById(createPaymentDto.relatedBookingId);
			if (!booking || booking.deletedAt) {
				throw new NotFoundException('Booking not found');
			}

			if (booking.bookerId.toString() !== userId) {
				throw new ForbiddenException('You are not authorized for this booking');
			}
		}

		if (createPaymentDto.relatedLeagueId) {
			const league = await this.leagueModel.findById(createPaymentDto.relatedLeagueId);
			if (!league || league.deletedAt) {
				throw new NotFoundException('League not found');
			}
		}

		// Create payment
		const payment = new this.paymentModel({
			...createPaymentDto,
			userId,
			paymentStatus: PaymentStatus.PENDING,
		});

		return payment.save();
	}

	async processPayment(
		paymentId: string,
		transactionId: string,
		paymentGateway?: string,
	): Promise<Payment> {
		const payment = await this.paymentModel.findById(paymentId);

		if (!payment || payment.deletedAt) {
			throw new NotFoundException('Payment not found');
		}

		if (payment.paymentStatus !== PaymentStatus.PENDING) {
			throw new BadRequestException('Payment is not pending');
		}

		// Update payment status
		payment.paymentStatus = PaymentStatus.PROCESSING;
		payment.transactionId = transactionId;
		if (paymentGateway) {
			payment.paymentGateway = paymentGateway;
		}

		// In real implementation, you would call payment gateway API here
		// For now, we'll simulate successful payment
		// TODO: Integrate with actual payment gateway (Payme, Click, Uzum, Stripe, etc.)

		// Simulate payment processing
		// In production, this should be handled by webhook from payment gateway
		setTimeout(async () => {
			payment.paymentStatus = PaymentStatus.COMPLETED;
			payment.paidAt = new Date();
			await payment.save();
		}, 2000);

		return payment.save();
	}

	async confirmPayment(paymentId: string, userId: string): Promise<Payment> {
		const payment = await this.paymentModel.findById(paymentId);

		if (!payment || payment.deletedAt) {
			throw new NotFoundException('Payment not found');
		}

		if (payment.userId.toString() !== userId) {
			throw new ForbiddenException('You are not authorized to confirm this payment');
		}

		if (payment.paymentStatus !== PaymentStatus.PROCESSING) {
			throw new BadRequestException('Payment is not in processing status');
		}

		payment.paymentStatus = PaymentStatus.COMPLETED;
		payment.paidAt = new Date();

		return payment.save();
	}

	async failPayment(paymentId: string, reason: string): Promise<Payment> {
		const payment = await this.paymentModel.findById(paymentId);

		if (!payment || payment.deletedAt) {
			throw new NotFoundException('Payment not found');
		}

		payment.paymentStatus = PaymentStatus.FAILED;
		payment.failedAt = new Date();
		payment.failureReason = reason;

		return payment.save();
	}

	async cancelPayment(paymentId: string, userId: string): Promise<Payment> {
		const payment = await this.paymentModel.findById(paymentId);

		if (!payment || payment.deletedAt) {
			throw new NotFoundException('Payment not found');
		}

		if (payment.userId.toString() !== userId) {
			throw new ForbiddenException('You are not authorized to cancel this payment');
		}

		if (payment.paymentStatus !== PaymentStatus.PENDING) {
			throw new BadRequestException('Can only cancel pending payments');
		}

		payment.paymentStatus = PaymentStatus.CANCELLED;
		return payment.save();
	}

	async refundPayment(
		paymentId: string,
		refundAmount: number,
		reason: string,
	): Promise<Payment> {
		const payment = await this.paymentModel.findById(paymentId);

		if (!payment || payment.deletedAt) {
			throw new NotFoundException('Payment not found');
		}

		if (payment.paymentStatus !== PaymentStatus.COMPLETED) {
			throw new BadRequestException('Can only refund completed payments');
		}

		if (refundAmount > payment.amount) {
			throw new BadRequestException('Refund amount cannot exceed payment amount');
		}

		payment.paymentStatus = PaymentStatus.REFUNDED;
		payment.refundAmount = refundAmount;
		payment.refundReason = reason;
		payment.refundedAt = new Date();

		return payment.save();
	}

	async getUserPayments(
		userId: string,
		status?: PaymentStatus,
		limit = 50,
		skip = 0,
	): Promise<Payment[]> {
		const query: any = { userId, deletedAt: null };

		if (status) {
			query.paymentStatus = status;
		}

		return this.paymentModel
			.find(query)
			.populate('relatedMatchId', 'matchTitle matchDate')
			.populate('relatedBookingId', 'bookingDate')
			.populate('relatedLeagueId', 'leagueName')
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(skip)
			.exec();
	}

	async getPaymentById(paymentId: string, userId: string): Promise<Payment> {
		const payment = await this.paymentModel
			.findById(paymentId)
			.populate('relatedMatchId', 'matchTitle matchDate')
			.populate('relatedBookingId', 'bookingDate')
			.populate('relatedLeagueId', 'leagueName')
			.exec();

		if (!payment || payment.deletedAt) {
			throw new NotFoundException('Payment not found');
		}

		if (payment.userId.toString() !== userId) {
			throw new ForbiddenException('You are not authorized to view this payment');
		}

		return payment;
	}

	async getMatchPayments(matchId: string): Promise<Payment[]> {
		return this.paymentModel
			.find({ relatedMatchId: matchId, deletedAt: null })
			.populate('userId', 'memberNick memberFullName memberImage')
			.sort({ createdAt: -1 })
			.exec();
	}

	async getPaymentsByOwner(
		ownerId: string,
		status?: PaymentStatus,
		limit: number = 50,
	): Promise<Payment[]> {
		const Property = this.paymentModel.db.model('Property');
		const Match = this.paymentModel.db.model('Match');
		const Booking = this.paymentModel.db.model('Booking');

		// 1. Get Agent's properties
		const fields = await Property.find({ ownerId, deletedAt: null }).select('_id');
		const fieldIds = fields.map((f) => f._id);

		// 2. Get Matches for these properties
		const matches = await Match.find({ fieldId: { $in: fieldIds }, deletedAt: null }).select('_id');
		const matchIds = matches.map((m) => m._id);

		// 3. Get Bookings for these properties
		const bookings = await Booking.find({ fieldId: { $in: fieldIds }, deletedAt: null }).select('_id');
		const bookingIds = bookings.map((b) => b._id);

		// 4. Find Payments related to these matches or bookings
		const query: any = {
			$or: [
				{ relatedMatchId: { $in: matchIds } },
				{ relatedBookingId: { $in: bookingIds } },
			],
			deletedAt: null,
		};

		if (status) {
			query.paymentStatus = status;
		}

		return this.paymentModel
			.find(query)
			.populate('userId', 'memberNick memberFullName memberImage')
			.populate('relatedMatchId', 'matchTitle matchDate')
			.populate('relatedBookingId', 'bookingDate')
			.sort({ createdAt: -1 })
			.limit(limit)
			.exec();
	}
}

