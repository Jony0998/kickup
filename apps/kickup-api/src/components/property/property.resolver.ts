import { Resolver, Query, Mutation, Args, ID, InputType } from '@nestjs/graphql';
import { PropertyService } from './property.service';
import { Property, PropertyLocation } from '../../schemas/Property.graphql';
import { PropertyStatus, PropertyType } from '../../schemas/Property.model';

@Resolver(() => Property)
export class PropertyResolver {
	constructor(private readonly propertyService: PropertyService) {}

	@Query(() => [Property], { name: 'properties' })
	async findAll(
		@Args('city', { nullable: true }) city?: string,
		@Args('district', { nullable: true }) district?: string,
		@Args('status', { nullable: true }) status?: PropertyStatus,
		@Args('isRecommended', { nullable: true }) isRecommended?: boolean,
		@Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0 }) skip?: number,
	) {
		return this.propertyService.findAll({
			city,
			district,
			status,
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

	@Mutation(() => Property)
	async createProperty(
		@Args('propertyName') propertyName: string,
		@Args('location') location: any,
		@Args('propertyType', { nullable: true }) propertyType?: PropertyType,
		@Args('propertyDescription', { nullable: true })
		propertyDescription?: string,
		@Args('hourlyRate', { nullable: true, defaultValue: 0 })
		hourlyRate?: number,
	) {
		return this.propertyService.createProperty({
			propertyName,
			location,
			propertyType,
			propertyDescription,
			hourlyRate,
		});
	}

	@Mutation(() => Property)
	async updateProperty(
		@Args('id', { type: () => ID }) id: string,
		@Args('updateData') updateData: any,
	) {
		return this.propertyService.updateProperty(id, updateData);
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

