import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import  { MatchStatus } from '../../schemas/Match.model';
import { Match } from '../../schemas/Match.graphql';

@Injectable()
export class MatchService {
	constructor(
		@InjectModel('Match') private readonly matchModel: Model<Match>,
	) {}

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
		}

		const match = new this.matchModel(createMatchDto);
		return match.save();
	}

	async findAll(filters?: {
		status?: MatchStatus;
		city?: string;
		district?: string;
		date?: Date;
		limit?: number;
		skip?: number;
	}): Promise<Match[]> {
		const query: any = { deletedAt: null };

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

		return this.matchModel
			.find(query)
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.populate('fieldId', 'propertyName location images')
			.sort({ matchDate: 1 })
			.limit(filters?.limit || 20)
			.skip(filters?.skip || 0)
			.exec();
	}

	async findOne(id: string): Promise<Match> {
		const match = await this.matchModel
			.findById(id)
			.populate('organizerId')
			.populate('fieldId')
			.populate('joinedPlayers', 'memberNick memberFullName memberImage')
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
		const match = await this.matchModel.findByIdAndUpdate(
			id,
			{ $set: updateDto },
			{ new: true },
		);

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		return match;
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

		return match.save();
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

		return match.save();
	}

	async likeMatch(matchId: string, memberId: string): Promise<Match> {
		const match = await this.matchModel.findById(matchId);

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		if (match.likedBy.includes(memberId as any)) {
			// Unlike
			match.likedBy = match.likedBy.filter(
				(id) => id.toString() !== memberId,
			);
			match.likes = Math.max(0, match.likes - 1);
		} else {
			// Like
			match.likedBy.push(memberId as any);
			match.likes += 1;
		}

		return match.save();
	}

	async deleteMatch(id: string): Promise<boolean> {
		const result = await this.matchModel.findByIdAndUpdate(id, {
			deletedAt: new Date(),
		});

		return !!result;
	}

	async getMatchesByOrganizer(organizerId: string): Promise<Match[]> {
		return this.matchModel
			.find({ organizerId, deletedAt: null })
			.populate('fieldId')
			.sort({ matchDate: -1 })
			.exec();
	}

	async getUpcomingMatches(limit: number = 10): Promise<Match[]> {
		return this.matchModel
			.find({
				matchStatus: MatchStatus.UPCOMING,
				matchDate: { $gte: new Date() },
				deletedAt: null,
			})
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.populate('fieldId', 'propertyName location images')
			.sort({ matchDate: 1 })
			.limit(limit)
			.exec();
	}

	async getMyJoinedMatches(memberId: string): Promise<Match[]> {
		return this.matchModel
			.find({
				joinedPlayers: memberId,
				deletedAt: null,
			})
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.populate('fieldId', 'propertyName location images')
			.sort({ matchDate: 1 })
			.exec();
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

		return this.matchModel
			.find(query)
			.populate('organizerId', 'memberNick memberFullName memberImage')
			.populate('fieldId', 'propertyName location images')
			.sort({ matchDate: 1 })
			.limit(filters.limit || 20)
			.skip(filters.skip || 0)
			.exec();
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

		return match;
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
		return match.save();
	}
}

