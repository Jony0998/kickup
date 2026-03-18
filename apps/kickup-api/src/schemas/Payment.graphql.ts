import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { PaymentStatus, PaymentType, PaymentMethod } from './Payment.model';

@ObjectType()
export class Payment {
	@Field(() => ID)
	_id: string;

	@Field(() => ID)
	userId: string;

	@Field(() => PaymentType)
	paymentType: PaymentType;

	@Field(() => Number)
	amount: number;

	@Field()
	currency: string;

	@Field(() => PaymentMethod)
	paymentMethod: PaymentMethod;

	@Field(() => PaymentStatus)
	paymentStatus: PaymentStatus;

	@Field(() => ID, { nullable: true })
	relatedMatchId?: string;

	@Field(() => ID, { nullable: true })
	relatedBookingId?: string;

	@Field(() => ID, { nullable: true })
	relatedLeagueId?: string;

	@Field({ nullable: true })
	transactionId?: string;

	@Field({ nullable: true })
	paymentGateway?: string;

	@Field({ nullable: true })
	description?: string;

	@Field({ nullable: true })
	receiptUrl?: string;

	@Field(() => Number, { nullable: true })
	refundAmount?: number;

	@Field({ nullable: true })
	refundReason?: string;

	@Field({ nullable: true })
	refundedAt?: Date;

	@Field({ nullable: true })
	paidAt?: Date;

	@Field({ nullable: true })
	failedAt?: Date;

	@Field({ nullable: true })
	failureReason?: string;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

@InputType()
export class CreatePaymentInput {
	@Field(() => PaymentType)
	paymentType: PaymentType;

	@Field(() => Number)
	amount: number;

	@Field({ nullable: true, defaultValue: 'UZS' })
	currency?: string;

	@Field(() => PaymentMethod)
	paymentMethod: PaymentMethod;

	@Field(() => ID, { nullable: true })
	relatedMatchId?: string;

	@Field(() => ID, { nullable: true })
	relatedBookingId?: string;

	@Field(() => ID, { nullable: true })
	relatedLeagueId?: string;

	@Field({ nullable: true })
	transactionId?: string;

	@Field({ nullable: true })
	paymentGateway?: string;

	@Field({ nullable: true })
	description?: string;
}

@InputType()
export class ProcessPaymentInput {
	@Field(() => ID)
	paymentId: string;

	@Field({ nullable: true })
	transactionId?: string;

	@Field({ nullable: true })
	paymentGateway?: string;
}

