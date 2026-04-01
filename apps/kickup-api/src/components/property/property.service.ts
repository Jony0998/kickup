import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Property, PropertyStatus, PropertyType } from '../../schemas/Property.model';

@Injectable()
export class PropertyService {
	// In-memory cache to reduce DB load on repeated navigation
	private static readonly propertyListCache = new Map<
		string,
		{ value: Property[]; expiresAt: number }
	>();
	private static readonly PROPERTY_LIST_CACHE_TTL_MS = parseInt(
		process.env.PROPERTY_LIST_CACHE_TTL_MS ?? '8000',
		10,
	); // default 8s

	private static getCached(key: string): Property[] | null {
		const cached = this.propertyListCache.get(key);
		if (!cached) return null;
		if (Date.now() > cached.expiresAt) {
			this.propertyListCache.delete(key);
			return null;
		}
		return cached.value;
	}

	private static setCached(key: string, value: Property[]): void {
		this.propertyListCache.set(key, {
			value,
			expiresAt: Date.now() + this.PROPERTY_LIST_CACHE_TTL_MS,
		});
	}

	private static clearCachedByPrefix(prefix: string): void {
		for (const key of this.propertyListCache.keys()) {
			if (key.startsWith(prefix)) this.propertyListCache.delete(key);
		}
	}

	constructor(
		@InjectModel('Property') private readonly propertyModel: Model<Property>,
	) { }

	async createProperty(createPropertyDto: any): Promise<Property> {
		const property = new this.propertyModel(createPropertyDto);
		const saved = await property.save();
		PropertyService.clearCachedByPrefix('properties:');
		return saved;
	}

	async findAll(filters?: {
		ownerId?: string;
		city?: string;
		district?: string;
		status?: PropertyStatus;
		type?: PropertyType;
		isRecommended?: boolean;
		limit?: number;
		skip?: number;
	}): Promise<Property[]> {
		const cacheKey = `properties:findAll:${JSON.stringify(filters ?? {})}`;
		const cached = PropertyService.getCached(cacheKey);
		if (cached) return cached;
		const query: any = { deletedAt: null };

		if (filters?.type) {
			query.propertyType = filters.type;
		}

		if (filters?.status) {
			query.propertyStatus = filters.status;
		}

		if (filters?.ownerId) {
			query.ownerId = filters.ownerId;
		}

		if (filters?.city) {
			query['location.city'] = filters.city;
		}

		if (filters?.district) {
			query['location.district'] = filters.district;
		}

		if (filters?.isRecommended !== undefined) {
			query.isRecommended = filters.isRecommended;
		}

		const result = await this.propertyModel
			.find(query)
			.populate('ownerId', 'memberNick memberFullName memberImage')
			.sort({ isRecommended: -1, bookings: -1 })
			.limit(filters?.limit || 20)
			.skip(filters?.skip || 0)
			.lean()
			.exec();
		PropertyService.setCached(cacheKey, result as any);
		return result as any;
	}

	async findOne(id: string): Promise<Property> {
		if (!isValidObjectId(id)) {
			throw new NotFoundException('Property not found (Invalid ID)');
		}
		const property = await this.propertyModel
			.findById(id)
			.populate('ownerId')
			.exec();

		if (!property || property.deletedAt) {
			throw new NotFoundException('Property not found');
		}

		// Increment views
		property.views += 1;
		await property.save();

		return property;
	}

	async updateProperty(id: string, updateDto: any): Promise<Property> {
		const property = await this.propertyModel.findByIdAndUpdate(
			id,
			{ $set: updateDto },
			{ new: true },
		);

		if (!property) {
			throw new NotFoundException('Property not found');
		}

		PropertyService.clearCachedByPrefix('properties:');
		return property;
	}

	async deleteProperty(id: string): Promise<boolean> {
		const result = await this.propertyModel.findByIdAndUpdate(id, {
			deletedAt: new Date(),
		});
		PropertyService.clearCachedByPrefix('properties:');
		return !!result;
	}

	async getRecommendedProperties(limit: number = 10): Promise<Property[]> {
		const cacheKey = `properties:recommended:${limit}`;
		const cached = PropertyService.getCached(cacheKey);
		if (cached) return cached;
		const result = await this.propertyModel
			.find({
				isRecommended: true,
				propertyStatus: PropertyStatus.ACTIVE,
				deletedAt: null,
			})
			.sort({ bookings: -1, rating: -1 })
			.limit(limit)
			.lean()
			.exec();
		PropertyService.setCached(cacheKey, result as any);
		return result as any;
	}

	async searchByLocation(
		city: string,
		district?: string,
		limit: number = 20,
	): Promise<Property[]> {
		const query: any = {
			'location.city': city,
			propertyStatus: PropertyStatus.ACTIVE,
			deletedAt: null,
		};

		if (district) {
			query['location.district'] = district;
		}

		return this.propertyModel.find(query).limit(limit).exec();
	}

	async incrementBookings(id: string): Promise<Property> {
		const property = await this.propertyModel.findById(id);
		if (!property) {
			throw new NotFoundException('Property not found');
		}
		property.bookings += 1;
		const saved = await property.save();
		PropertyService.clearCachedByPrefix('properties:');
		return saved;
	}

	/**
	 * Find properties near a location (geolocation search)
	 * @param lat - Latitude
	 * @param lng - Longitude
	 * @param radiusKm - Radius in kilometers (default: 10km)
	 * @param limit - Maximum number of results
	 */
	async findNearbyProperties(
		lat: number,
		lng: number,
		radiusKm: number = 10,
		limit: number = 20,
	): Promise<Property[]> {
		// Using MongoDB geospatial query
		// Note: Requires 2dsphere index on coordinates
		const properties = await this.propertyModel
			.find({
				'location.coordinates.lat': { $exists: true },
				'location.coordinates.lng': { $exists: true },
				propertyStatus: PropertyStatus.ACTIVE,
				deletedAt: null,
			})
			.exec();

		// Calculate distance and filter by radius
		const nearbyProperties = properties
			.map((property) => {
				if (
					!property.location?.coordinates?.lat ||
					!property.location?.coordinates?.lng
				) {
					return null;
				}

				const distance = this.calculateDistance(
					lat,
					lng,
					property.location.coordinates.lat,
					property.location.coordinates.lng,
				);

				return {
					property,
					distance,
				};
			})
			.filter((item) => item !== null && item.distance <= radiusKm)
			.sort((a, b) => a.distance - b.distance)
			.slice(0, limit)
			.map((item) => item.property);

		return nearbyProperties;
	}

	/**
	 * Calculate distance between two coordinates using Haversine formula
	 * @returns Distance in kilometers
	 */
	private calculateDistance(
		lat1: number,
		lng1: number,
		lat2: number,
		lng2: number,
	): number {
		const R = 6371; // Earth's radius in kilometers
		const dLat = this.toRad(lat2 - lat1);
		const dLng = this.toRad(lng2 - lng1);

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(this.toRad(lat1)) *
			Math.cos(this.toRad(lat2)) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distance = R * c;

		return Math.round(distance * 100) / 100; // Round to 2 decimal places
	}

	private toRad(degrees: number): number {
		return (degrees * Math.PI) / 180;
	}

	/**
	 * Search properties by city and sort by distance from a point
	 */
	async searchByLocationWithDistance(
		city: string,
		lat?: number,
		lng?: number,
		limit: number = 20,
	): Promise<Property[]> {
		const properties = await this.searchByLocation(city, undefined, limit);

		if (lat && lng) {
			// Sort by distance if coordinates provided
			return properties
				.map((property) => {
					if (
						!property.location?.coordinates?.lat ||
						!property.location?.coordinates?.lng
					) {
						return { property, distance: Infinity };
					}

					const distance = this.calculateDistance(
						lat,
						lng,
						property.location.coordinates.lat,
						property.location.coordinates.lng,
					);

					return { property, distance };
				})
				.sort((a, b) => a.distance - b.distance)
				.map((item) => item.property);
		}

		return properties;
	}
}

