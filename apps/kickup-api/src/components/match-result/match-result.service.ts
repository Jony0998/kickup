import {
	Injectable,
	NotFoundException,
	ConflictException,
	BadRequestException,
	ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MatchResult, MatchResultStatus, Goal } from '../../schemas/MatchResult.model';
import { Match, MatchStatus } from '../../schemas/Match.model';
import { PlayerStatistics } from '../../schemas/PlayerStatistics.model';
import { Message } from '../../libs/enums/common.enum';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MatchResultService {
	constructor(
		@InjectModel('MatchResult')
		private readonly matchResultModel: Model<MatchResult>,
		@InjectModel('Match') private readonly matchModel: Model<Match>,
		@InjectModel('PlayerStatistics')
		private readonly playerStatsModel: Model<PlayerStatistics>,
		private readonly notificationService: NotificationService,
	) { }

	async createMatchResult(memberId: string, createResultDto: any): Promise<MatchResult> {
		// Check if match exists
		const match = await this.matchModel.findById(createResultDto.matchId);
		if (!match || match.deletedAt) {
			throw new NotFoundException('Match not found');
		}

		// Check if result already exists
		const existingResult = await this.matchResultModel.findOne({
			matchId: createResultDto.matchId,
			deletedAt: null,
		});

		if (existingResult) {
			throw new ConflictException('Match result already exists');
		}

		// Parse goals if provided as JSON string
		let goals: Goal[] = [];
		if (createResultDto.goals) {
			if (typeof createResultDto.goals === 'string') {
				goals = JSON.parse(createResultDto.goals);
			} else {
				goals = createResultDto.goals;
			}
		}

		// Create match result
		const matchResult = new this.matchResultModel({
			...createResultDto,
			goals,
			createdBy: memberId,
			resultStatus: MatchResultStatus.PENDING,
			weather: createResultDto.temperature || createResultDto.weatherCondition
				? {
					temperature: createResultDto.temperature,
					condition: createResultDto.weatherCondition,
				}
				: undefined,
		});

		const savedResult = await matchResult.save();

		// Update match status to COMPLETED
		match.matchStatus = MatchStatus.COMPLETED;
		await match.save();

		// Update player statistics
		await this.updatePlayerStatistics(savedResult);

		return savedResult;
	}

	async findOne(matchId: string): Promise<MatchResult> {
		const result = await this.matchResultModel
			.findOne({ matchId, deletedAt: null })
			.populate('matchId')
			.populate('homeTeamId')
			.populate('awayTeamId')
			.populate('goals.playerId', 'memberNick memberFullName memberImage')
			.populate('goals.assistPlayerId', 'memberNick memberFullName memberImage')
			.populate('refereeId', 'memberNick memberFullName memberImage')
			.exec();

		if (!result) {
			throw new NotFoundException('Match result not found');
		}

		return result;
	}

	async confirmResult(matchId: string, memberId: string): Promise<MatchResult> {
		const result = await this.matchResultModel.findOne({
			matchId,
			deletedAt: null,
		});

		if (!result) {
			throw new NotFoundException('Match result not found');
		}

		// Check if already confirmed by this member
		if (result.confirmedBy?.some((id) => id.toString() === memberId)) {
			throw new BadRequestException('Result already confirmed by you');
		}

		// Add to confirmedBy
		if (!result.confirmedBy) {
			result.confirmedBy = [];
		}
		result.confirmedBy.push(memberId as any);

		// If confirmed by organizer or both teams, mark as CONFIRMED
		const match = await this.matchModel.findById(matchId);
		if (
			match &&
			(result.confirmedBy.length >= 2 ||
				match.organizerId.toString() === memberId)
		) {
			result.resultStatus = MatchResultStatus.CONFIRMED;
		}

		return result.save();
	}

	async disputeResult(
		matchId: string,
		memberId: string,
		reason: string,
	): Promise<MatchResult> {
		const result = await this.matchResultModel.findOne({
			matchId,
			deletedAt: null,
		});

		if (!result) {
			throw new NotFoundException('Match result not found');
		}

		result.resultStatus = MatchResultStatus.DISPUTED;
		result.disputedBy = memberId as any;
		result.disputeReason = reason;

		return result.save();
	}

	async updateResult(
		matchId: string,
		memberId: string,
		updateData: any,
	): Promise<MatchResult> {
		const result = await this.matchResultModel.findOne({
			matchId,
			deletedAt: null,
		});

		if (!result) {
			throw new NotFoundException('Match result not found');
		}

		// Only creator or referee can update
		if (
			result.createdBy.toString() !== memberId &&
			result.refereeId?.toString() !== memberId
		) {
			throw new ForbiddenException('Only creator or referee can update result');
		}

		// Parse goals if provided
		if (updateData.goals) {
			if (typeof updateData.goals === 'string') {
				updateData.goals = JSON.parse(updateData.goals);
			}
		}

		Object.assign(result, updateData);
		const savedResult = await result.save();

		// Update player statistics
		await this.updatePlayerStatistics(savedResult);

		return savedResult;
	}

	private async updatePlayerStatistics(result: MatchResult): Promise<void> {
		// 1. Determine Win/Loss/Draw status
		let homeStatus: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
		let awayStatus: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';

		if (result.homeScore > result.awayScore) {
			homeStatus = 'WIN';
			awayStatus = 'LOSS';
		} else if (result.awayScore > result.homeScore) {
			homeStatus = 'LOSS';
			awayStatus = 'WIN';
		}

		// 2. Get all participating players
		const playerIds = new Set<string>();
		result.homePlayers?.forEach((id) => playerIds.add(id.toString()));
		result.awayPlayers?.forEach((id) => playerIds.add(id.toString()));

		// 3. Update stats for each player
		for (const playerId of playerIds) {
			const stats = await this.playerStatsModel.findOneAndUpdate(
				{ memberId: playerId },
				{ $setOnInsert: { memberId: playerId } },
				{ upsert: true, new: true },
			);

			const member = await this.matchModel.db.model('Member').findById(playerId);
			if (!member) continue;

			// Determine if player was in Home or Away team
			const isHome = result.homePlayers?.some((id) => id.toString() === playerId);
			const matchStatus = isHome ? homeStatus : awayStatus;

			// Update W/L/D counts
			if (matchStatus === 'WIN') stats.matchesWon += 1;
			else if (matchStatus === 'LOSS') stats.matchesLost += 1;
			else stats.matchesDrawn += 1;

			stats.totalMatches += 1;

			// Count goals and assists for this player in this match
			const playerGoals = result.goals?.filter(
				(g) => g.playerId.toString() === playerId && !g.isOwnGoal,
			).length || 0;
			const playerAssists = result.goals?.filter(
				(g) => g.assistPlayerId?.toString() === playerId,
			).length || 0;

			stats.totalGoals += playerGoals;
			stats.totalAssists += playerAssists;

			// Calculate Points for this match
			let matchPoints = 0;
			if (matchStatus === 'WIN') matchPoints += 30; // 30 points for win
			else if (matchStatus === 'DRAW') matchPoints += 10; // 10 points for draw

			matchPoints += playerGoals * 15; // 15 points per goal
			matchPoints += playerAssists * 10; // 10 points per assist

			// Update Member model (Points and Rank/Level)
			member.memberPoints += matchPoints;

			// Simple Leveling Logic
			this.updateSkillLevel(member);

			stats.lastMatchDate = new Date();
			if (playerGoals > 0) stats.lastGoalDate = new Date();
			stats.streakMatches += 1;

			await Promise.all([stats.save(), member.save()]);
		}

		// 4. Notify all players about the result
		try {
			await Promise.all(
				Array.from(playerIds).map((playerId) =>
					this.notificationService.notifyMatchResult(playerId, result.matchId.toString(), {
						homeScore: result.homeScore,
						awayScore: result.awayScore,
					}),
				),
			);
		} catch (error) {
			console.error('Failed to send result notifications:', error);
		}
	}

	private updateSkillLevel(member: any): void {
		const points = member.memberPoints;
		const SkillLevel = this.matchModel.db.model('Member').schema.path('memberSkillLevel').options.enum;

		if (points >= 5000) member.memberSkillLevel = 'ELITE';
		else if (points >= 2500) member.memberSkillLevel = 'PRO';
		else if (points >= 1000) member.memberSkillLevel = 'SEMI_PRO';
		else if (points >= 300) member.memberSkillLevel = 'AMATEUR';
		else member.memberSkillLevel = 'ROOKIE';
	}
}

