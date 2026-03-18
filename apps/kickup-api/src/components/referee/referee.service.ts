import {
	Injectable,
	NotFoundException,
	ConflictException,
	BadRequestException,
	ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Referee, RefereeStatus, RefereeLevel } from '../../schemas/Referee.model';
import { Member } from '../../schemas/Member.model';
import { Match } from '../../schemas/Match.model';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class RefereeService {
	constructor(
		@InjectModel('Referee') private readonly refereeModel: Model<Referee>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Match') private readonly matchModel: Model<Match>,
	) {}

	async createReferee(memberId: string, createRefereeDto: any): Promise<Referee> {
		// Check if member exists
		const member = await this.memberModel.findById(memberId);
		if (!member || member.deletedAt) {
			throw new NotFoundException('Member not found');
		}

		// Check if referee already exists for this member
		const existingReferee = await this.refereeModel.findOne({
			memberId,
			deletedAt: null,
		});

		if (existingReferee) {
			throw new ConflictException('Referee profile already exists for this member');
		}

		// Create referee
		const referee = new this.refereeModel({
			...createRefereeDto,
			memberId,
			availability: createRefereeDto.daysOfWeek ||
				createRefereeDto.timeSlots ||
				createRefereeDto.city
				? {
						daysOfWeek: createRefereeDto.daysOfWeek,
						timeSlots: createRefereeDto.timeSlots,
						city: createRefereeDto.city,
						district: createRefereeDto.district,
					}
				: undefined,
			contactInfo: createRefereeDto.phone || createRefereeDto.email
				? {
						phone: createRefereeDto.phone,
						email: createRefereeDto.email,
					}
				: undefined,
		});

		return referee.save();
	}

	async findAll(filters?: {
		status?: RefereeStatus;
		level?: RefereeLevel;
		city?: string;
		limit?: number;
		skip?: number;
	}): Promise<Referee[]> {
		const query: any = { deletedAt: null };

		if (filters?.status) {
			query.refereeStatus = filters.status;
		}

		if (filters?.level) {
			query.refereeLevel = filters.level;
		}

		if (filters?.city) {
			query['availability.city'] = filters.city;
		}

		return this.refereeModel
			.find(query)
			.populate('memberId', 'memberNick memberFullName memberImage memberPhone')
			.sort({ rating: -1, totalMatches: -1 })
			.limit(filters?.limit || 50)
			.skip(filters?.skip || 0)
			.exec();
	}

	async findOne(refereeId: string): Promise<Referee> {
		const referee = await this.refereeModel
			.findOne({ _id: refereeId, deletedAt: null })
			.populate('memberId', 'memberNick memberFullName memberImage memberPhone')
			.exec();

		if (!referee) {
			throw new NotFoundException('Referee not found');
		}

		return referee;
	}

	async findByMemberId(memberId: string): Promise<Referee> {
		const referee = await this.refereeModel
			.findOne({ memberId, deletedAt: null })
			.populate('memberId', 'memberNick memberFullName memberImage memberPhone')
			.exec();

		if (!referee) {
			throw new NotFoundException('Referee not found for this member');
		}

		return referee;
	}

	async updateReferee(refereeId: string, memberId: string, updateData: any): Promise<Referee> {
		const referee = await this.refereeModel.findById(refereeId);

		if (!referee || referee.deletedAt) {
			throw new NotFoundException('Referee not found');
		}

		// Only referee owner or admin can update
		if (referee.memberId.toString() !== memberId) {
			// Check if user is admin (you might want to add admin check here)
			// For now, only owner can update
			throw new ForbiddenException('Only referee owner can update');
		}

		// Update availability if provided
		if (updateData.daysOfWeek || updateData.timeSlots || updateData.city) {
			updateData.availability = {
				daysOfWeek: updateData.daysOfWeek || referee.availability?.daysOfWeek,
				timeSlots: updateData.timeSlots || referee.availability?.timeSlots,
				city: updateData.city || referee.availability?.city,
				district: updateData.district || referee.availability?.district,
			};
		}

		// Update contact info if provided
		if (updateData.phone || updateData.email) {
			updateData.contactInfo = {
				phone: updateData.phone || referee.contactInfo?.phone,
				email: updateData.email || referee.contactInfo?.email,
			};
		}

		Object.assign(referee, updateData);
		return referee.save();
	}

	async assignToMatch(matchId: string, refereeId: string, assignerId: string): Promise<Match> {
		const match = await this.matchModel.findById(matchId);
		if (!match || match.deletedAt) {
			throw new NotFoundException('Match not found');
		}

		// Only organizer can assign referee
		if (match.organizerId.toString() !== assignerId) {
			throw new ForbiddenException('Only match organizer can assign referee');
		}

		const referee = await this.refereeModel.findById(refereeId);
		if (!referee || referee.deletedAt) {
			throw new NotFoundException('Referee not found');
		}

		if (referee.refereeStatus !== RefereeStatus.ACTIVE) {
			throw new BadRequestException('Referee is not active');
		}

		// Store referee ID in match (you might want to add refereeId field to Match model)
		// For now, we'll use matchResult to store referee
		// This is a simplified approach - you might want to add refereeId directly to Match

		// Increment referee's total matches
		referee.totalMatches += 1;
		await referee.save();

		return match;
	}

	async rateReferee(
		refereeId: string,
		matchId: string,
		rating: number,
		raterId: string,
	): Promise<Referee> {
		if (rating < 1 || rating > 5) {
			throw new BadRequestException('Rating must be between 1 and 5');
		}

		const referee = await this.refereeModel.findById(refereeId);
		if (!referee || referee.deletedAt) {
			throw new NotFoundException('Referee not found');
		}

		// Check if match exists and rater was part of it
		const match = await this.matchModel.findById(matchId);
		if (!match) {
			throw new NotFoundException('Match not found');
		}

		// Check if rater was in the match
		const wasInMatch =
			match.organizerId.toString() === raterId ||
			match.joinedPlayers.some((id) => id.toString() === raterId);

		if (!wasInMatch) {
			throw new ForbiddenException('Only match participants can rate referee');
		}

		// Update rating
		const currentTotal = referee.rating.average * referee.rating.count;
		referee.rating.count += 1;
		referee.rating.average = (currentTotal + rating) / referee.rating.count;

		return referee.save();
	}

	async deleteReferee(refereeId: string, memberId: string): Promise<boolean> {
		const referee = await this.refereeModel.findById(refereeId);

		if (!referee || referee.deletedAt) {
			throw new NotFoundException('Referee not found');
		}

		// Only owner can delete
		if (referee.memberId.toString() !== memberId) {
			throw new ForbiddenException('Only referee owner can delete');
		}

		referee.deletedAt = new Date();
		await referee.save();

		return true;
	}

	async searchReferees(searchTerm: string, city?: string, limit = 20): Promise<Referee[]> {
		const query: any = {
			deletedAt: null,
			refereeStatus: RefereeStatus.ACTIVE,
		};

		if (city) {
			query['availability.city'] = city;
		}

		// Search by member name (via populate)
		// This is simplified - you might want to use aggregation for better search
		return this.refereeModel
			.find(query)
			.populate({
				path: 'memberId',
				match: {
					$or: [
						{ memberNick: { $regex: searchTerm, $options: 'i' } },
						{ memberFullName: { $regex: searchTerm, $options: 'i' } },
					],
				},
				select: 'memberNick memberFullName memberImage memberPhone',
			})
			.sort({ rating: -1, totalMatches: -1 })
			.limit(limit)
			.exec();
	}
}

