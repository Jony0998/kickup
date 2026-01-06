import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { PropertyStatus, PropertyType } from './Property.model';

@ObjectType()
export class PropertyLocation {
	@Field()
	address: string;

	@Field()
	city: string;

	@Field({ nullable: true })
	district?: string;

	@Field(() => Coordinates, { nullable: true })
	coordinates?: Coordinates;
}

@ObjectType()
export class Coordinates {
	@Field(() => Float, { nullable: true })
	lat?: number;

	@Field(() => Float, { nullable: true })
	lng?: number;
}

@ObjectType()
export class ContactInfo {
	@Field({ nullable: true })
	phone?: string;

	@Field({ nullable: true })
	email?: string;
}

@ObjectType()
export class FieldSize {
	@Field(() => Float, { nullable: true })
	width?: number;

	@Field(() => Float, { nullable: true })
	length?: number;
}

@ObjectType()
export class Rating {
	@Field(() => Float)
	average: number;

	@Field(() => Int)
	count: number;
}

@ObjectType()
export class Property {
	@Field(() => ID)
	_id: string;

	@Field()
	propertyName: string;

	@Field({ nullable: true })
	propertyDescription?: string;

	@Field(() => PropertyType)
	propertyType: PropertyType;

	@Field(() => PropertyStatus)
	propertyStatus: PropertyStatus;

	@Field(() => ID, { nullable: true })
	ownerId?: string;

	@Field(() => PropertyLocation)
	location: PropertyLocation;

	@Field(() => ContactInfo, { nullable: true })
	contactInfo?: ContactInfo;

	@Field(() => [String], { nullable: true })
	amenities?: string[];

	@Field(() => FieldSize, { nullable: true })
	fieldSize?: FieldSize;

	@Field(() => Int, { nullable: true })
	capacity?: number;

	@Field(() => Float, { nullable: true })
	hourlyRate?: number;

	@Field(() => [String], { nullable: true })
	images?: string[];

	@Field(() => Rating, { nullable: true })
	rating?: Rating;

	@Field(() => Int)
	views: number;

	@Field(() => Int)
	bookings: number;

	@Field()
	isRecommended: boolean;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

