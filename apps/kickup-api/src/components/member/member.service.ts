import {
	Injectable,
	NotFoundException,
	ConflictException,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../schemas/Member.model';
import { MemberStatus, MemberAuthType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { TelegramAuthService } from '../../auth/telegram-auth.service';
import { TelegramAuthData } from '../../auth/telegram-auth.service';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly telegramAuthService: TelegramAuthService,
	) {}

	async register(registerDto: {
		memberPhone: string;
		memberNick: string;
		memberPassword: string;
		memberFullName?: string;
		memberAuthType?: MemberAuthType;
	}): Promise<Member> {
		// Check if phone or nick already exists
		const existingMember = await this.memberModel.findOne({
			$or: [
				{ memberPhone: registerDto.memberPhone },
				{ memberNick: registerDto.memberNick },
			],
			deletedAt: null,
		});

		if (existingMember) {
			throw new ConflictException(Message.USED_MEMBER_NICK_OR_PHONE);
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(registerDto.memberPassword, 10);

		const member = new this.memberModel({
			...registerDto,
			memberPassword: hashedPassword,
			memberAuthType: registerDto.memberAuthType || MemberAuthType.PHONE,
		});

		return member.save();
	}

	async login(
		loginDto: { memberPhone?: string; memberNick?: string; memberPassword: string },
	): Promise<Member> {
		const member = await this.memberModel
			.findOne({
				$or: [
					{ memberPhone: loginDto.memberPhone },
					{ memberNick: loginDto.memberNick },
				],
				deletedAt: null,
			})
			.select('+memberPassword');

		if (!member) {
			throw new NotFoundException(Message.NO_MEMBER_NICK);
		}

		if (member.memberStatus === MemberStatus.BLOCK) {
			throw new UnauthorizedException(Message.BLOCKED_USER);
		}

		const isPasswordValid = await bcrypt.compare(
			loginDto.memberPassword,
			member.memberPassword,
		);

		if (!isPasswordValid) {
			throw new UnauthorizedException(Message.WRONG_PASSWORD);
		}

		// Remove password from response
		member.memberPassword = undefined;
		return member;
	}

	async findOne(id: string): Promise<Member> {
		const member = await this.memberModel.findById(id).exec();

		if (!member || member.deletedAt) {
			throw new NotFoundException('Member not found');
		}

		return member;
	}

	async findByNick(memberNick: string): Promise<Member> {
		const member = await this.memberModel
			.findOne({ memberNick, deletedAt: null })
			.exec();

		if (!member) {
			throw new NotFoundException(Message.NO_MEMBER_NICK);
		}

		return member;
	}

	async findByPhone(memberPhone: string): Promise<Member> {
		const member = await this.memberModel
			.findOne({ memberPhone, deletedAt: null })
			.exec();

		if (!member) {
			throw new NotFoundException('Member not found');
		}

		return member;
	}

	async updateProfile(id: string, updateDto: any): Promise<Member> {
		const member = await this.memberModel.findByIdAndUpdate(
			id,
			{ $set: updateDto },
			{ new: true },
		);

		if (!member) {
			throw new NotFoundException('Member not found');
		}

		return member;
	}

	async updatePassword(
		id: string,
		oldPassword: string,
		newPassword: string,
	): Promise<boolean> {
		const member = await this.memberModel
			.findById(id)
			.select('+memberPassword');

		if (!member) {
			throw new NotFoundException('Member not found');
		}

		const isPasswordValid = await bcrypt.compare(
			oldPassword,
			member.memberPassword,
		);

		if (!isPasswordValid) {
			throw new UnauthorizedException(Message.WRONG_PASSWORD);
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		member.memberPassword = hashedPassword;
		await member.save();

		return true;
	}

	async followMember(followerId: string, followingId: string): Promise<Member> {
		if (followerId === followingId) {
			throw new ConflictException(Message.SELF_SUBSCRIPTION_DENIED);
		}

		const follower = await this.memberModel.findById(followerId);
		const following = await this.memberModel.findById(followingId);

		if (!follower || !following) {
			throw new NotFoundException('Member not found');
		}

		// Check if already following (you might want to add a followers array)
		// For now, just increment counters
		follower.memberFollowings += 1;
		following.memberFollowers += 1;

		await follower.save();
		await following.save();

		return follower;
	}

	async incrementStats(
		id: string,
		field: 'memberProperties' | 'memberArticles' | 'memberPoints' | 'memberLikes',
	): Promise<Member> {
		const member = await this.memberModel.findById(id);
		if (!member) {
			throw new NotFoundException('Member not found');
		}

		member[field] = (member[field] || 0) + 1;
		return member.save();
	}

	async deleteMember(id: string): Promise<boolean> {
		const result = await this.memberModel.findByIdAndUpdate(id, {
			deletedAt: new Date(),
			memberStatus: MemberStatus.DELETE,
		});

		return !!result;
	}

	/**
	 * Login or register with Telegram
	 * @param telegramAuthData - Data from Telegram Login Widget
	 * @returns Member object
	 */
	async loginWithTelegram(
		telegramAuthData: TelegramAuthData,
	): Promise<Member> {
		// Validate Telegram authentication
		await this.telegramAuthService.validateTelegramAuth(telegramAuthData);

		// Extract user data
		const userData =
			this.telegramAuthService.extractUserData(telegramAuthData);

		// Try to find existing member by Telegram ID (stored in memberPhone or a new field)
		// For now, we'll use memberPhone to store Telegram ID as string
		const telegramIdString = `telegram_${userData.telegramId}`;
		let member = await this.memberModel
			.findOne({
				memberPhone: telegramIdString,
				memberAuthType: MemberAuthType.TELEGRAM,
				deletedAt: null,
			})
			.exec();

		if (member) {
			// Update member info if needed
			if (userData.firstName && !member.memberFullName) {
				member.memberFullName = userData.firstName;
			}
			if (userData.photoUrl && !member.memberImage) {
				member.memberImage = userData.photoUrl;
			}
			if (userData.username && !member.memberNick) {
				member.memberNick = userData.username;
			}
			await member.save();
			return member;
		}

		// Create new member
		const memberNick =
			userData.username || `user_${userData.telegramId}`;
		
		// Check if nick is already taken
		const existingNick = await this.memberModel.findOne({
			memberNick,
			deletedAt: null,
		});

		const finalNick = existingNick
			? `${memberNick}_${userData.telegramId}`
			: memberNick;

		member = new this.memberModel({
			memberPhone: telegramIdString,
			memberNick: finalNick,
			memberPassword: undefined, // No password for Telegram auth
			memberFullName: userData.firstName || '',
			memberImage: userData.photoUrl || '',
			memberAuthType: MemberAuthType.TELEGRAM,
			memberStatus: MemberStatus.ACTIVE,
		});

		return member.save();
	}

	/**
	 * Find member by Telegram ID
	 */
	async findByTelegramId(telegramId: number): Promise<Member | null> {
		const telegramIdString = `telegram_${telegramId}`;
		return this.memberModel
			.findOne({
				memberPhone: telegramIdString,
				memberAuthType: MemberAuthType.TELEGRAM,
				deletedAt: null,
			})
			.exec();
	}
}

