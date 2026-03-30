import {
	Injectable,
	NotFoundException,
	ConflictException,
	UnauthorizedException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../schemas/Member.model';
import { MemberStatus, MemberAuthType, MemberType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { LoginInput, RegisterInput } from '../../schemas/Member.graphql';
import { TelegramAuthService } from '../../auth/telegram-auth.service';
import { TelegramAuthData } from '../../auth/telegram-auth.service';
import { GoogleAuthService } from '../../auth/google-auth.service';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly telegramAuthService: TelegramAuthService,
		private readonly googleAuthService: GoogleAuthService,
	) { }

	async register(registerDto: RegisterInput): Promise<Member> {
		try {
			const debug = process.env.DEBUG_TIMING === '1';
			// Validate required fields
			if (!registerDto.memberPhone || !registerDto.memberNick) {
				throw new BadRequestException('Phone and Nick are required');
			}

			const authType = registerDto.memberAuthType || MemberAuthType.PHONE;

			// Validate password for non-TELEGRAM auth
			if (authType !== MemberAuthType.TELEGRAM && !registerDto.memberPassword) {
				throw new BadRequestException('Password is required for non-TELEGRAM authentication');
			}

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

			// ROLE ASSIGNMENT: Default to USER, allow AGENT selection, protect ADMIN
			let memberType = registerDto.memberType || MemberType.USER;

			// Super Admin Security check (overrides requested role)
			if (registerDto.isAdmin && registerDto.adminSecretKey) {
				// Secret key tekshirish
				const validSecretKey = process.env.ADMIN_SECRET_KEY || 'CHANGE_THIS_IN_PRODUCTION';
				if (registerDto.adminSecretKey !== validSecretKey) {
					throw new UnauthorizedException('Invalid admin secret key');
				}

				// Agar allaqachon admin bor bo'lsa, yangi admin yaratishni rad etish
				const existingAdmin = await this.memberModel.findOne({
					memberType: MemberType.ADMIN,
					deletedAt: null,
				});

				if (existingAdmin) {
					throw new ConflictException('Admin already exists. Cannot create another admin. Please register as regular user.');
				}

				// Admin yaratishga ruxsat beriladi
				memberType = MemberType.ADMIN;
			} else if (memberType === MemberType.ADMIN) {
				// Prevent users from manually selecting ADMIN without secret key
				memberType = MemberType.USER;
			}

			// Hash password if provided
			let hashedPassword: string | undefined;
			if (registerDto.memberPassword) {
				hashedPassword = await bcrypt.hash(registerDto.memberPassword, 10);
			}

			// Create member document
			const memberData: any = {
				memberPhone: registerDto.memberPhone.trim(),
				memberNick: registerDto.memberNick.trim(),
				memberAuthType: authType,
				memberType: memberType,
				memberStatus: MemberStatus.ACTIVE,
			};

			// Add password if provided
			if (hashedPassword) {
				memberData.memberPassword = hashedPassword;
			}

			// Add optional fields
			if (registerDto.memberFullName) {
				memberData.memberFullName = registerDto.memberFullName.trim();
			}

			if (debug) {
				console.log('Creating member with data:', {
					memberPhone: memberData.memberPhone,
					memberNick: memberData.memberNick,
					memberType: memberData.memberType,
					hasPassword: !!memberData.memberPassword
				});
			}

			const member = new this.memberModel(memberData);

			if (debug) {
				console.log('Attempting to save member to DB...');
				console.log('Model Name: ', this.memberModel.modelName);
				console.log('DB Name: ', this.memberModel.db.name);
				console.log('Member Instance: ', member);
			}

			const savedMember = await member.save();
			if (debug) {
				console.log('Save result:', savedMember);

				console.log('Member saved successfully to database:', {
					_id: savedMember._id,
					memberNick: savedMember.memberNick,
					memberPhone: savedMember.memberPhone,
				});
			}

			return savedMember;
		} catch (error) {
			console.error('Error in register service:', {
				message: error.message,
				stack: error.stack,
				name: error.name,
			});
			throw error;
		}
	}

	/** Public: returns true if at least one admin exists (for signup page to hide admin option). */
	async hasAdmin(): Promise<boolean> {
		const count = await this.memberModel.countDocuments({
			memberType: MemberType.ADMIN,
			deletedAt: null,
		});
		return count > 0;
	}

	async login(
		loginDto: LoginInput,
	): Promise<Member> {
		const startedAt = Date.now();
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

		if (process.env.DEBUG_TIMING === '1') {
			console.log(`[MemberService.login] ${Date.now() - startedAt}ms`);
		}
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

	async getTopMembers(limit: number): Promise<Member[]> {
		return this.memberModel
			.find({ deletedAt: null, memberType: MemberType.USER })
			.sort({ memberPoints: -1 })
			.limit(limit)
			.exec();
	}

	private static readonly PROFILE_UPDATE_FIELDS = [
		'memberNick', 'memberFullName', 'memberPhone', 'memberAddress', 'memberDesc', 'memberImage',
	];

	async updateProfile(id: string, updateDto: any): Promise<Member> {
		const setUpdate: Record<string, any> = {};
		for (const key of MemberService.PROFILE_UPDATE_FIELDS) {
			if (updateDto[key] !== undefined && updateDto[key] !== null) {
				setUpdate[key] = updateDto[key];
			}
		}

		// Always persist memberImage when sent: normalize to path so it works after logout/login
		if ('memberImage' in updateDto) {
			const raw = updateDto.memberImage;
			if (typeof raw === 'string' && raw.trim()) {
				const img = raw.trim();
				if (img.startsWith('http://') || img.startsWith('https://')) {
					const match = img.match(/^(?:https?:\/\/[^/]+)(\/.*)$/);
					setUpdate.memberImage = (match && match[1]) ? match[1] : img;
				} else {
					setUpdate.memberImage = img.startsWith('/') ? img : '/' + img;
				}
			} else {
				setUpdate.memberImage = '';
			}
		}

		const result = await this.memberModel.updateOne(
			{ _id: id },
			{ $set: setUpdate },
		).exec();

		if (result.matchedCount === 0) {
			throw new NotFoundException('Member not found');
		}
		const member = await this.memberModel.findById(id).exec();
		if (!member) throw new NotFoundException('Member not found');
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
	async loginWithTelegram(authData: TelegramAuthData): Promise<Member> {
		const isValid = await this.telegramAuthService.validateTelegramAuth(authData);
		if (!isValid) {
			throw new UnauthorizedException('Invalid Telegram login');
		}

		const userData = this.telegramAuthService.extractUserData(authData);
		const telegramIdString = `telegram_${userData.telegramId}`;
		let member = await this.memberModel
			.findOne({
				memberPhone: telegramIdString,
				memberAuthType: MemberAuthType.TELEGRAM,
				deletedAt: null,
			})
			.exec();

		if (member) {
			// Update info if needed
			if (userData.firstName) member.memberNick = userData.firstName;
			if (userData.lastName) member.memberFullName = `${userData.firstName} ${userData.lastName}`.trim();
			if (userData.photoUrl) member.memberImage = userData.photoUrl;
			return member.save();
		}

		// Create New Member
		member = new this.memberModel({
			memberNick: userData.firstName,
			memberFullName: userData.lastName ? `${userData.firstName} ${userData.lastName}`.trim() : userData.firstName,
			memberPhone: telegramIdString,
			memberAuthType: MemberAuthType.TELEGRAM,
			memberStatus: MemberStatus.ACTIVE,
			memberType: MemberType.USER,
			memberImage: userData.photoUrl || '',
		});

		return member.save();
	}

	async loginWithGoogle(tokenId: string): Promise<Member> {
		const payload = await this.googleAuthService.verifyGoogleToken(tokenId);
		const googleId = payload.sub;
		const email = payload.email;
		const name = payload.name;
		const picture = payload.picture;

		const googleIdentifier = `google_${googleId}`;

		let member = await this.memberModel
			.findOne({
				memberPhone: googleIdentifier,
				memberAuthType: MemberAuthType.GOOGLE,
				deletedAt: null,
			})
			.exec();

		if (member) {
			// Update info
			if (name) member.memberNick = name;
			if (picture) member.memberImage = picture;
			return member.save();
		}

		// Create New Member
		member = new this.memberModel({
			memberNick: name || 'Google User',
			memberFullName: name || 'Google User',
			memberPhone: googleIdentifier,
			memberAuthType: MemberAuthType.GOOGLE,
			memberStatus: MemberStatus.ACTIVE,
			memberType: MemberType.USER,
			memberImage: picture || '',
		});

		return member.save();
	}
}

