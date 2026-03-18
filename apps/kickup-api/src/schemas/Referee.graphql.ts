import { ObjectType, Field, ID, Int, InputType } from '@nestjs/graphql';
import { RefereeStatus, RefereeLevel } from './Referee.model';

@ObjectType()
export class RefereeRating {
	@Field(() => Number)
	average: number;

	@Field(() => Int)
	count: number;
}

@ObjectType()
export class RefereeAvailability {
	@Field(() => [Int], { nullable: true })
	daysOfWeek?: number[];

	@Field(() => [String], { nullable: true })
	timeSlots?: string[];

	@Field({ nullable: true })
	city?: string;

	@Field({ nullable: true })
	district?: string;
}

@ObjectType()
export class RefereeContactInfo {
	@Field({ nullable: true })
	phone?: string;

	@Field({ nullable: true })
	email?: string;
}

@ObjectType()
export class Referee {
	@Field(() => ID)
	_id: string;

	@Field(() => ID)
	memberId: string;

	@Field(() => RefereeLevel)
	refereeLevel: RefereeLevel;

	@Field(() => RefereeStatus)
	refereeStatus: RefereeStatus;

	@Field({ nullable: true })
	certificationNumber?: string;

	@Field({ nullable: true })
	certificationDate?: Date;

	@Field(() => Int)
	experienceYears: number;

	@Field(() => Int)
	totalMatches: number;

	@Field(() => RefereeRating)
	rating: RefereeRating;

	@Field(() => [String], { nullable: true })
	specializations?: string[];

	@Field(() => RefereeAvailability, { nullable: true })
	availability?: RefereeAvailability;

	@Field(() => RefereeContactInfo, { nullable: true })
	contactInfo?: RefereeContactInfo;

	@Field({ nullable: true })
	notes?: string;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

@InputType()
export class CreateRefereeInput {
	@Field(() => RefereeLevel)
	refereeLevel: RefereeLevel;

	@Field({ nullable: true })
	certificationNumber?: string;

	@Field({ nullable: true })
	certificationDate?: Date;

	@Field(() => Int, { nullable: true, defaultValue: 0 })
	experienceYears?: number;

	@Field(() => [String], { nullable: true })
	specializations?: string[];

	@Field(() => [Int], { nullable: true })
	daysOfWeek?: number[];

	@Field(() => [String], { nullable: true })
	timeSlots?: string[];

	@Field({ nullable: true })
	city?: string;

	@Field({ nullable: true })
	district?: string;

	@Field({ nullable: true })
	phone?: string;

	@Field({ nullable: true })
	email?: string;

	@Field({ nullable: true })
	notes?: string;
}

@InputType()
export class UpdateRefereeInput {
	@Field(() => RefereeLevel, { nullable: true })
	refereeLevel?: RefereeLevel;

	@Field(() => RefereeStatus, { nullable: true })
	refereeStatus?: RefereeStatus;

	@Field({ nullable: true })
	certificationNumber?: string;

	@Field({ nullable: true })
	certificationDate?: Date;

	@Field(() => Int, { nullable: true })
	experienceYears?: number;

	@Field(() => [String], { nullable: true })
	specializations?: string[];

	@Field(() => [Int], { nullable: true })
	daysOfWeek?: number[];

	@Field(() => [String], { nullable: true })
	timeSlots?: string[];

	@Field({ nullable: true })
	city?: string;

	@Field({ nullable: true })
	district?: string;

	@Field({ nullable: true })
	phone?: string;

	@Field({ nullable: true })
	email?: string;

	@Field({ nullable: true })
	notes?: string;
}

