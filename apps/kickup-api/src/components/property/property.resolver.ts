import { Resolver, Query, Mutation, Args, ID, InputType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PropertyService } from './property.service';
import { Property, PropertyLocation } from '../../schemas/Property.graphql';
import { PropertyStatus, PropertyType } from '../../libs/enums/property.enum';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';

@Resolver(() => Property)
export class PropertyResolver {
	constructor(private readonly propertyService: PropertyService) { }

	@Query(() => [Property], { name: 'properties' })
	async findAll(
		@Args('ownerId', { nullable: true, type: () => ID }) ownerId?: string,
		@Args('city', { nullable: true }) city?: string,
		@Args('district', { nullable: true }) district?: string,
		@Args('status', { nullable: true, type: () => PropertyStatus })
		status?: PropertyStatus,
		@Args('type', { nullable: true, type: () => PropertyType })
		type?: PropertyType,
		@Args('isRecommended', { nullable: true }) isRecommended?: boolean,
		@Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0 }) skip?: number,
	) {
		return this.propertyService.findAll({
			ownerId,
			city,
			district,
			status,
			type,
			isRecommended,
			limit,
			skip,
		});
	}

	@Query(() => Property, { name: 'property' })
	async findOne(@Args('id', { type: () => ID }) id: string) {
		return this.propertyService.findOne(id);
	}

	@Query(() => [Property], { name: 'recommendedProperties' })
	async getRecommendedProperties(
		@Args('limit', { nullable: true, defaultValue: 10 }) limit?: number,
	) {
		return this.propertyService.getRecommendedProperties(limit);
	}

	@Query(() => [Property], { name: 'searchProperties' })
	async searchByLocation(
		@Args('city') city: string,
		@Args('district', { nullable: true }) district?: string,
		@Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
	) {
		return this.propertyService.searchByLocation(city, district, limit);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Property)
	async createProperty(
		@CurrentUser() user: JwtPayload,
		@Args('propertyName') propertyName: string,
		@Args('location', { type: () => String }) location: string,
		@Args('propertyType', { nullable: true, type: () => PropertyType })
		propertyType?: PropertyType,
		@Args('propertyDescription', { nullable: true })
		propertyDescription?: string,
		@Args('hourlyRate', { nullable: true, defaultValue: 0 })
		hourlyRate?: number,
	) {
		const parsedLocation = location ? JSON.parse(location) : undefined;
		return this.propertyService.createProperty({
			propertyName,
			location: parsedLocation,
			propertyType,
			propertyDescription,
			hourlyRate,
			ownerId: user.sub,
		});
	}

	@Mutation(() => Property)
	async updateProperty(
		@Args('id', { type: () => ID }) id: string,
		@Args('updateData', { type: () => String }) updateData: string,
	) {
		const parsed = updateData ? JSON.parse(updateData) : {};
		return this.propertyService.updateProperty(id, parsed);
	}

	@Mutation(() => Boolean)
	async deleteProperty(@Args('id', { type: () => ID }) id: string) {
		return this.propertyService.deleteProperty(id);
	}

	@Query(() => [Property], { name: 'nearbyProperties' })
	async findNearbyProperties(
		@Args('lat', { type: () => Number }) lat: number,
		@Args('lng', { type: () => Number }) lng: number,
		@Args('radiusKm', { nullable: true, defaultValue: 10, type: () => Number })
		radiusKm?: number,
		@Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
	) {
		return this.propertyService.findNearbyProperties(lat, lng, radiusKm, limit);
	}

	@Query(() => [Property], { name: 'searchPropertiesWithDistance' })
	async searchByLocationWithDistance(
		@Args('city') city: string,
		@Args('lat', { nullable: true, type: () => Number }) lat?: number,
		@Args('lng', { nullable: true, type: () => Number }) lng?: number,
		@Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
	) {
		return this.propertyService.searchByLocationWithDistance(
			city,
			lat,
			lng,
			limit,
		);
	}
}

