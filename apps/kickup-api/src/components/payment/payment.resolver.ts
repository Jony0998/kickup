import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import { Payment, CreatePaymentInput, ProcessPaymentInput } from '../../schemas/Payment.graphql';
import { PaymentStatus } from '../../schemas/Payment.model';
import { Payment as PaymentModel } from '../../schemas/Payment.model';

@Resolver(() => Payment)
export class PaymentResolver {
	constructor(private readonly paymentService: PaymentService) { }

	private convertToGraphQLPayment(payment: PaymentModel): Payment {
		return {
			_id: payment._id.toString(),
			userId: payment.userId.toString(),
			paymentType: payment.paymentType as any,
			amount: payment.amount,
			currency: payment.currency,
			paymentMethod: payment.paymentMethod as any,
			paymentStatus: payment.paymentStatus as any,
			relatedMatchId: payment.relatedMatchId?.toString(),
			relatedBookingId: payment.relatedBookingId?.toString(),
			relatedLeagueId: payment.relatedLeagueId?.toString(),
			transactionId: payment.transactionId,
			paymentGateway: payment.paymentGateway,
			description: payment.description,
			receiptUrl: payment.receiptUrl,
			refundAmount: payment.refundAmount,
			refundReason: payment.refundReason,
			refundedAt: payment.refundedAt,
			paidAt: payment.paidAt,
			failedAt: payment.failedAt,
			failureReason: payment.failureReason,
			createdAt: payment.createdAt,
			updatedAt: payment.updatedAt,
		} as Payment;
	}

	@UseGuards(AuthGuard)
	@Query(() => [Payment], { name: 'myPayments' })
	async getUserPayments(
		@CurrentUser() user: JwtPayload,
		@Args('status', { nullable: true, type: () => PaymentStatus }) status?: PaymentStatus,
		@Args('limit', { nullable: true, defaultValue: 50, type: () => Int }) limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0, type: () => Int }) skip?: number,
	) {
		const payments = await this.paymentService.getUserPayments(user.sub, status, limit, skip);
		return payments.map((p) => this.convertToGraphQLPayment(p));
	}

	@UseGuards(AuthGuard)
	@Query(() => Payment, { name: 'payment' })
	async getPaymentById(
		@CurrentUser() user: JwtPayload,
		@Args('id', { type: () => ID }) id: string,
	) {
		const payment = await this.paymentService.getPaymentById(id, user.sub);
		return this.convertToGraphQLPayment(payment);
	}

	@UseGuards(AuthGuard)
	@Query(() => [Payment], { name: 'matchPayments' })
	async getMatchPayments(@Args('matchId', { type: () => ID }) matchId: string) {
		const payments = await this.paymentService.getMatchPayments(matchId);
		return payments.map((p) => this.convertToGraphQLPayment(p));
	}

	@UseGuards(AuthGuard)
	@Query(() => [Payment], { name: 'agentPayments' })
	async getAgentPayments(
		@CurrentUser() user: JwtPayload,
		@Args('status', { nullable: true, type: () => PaymentStatus }) status?: PaymentStatus,
		@Args('limit', { nullable: true, defaultValue: 50, type: () => Int }) limit?: number,
	) {
		const payments = await this.paymentService.getPaymentsByOwner(user.sub, status, limit);
		return payments.map((p) => this.convertToGraphQLPayment(p));
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Payment)
	async createPayment(
		@CurrentUser() user: JwtPayload,
		@Args('input') input: CreatePaymentInput,
	) {
		const payment = await this.paymentService.createPayment(user.sub, input);
		return this.convertToGraphQLPayment(payment);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Payment)
	async processPayment(
		@CurrentUser() user: JwtPayload,
		@Args('input') input: ProcessPaymentInput,
	) {
		const payment = await this.paymentService.processPayment(
			input.paymentId,
			input.transactionId || '',
			input.paymentGateway,
		);
		return this.convertToGraphQLPayment(payment);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Payment)
	async confirmPayment(
		@CurrentUser() user: JwtPayload,
		@Args('paymentId', { type: () => ID }) paymentId: string,
	) {
		const payment = await this.paymentService.confirmPayment(paymentId, user.sub);
		return this.convertToGraphQLPayment(payment);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Payment)
	async cancelPayment(
		@CurrentUser() user: JwtPayload,
		@Args('paymentId', { type: () => ID }) paymentId: string,
	) {
		const payment = await this.paymentService.cancelPayment(paymentId, user.sub);
		return this.convertToGraphQLPayment(payment);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Payment)
	async refundPayment(
		@CurrentUser() user: JwtPayload,
		@Args('paymentId', { type: () => ID }) paymentId: string,
		@Args('refundAmount', { type: () => Number }) refundAmount: number,
		@Args('reason') reason: string,
	) {
		const payment = await this.paymentService.refundPayment(paymentId, refundAmount, reason);
		return this.convertToGraphQLPayment(payment);
	}
}

