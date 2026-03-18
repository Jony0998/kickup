import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlayerStatistics } from '../../schemas/PlayerStatistics.model';

@Injectable()
export class PlayerStatisticsService {
	constructor(
		@InjectModel('PlayerStatistics')
		private readonly playerStatsModel: Model<PlayerStatistics>,
	) {}

	async getPlayerStatistics(memberId: string): Promise<PlayerStatistics> {
		let stats = await this.playerStatsModel
			.findOne({ memberId, deletedAt: null })
			.populate('memberId', 'memberNick memberFullName memberImage')
			.exec();

		if (!stats) {
			// Create default statistics if not exists
			stats = new this.playerStatsModel({ memberId });
			await stats.save();
		}

		return stats;
	}

	async getTopScorers(limit = 10): Promise<PlayerStatistics[]> {
		return this.playerStatsModel
			.find({ deletedAt: null })
			.populate('memberId', 'memberNick memberFullName memberImage')
			.sort({ totalGoals: -1 })
			.limit(limit)
			.exec();
	}

	async getTopAssists(limit = 10): Promise<PlayerStatistics[]> {
		return this.playerStatsModel
			.find({ deletedAt: null })
			.populate('memberId', 'memberNick memberFullName memberImage')
			.sort({ totalAssists: -1 })
			.limit(limit)
			.exec();
	}

	async getTopRated(limit = 10): Promise<PlayerStatistics[]> {
		return this.playerStatsModel
			.find({ deletedAt: null, totalRatings: { $gt: 0 } })
			.populate('memberId', 'memberNick memberFullName memberImage')
			.sort({ averageRating: -1 })
			.limit(limit)
			.exec();
	}

	async getMostMatches(limit = 10): Promise<PlayerStatistics[]> {
		return this.playerStatsModel
			.find({ deletedAt: null })
			.populate('memberId', 'memberNick memberFullName memberImage')
			.sort({ totalMatches: -1 })
			.limit(limit)
			.exec();
	}
}

