import { Injectable, NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Member } from '../schemas/Member.model';
import { Match } from '../schemas/Match.model';
import { Property } from '../schemas/Property.model';
import { Booking } from '../schemas/Booking.model';
import { Review } from '../schemas/Review.model';
import { MemberType, MemberStatus, MemberAuthType } from '../libs/enums/member.enum';
import { Message } from '../libs/enums/common.enum';

@Injectable()
export class AdminService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Match') private readonly matchModel: Model<Match>,
		@InjectModel('Property') private readonly propertyModel: Model<Property>,
		@InjectModel('Booking') private readonly bookingModel: Model<Booking>,
		@InjectModel('Review') private readonly reviewModel: Model<Review>,
	) {}

	// ========== MEMBER MANAGEMENT ==========

	async getAllMembers(limit = 50, skip = 0) {
		return this.memberModel
			.find({ deletedAt: null })
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(skip)
			.exec();
	}

	async getMemberById(id: string) {
		const member = await this.memberModel.findOne({ _id: id, deletedAt: null });
		if (!member) {
			throw new NotFoundException(Message.NO_MEMBER_NICK);
		}
		return member;
	}

	async updateMemberType(memberId: string, memberType: MemberType, currentAdminId: string) {
		const member = await this.memberModel.findById(memberId);
		if (!member) {
			throw new NotFoundException(Message.NO_MEMBER_NICK);
		}

		// XAVFSIZLIK: ADMIN type'ni o'zgartirish MUTLAQO taqiqlangan
		if (memberType === MemberType.ADMIN) {
			throw new BadRequestException('Cannot set memberType to ADMIN via API. Admin can only be created once using createAdminWithSecret mutation with secret key.');
		}

		// XAVFSIZLIK: Mavjud admin'ni USER yoki AGENT ga o'zgartirish ham taqiqlangan
		if (member.memberType === MemberType.ADMIN) {
			throw new BadRequestException('Cannot change existing admin memberType. Admin type is permanent.');
		}

		// Faqat USER va AGENT ga o'zgartirish mumkin
		if (memberType !== MemberType.USER && memberType !== MemberType.AGENT) {
			throw new BadRequestException('Can only change memberType to USER or AGENT');
		}

		member.memberType = memberType;
		return member.save();
	}

	// Admin yaratish uchun secret key bilan - FAQAT BIR MARTA
	async createAdminWithSecret(
		memberPhone: string,
		memberNick: string,
		memberPassword: string,
		memberFullName: string,
		secretKey: string,
	) {
		// Secret key tekshirish
		const validSecretKey = process.env.ADMIN_SECRET_KEY;
		if (!validSecretKey) {
			throw new Error('ADMIN_SECRET_KEY env o\'rnatilmagan! Server konfiguratsiyasini tekshiring.');
		}
		if (secretKey !== validSecretKey) {
			throw new BadRequestException('Invalid admin secret key');
		}

		// XAVFSIZLIK: Agar allaqachon admin bor bo'lsa, yangi admin yaratishni rad etish
		const existingAdmin = await this.memberModel.findOne({
			memberType: MemberType.ADMIN,
			deletedAt: null,
		});

		if (existingAdmin) {
			throw new BadRequestException('Admin already exists. Cannot create another admin. Use database directly if needed.');
		}

		// Check if member already exists
		const existingMember = await this.memberModel.findOne({
			$or: [
				{ memberPhone },
				{ memberNick },
			],
			deletedAt: null,
		});

		if (existingMember) {
			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(memberPassword, 10);

		// Create admin member
		const adminMember = new this.memberModel({
			memberPhone,
			memberNick,
			memberPassword: hashedPassword,
			memberFullName,
			memberType: MemberType.ADMIN,
			memberStatus: MemberStatus.ACTIVE,
			memberAuthType: MemberAuthType.PHONE,
		});

		return adminMember.save();
	}

	async blockMember(memberId: string) {
		const member = await this.memberModel.findById(memberId);
		if (!member) {
			throw new NotFoundException(Message.NO_MEMBER_NICK);
		}

		member.memberStatus = MemberStatus.BLOCK;
		return member.save();
	}

	async unblockMember(memberId: string) {
		const member = await this.memberModel.findById(memberId);
		if (!member) {
			throw new NotFoundException(Message.NO_MEMBER_NICK);
		}

		member.memberStatus = MemberStatus.ACTIVE;
		return member.save();
	}

	async deleteMember(memberId: string) {
		const member = await this.memberModel.findById(memberId);
		if (!member) {
			throw new NotFoundException(Message.NO_MEMBER_NICK);
		}

		member.deletedAt = new Date();
		return member.save();
	}

	// ========== MATCH MANAGEMENT ==========

	async getAllMatches(limit = 50, skip = 0) {
		return this.matchModel
			.find({ deletedAt: null })
			.populate('fieldId', 'propertyName')
			.populate('organizerId', 'memberNick memberFullName')
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(skip)
			.exec();
	}

	async deleteMatch(matchId: string) {
		const match = await this.matchModel.findById(matchId);
		if (!match) {
			throw new NotFoundException('Match not found');
		}

		match.deletedAt = new Date();
		return match.save();
	}

	// ========== PROPERTY MANAGEMENT ==========

	async getAllProperties(limit = 50, skip = 0) {
		return this.propertyModel
			.find({ deletedAt: null })
			.populate('ownerId', 'memberNick memberFullName')
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(skip)
			.exec();
	}

	async deleteProperty(propertyId: string) {
		const property = await this.propertyModel.findById(propertyId);
		if (!property) {
			throw new NotFoundException('Property not found');
		}

		property.deletedAt = new Date();
		return property.save();
	}

	// ========== STATISTICS ==========

	async getStatistics() {
		const [
			totalMembers,
			activeMembers,
			blockedMembers,
			totalMatches,
			totalProperties,
			totalBookings,
			totalReviews,
		] = await Promise.all([
			this.memberModel.countDocuments({ deletedAt: null }),
			this.memberModel.countDocuments({
				deletedAt: null,
				memberStatus: MemberStatus.ACTIVE,
			}),
			this.memberModel.countDocuments({
				deletedAt: null,
				memberStatus: MemberStatus.BLOCK,
			}),
			this.matchModel.countDocuments({ deletedAt: null }),
			this.propertyModel.countDocuments({ deletedAt: null }),
			this.bookingModel.countDocuments({ deletedAt: null }),
			this.reviewModel.countDocuments({ deletedAt: null }),
		]);

		return {
			totalMembers,
			activeMembers,
			blockedMembers,
			totalMatches,
			totalProperties,
			totalBookings,
			totalReviews,
		};
	}
}

