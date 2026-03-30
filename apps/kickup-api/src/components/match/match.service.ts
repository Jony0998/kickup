import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Match, MatchStatus } from '../../schemas/Match.model';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MatchService {
	// In-memory cache to reduce DB load on repeated navigation (GraphQL is POST so CDN/browser cache doesn't apply)
	private static readonly matchListCache = new Map<string, { value: any; expiresAt: number }>();
	private static readonly MATCH_LIST_CACHE_TTL_MS =
		parseInt(process.env.MATCH_LIST_CACHE_TTL_MS ?? '8000', 10); // default 8s

	private static getCached<T>(key: string): T | null {
		const cached = this.matchListCache.get(key);
		if (!cached) return null;
		if (Date.now() > cached.expiresAt) {
			this.matchListCache.delete(key);
			return null;
		}
		return cached.value as T;
	}

	private static setCached<T>(key: string, value: T): void {
		this.matchListCache.set(key, {
			value,
			expiresAt: Date.now() + this.MATCH_LIST_CACHE_TTL_MS,
		});
	}

	private static clearCachedByPrefix(prefix: string): void {
		for (const key of this.matchListCache.keys()) {
			if (key.startsWith(prefix)) this.matchListCache.delete(key);
		}
	}

	constructor(
		@InjectModel('Match') private readonly matchModel: Model<Match>,
		private readonly notificationService: NotificationService,
	) { }

	private normalizeLikedByArray(matches: any[]): any[] {
		// GraphQL schema expects `likedBy?: string[]`, while Mongo stores refs as ObjectId.
		return (matches || []).map((m) => {
			if (Array.isArray(m?.likedBy)) {
				m.likedBy = m.likedBy
					.map((id) => (id as any)?.toString ? (id as any).toString() : String(id))
					.filter((id) => !!id);
			}
			return m;
		});
	}

	private async getPopulatedMatch(id: string): Promise<Match> {
		if (!isValidObjectId(id)) return null;
		const match = await this.matchModel
			.findById(id)
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.populate('fieldId', 'propertyName location images rating')
			.populate('joinedPlayers', 'memberNick memberFullName memberImage')
			.populate('checkedInPlayers', 'memberNick memberFullName memberImage')
			.lean()
			.exec();
		if (!match) return match;
		// GraphQL schema expects `likedBy?: string[]`, but Mongo stores ObjectId refs.
		match.likedBy = (match.likedBy || [])
			.map((id) => (id as any)?.toString ? (id as any).toString() : String(id))
			.filter((id) => !!id);
		return match as any;
	}

	async createMatch(createMatchDto: any): Promise<Match> {
		// If fieldId is provided, populate location from field
		if (createMatchDto.fieldId && !createMatchDto.location) {
			const Property = this.matchModel.db.model('Property');
			const field = await Property.findById(createMatchDto.fieldId);
			if (field && field.location) {
				createMatchDto.location = {
					address: field.location.address,
					city: field.location.city,
					district: field.location.district,
					coordinates: field.location.coordinates,
				};
			}
		} else if (createMatchDto.address && !createMatchDto.location) {
			createMatchDto.location = {
				address: createMatchDto.address,
			};
		}

		// Auto-add organizer as first participant
		if (createMatchDto.organizerId) {
			createMatchDto.joinedPlayers = [createMatchDto.organizerId];
			createMatchDto.currentPlayers = 1;
		}

		// First image as matchImage for backward compatibility
		if (createMatchDto.images?.length && !createMatchDto.matchImage) {
			createMatchDto.matchImage = createMatchDto.images[0];
		}

		const match = new this.matchModel(createMatchDto);
		await match.save();
		MatchService.clearCachedByPrefix('matches:');
		return this.getPopulatedMatch(String(match._id));
	}

	async findAll(filters?: {
		status?: MatchStatus;
		city?: string;
		district?: string;
		date?: Date;
		limit?: number;
		skip?: number;
	}): Promise<Match[]> {
		const startedAt = Date.now();
		const cacheKey = `matches:findAll:${JSON.stringify(filters ?? {})}`;
		const cached = MatchService.getCached<Match[]>(cacheKey);
		if (cached) {
			if (process.env.DEBUG_TIMING === '1') console.log(`[MatchService.findAll cache] 0ms`);
			return cached;
		}
		// Some historical documents may have `matchDate` missing/invalid types.
		// GraphQL schema treats `matchDate` as non-nullable, so we filter them out.
		const query: any = {
			deletedAt: null,
			matchDate: { $ne: null, $exists: true, $type: 'date' },
		};

		if (filters?.status) {
			query.matchStatus = filters.status;
		}

		if (filters?.city) {
			query['location.city'] = filters.city;
		}

		if (filters?.district) {
			query['location.district'] = filters.district;
		}

		if (filters?.date) {
			const startOfDay = new Date(filters.date);
			startOfDay.setHours(0, 0, 0, 0);
			const endOfDay = new Date(filters.date);
			endOfDay.setHours(23, 59, 59, 999);
			query.matchDate = { $gte: startOfDay, $lte: endOfDay };
		}

		const result: any = await this.matchModel
			.find(query)
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.populate('fieldId', 'propertyName location images rating')
			.sort({ matchDate: 1 })
			.limit(filters?.limit || 20)
			.skip(filters?.skip || 0)
			.lean()
			.exec();
		const normalized = this.normalizeLikedByArray(result);
		if (process.env.DEBUG_TIMING === '1') {
			console.log(`[MatchService.findAll] ${Date.now() - startedAt}ms`);
		}
		MatchService.setCached(cacheKey, normalized);
		return normalized as Match[];
	}

	async findOne(id: string): Promise<Match> {
		if (!isValidObjectId(id)) {
			throw new NotFoundException('Match not found (Invalid ID)');
		}
		const match = await this.matchModel
			.findById(id)
			.populate('organizerId')
			.populate('fieldId')
			.populate('joinedPlayers', 'memberNick memberFullName memberImage')
			.populate('checkedInPlayers', 'memberNick memberFullName memberImage')
			.exec();

		if (!match || (match as any).deletedAt) {
			throw new NotFoundException('Match not found');
		}

		// Increment views
		match.views += 1;
		await match.save();

		return match;
	}

	async updateMatch(id: string, updateDto: any): Promise<Match> {
		await this.matchModel.findByIdAndUpdate(
			id,
			{ $set: updateDto },
			{ new: true },
		);
		MatchService.clearCachedByPrefix('matches:');

		return this.getPopulatedMatch(id);
	}

	async joinMatch(matchId: string, memberId: string): Promise<Match> {
		const match = await this.matchModel.findById(matchId);

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		if (match.matchStatus !== MatchStatus.UPCOMING) {
			throw new Error('Cannot join match that is not upcoming');
		}

		if (match.currentPlayers >= match.maxPlayers) {
			throw new Error('Match is full');
		}

		if (match.joinedPlayers.some((id) => id.toString() === memberId)) {
			throw new Error('Already joined this match');
		}

		// Check if user is the organizer
		if (match.organizerId.toString() === memberId) {
			throw new Error('Organizer is automatically in the match');
		}

		match.joinedPlayers.push(memberId as any);
		match.currentPlayers += 1;

		await match.save();
		MatchService.clearCachedByPrefix('matches:');

		// Trigger notification for organizer
		try {
			await this.notificationService.notifyMatchJoined(
				match.organizerId.toString(),
				matchId,
				memberId,
			);
		} catch (error) {
			console.error('Failed to send join notification:', error);
		}

		return this.getPopulatedMatch(matchId);
	}

	async leaveMatch(matchId: string, memberId: string): Promise<Match> {
		const match = await this.matchModel.findById(matchId);

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		match.joinedPlayers = match.joinedPlayers.filter(
			(id) => id.toString() !== memberId,
		);
		match.currentPlayers = Math.max(0, match.currentPlayers - 1);

		await match.save();
		MatchService.clearCachedByPrefix('matches:');

		// Trigger notification for organizer
		try {
			const memberModel = this.matchModel.db.model('Member');
			const leaver = await memberModel.findById(memberId);
			if (leaver && match.organizerId.toString() !== memberId) {
				await this.notificationService.createNotification({
					userId: match.organizerId.toString(),
					notificationType: 'MATCH_JOINED' as any,
					title: 'O\'yinchi tark etdi',
					message: `${leaver.memberNick} "${match.matchTitle}" matchini tark etdi`,
					relatedMatchId: matchId,
					relatedMemberId: memberId,
					actionUrl: `/match/${matchId}`,
				});
			}
		} catch (error) {
			console.error('Failed to send leave notification:', error);
		}

		return this.getPopulatedMatch(matchId);
	}

	async likeMatch(matchId: string, memberId: string): Promise<Match> {
		const match = await this.matchModel.findById(matchId);

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		// `likedBy` contains ObjectId refs, while `memberId` is a string.
		// Using `.includes(memberId)` breaks the toggle, so always compare by `toString()`.
		const likedByIds = (match.likedBy || [])
			.map((id) => id?.toString())
			.filter((id) => !!id);
		const alreadyLiked = likedByIds.some((id) => id === memberId);

		if (alreadyLiked) {
			// Unlike: remove all occurrences for safety.
			match.likedBy = likedByIds.filter((id) => id !== memberId) as any;
		} else {
			// Like: append and keep a single entry.
			match.likedBy = [...likedByIds, memberId] as any;
		}

		// Keep `likes` consistent with `likedBy` array.
		match.likes = (match.likedBy || []).length;

		await match.save();
		MatchService.clearCachedByPrefix('matches:');
		return this.getPopulatedMatch(matchId);
	}

	async deleteMatch(id: string): Promise<boolean> {
		const result = await this.matchModel.findByIdAndUpdate(id, {
			deletedAt: new Date(),
		});

		MatchService.clearCachedByPrefix('matches:');
		return !!result;
	}

	async getMatchesByOrganizer(organizerId: string): Promise<Match[]> {
		const startedAt = Date.now();
		const cacheKey = `matches:byOrganizer:${organizerId}`;
		const cached = MatchService.getCached<Match[]>(cacheKey);
		if (cached) {
			if (process.env.DEBUG_TIMING === '1') console.log(`[MatchService.getMatchesByOrganizer cache] 0ms`);
			return cached;
		}
		const result: any = await this.matchModel
			.find({
				organizerId,
				deletedAt: null,
				matchDate: { $ne: null, $exists: true, $type: 'date' },
			})
			.populate('fieldId')
			.sort({ matchDate: -1 })
			.lean()
			.exec();
		const normalized = this.normalizeLikedByArray(result);
		if (process.env.DEBUG_TIMING === '1') {
			console.log(`[MatchService.getMatchesByOrganizer] ${Date.now() - startedAt}ms organizerId=${organizerId}`);
		}
		MatchService.setCached(cacheKey, normalized);
		return normalized as Match[];
	}

	async getUpcomingMatches(limit: number = 10): Promise<Match[]> {
		const startedAt = Date.now();
		const cacheKey = `matches:upcoming:${limit}`;
		const cached = MatchService.getCached<Match[]>(cacheKey);
		if (cached) {
			if (process.env.DEBUG_TIMING === '1') console.log(`[MatchService.getUpcomingMatches cache] 0ms`);
			return cached;
		}
		const result: any = await this.matchModel
			.find({
				matchStatus: MatchStatus.UPCOMING,
				matchDate: { $gte: new Date() },
				deletedAt: null,
			})
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.populate('fieldId', 'propertyName location images rating')
			.sort({ matchDate: 1 })
			.limit(limit)
			.lean()
			.exec();
		const normalized = this.normalizeLikedByArray(result);
		if (process.env.DEBUG_TIMING === '1') {
			console.log(`[MatchService.getUpcomingMatches] ${Date.now() - startedAt}ms limit=${limit}`);
		}
		MatchService.setCached(cacheKey, normalized);
		return normalized as Match[];
	}

	async getMyJoinedMatches(memberId: string): Promise<Match[]> {
		const startedAt = Date.now();
		const cacheKey = `matches:myJoined:${memberId}`;
		const cached = MatchService.getCached<Match[]>(cacheKey);
		if (cached) {
			if (process.env.DEBUG_TIMING === '1') console.log(`[MatchService.getMyJoinedMatches cache] 0ms`);
			return cached;
		}
		const result: any = await this.matchModel
			.find({
				joinedPlayers: memberId,
				deletedAt: null,
				matchDate: { $ne: null, $exists: true, $type: 'date' },
			})
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.populate('fieldId', 'propertyName location images rating')
			.sort({ matchDate: 1 })
			.lean()
			.exec();
		const normalized = this.normalizeLikedByArray(result);
		if (process.env.DEBUG_TIMING === '1') {
			console.log(`[MatchService.getMyJoinedMatches] ${Date.now() - startedAt}ms memberId=${memberId}`);
		}
		MatchService.setCached(cacheKey, normalized);
		return normalized as Match[];
	}

	async searchMatches(filters: {
		city?: string;
		district?: string;
		dateFrom?: Date;
		dateTo?: Date;
		skillLevel?: string;
		maxFee?: number;
		minPlayers?: number;
		limit?: number;
		skip?: number;
	}): Promise<Match[]> {
		const startedAt = Date.now();
		const cacheKey = `matches:search:${JSON.stringify(filters ?? {})}`;
		const cached = MatchService.getCached<Match[]>(cacheKey);
		if (cached) {
			if (process.env.DEBUG_TIMING === '1') console.log(`[MatchService.searchMatches cache] 0ms`);
			return cached;
		}
		const query: any = {
			matchStatus: MatchStatus.UPCOMING,
			matchDate: { $gte: new Date() },
			deletedAt: null,
		};

		if (filters.city) {
			query['location.city'] = filters.city;
		}

		if (filters.district) {
			query['location.district'] = filters.district;
		}

		if (filters.dateFrom || filters.dateTo) {
			query.matchDate = {};
			if (filters.dateFrom) {
				query.matchDate.$gte = filters.dateFrom;
			}
			if (filters.dateTo) {
				query.matchDate.$lte = filters.dateTo;
			}
		}

		if (filters.skillLevel) {
			query.skillLevel = filters.skillLevel;
		}

		if (filters.maxFee !== undefined) {
			query.matchFee = { $lte: filters.maxFee };
		}

		if (filters.minPlayers !== undefined) {
			query.currentPlayers = { $gte: filters.minPlayers };
		}

		const result: any = await this.matchModel
			.find(query)
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.populate('fieldId', 'propertyName location images rating')
			.sort({ matchDate: 1 })
			.limit(filters.limit || 20)
			.skip(filters.skip || 0)
			.lean()
			.exec();
		const normalized = this.normalizeLikedByArray(result);
		if (process.env.DEBUG_TIMING === '1') {
			console.log(`[MatchService.searchMatches] ${Date.now() - startedAt}ms`);
		}
		MatchService.setCached(cacheKey, normalized);
		return normalized as Match[];
	}

	async updateMatchStatus(
		matchId: string,
		status: MatchStatus,
	): Promise<Match> {
		const match = await this.matchModel.findByIdAndUpdate(
			matchId,
			{ matchStatus: status },
			{ new: true },
		);

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		MatchService.clearCachedByPrefix('matches:');
		return this.getPopulatedMatch(matchId);
	}

	async cancelMatch(matchId: string, organizerId: string): Promise<Match> {
		const match = await this.matchModel.findById(matchId);

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		if (match.organizerId.toString() !== organizerId) {
			throw new Error('Only organizer can cancel the match');
		}

		match.matchStatus = MatchStatus.CANCELLED;
		await match.save();
		MatchService.clearCachedByPrefix('matches:');

		// Notify all joined players
		try {
			const playerIds = match.joinedPlayers.filter(id => id.toString() !== organizerId);
			await Promise.all(
				playerIds.map(playerId =>
					this.notificationService.notifyMatchCancelled(playerId.toString(), matchId)
				)
			);
		} catch (error) {
			console.error('Failed to send cancel notifications:', error);
		}

		return this.getPopulatedMatch(matchId);
	}

	async checkIn(matchId: string, memberId: string): Promise<Match> {
		const match = await this.matchModel.findById(matchId);

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		if (!match.joinedPlayers.some((id) => id.toString() === memberId)) {
			throw new Error('Member is not in the joined players list');
		}

		// Initialize checkedInPlayers if it doesn't exist
		if (!match.checkedInPlayers) {
			match.checkedInPlayers = [];
		}

		if (match.checkedInPlayers.some((id) => id.toString() === memberId)) {
			// Already checked in, just return match
			return this.getPopulatedMatch(matchId);
		}

		match.checkedInPlayers.push(memberId as any);
		await match.save();
		MatchService.clearCachedByPrefix('matches:');
		return this.getPopulatedMatch(matchId);
	}
}

