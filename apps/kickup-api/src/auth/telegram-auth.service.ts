import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface TelegramAuthData {
	id: number;
	first_name: string;
	last_name?: string;
	username?: string;
	photo_url?: string;
	auth_date: number;
	hash: string;
}

@Injectable()
export class TelegramAuthService {
	private botToken: string;

	constructor(private readonly configService: ConfigService) {
		this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
	}

	/**
	 * Validates Telegram authentication data
	 * @param authData - Data received from Telegram Login Widget
	 * @returns true if valid, throws error if invalid
	 */
	async validateTelegramAuth(authData: TelegramAuthData): Promise<boolean> {
		if (!this.botToken) {
			throw new UnauthorizedException(
				'Telegram bot token is not configured. Please set TELEGRAM_BOT_TOKEN in environment variables.',
			);
		}

		// Check if auth_date is not too old (5 minutes)
		const currentTime = Math.floor(Date.now() / 1000);
		const authDate = authData.auth_date;
		if (currentTime - authDate > 300) {
			throw new UnauthorizedException('Telegram authentication data is expired');
		}

		// Validate hash
		const isValid = this.validateHash(authData);
		if (!isValid) {
			throw new UnauthorizedException('Invalid Telegram authentication data');
		}

		return true;
	}

	/**
	 * Validates Telegram hash according to Telegram's algorithm
	 * https://core.telegram.org/widgets/login#checking-authorization
	 */
	private validateHash(authData: TelegramAuthData): boolean {
		const { hash, ...data } = authData;

		// Create data check string
		const dataCheckString = Object.keys(data)
			.sort()
			.map((key) => `${key}=${data[key]}`)
			.join('\n');

		// Create secret key from bot token
		const secretKey = crypto
			.createHmac('sha256', 'WebAppData')
			.update(this.botToken)
			.digest();

		// Calculate hash
		const calculatedHash = crypto
			.createHmac('sha256', secretKey)
			.update(dataCheckString)
			.digest('hex');

		return calculatedHash === hash;
	}

	/**
	 * Extracts user data from Telegram auth data
	 */
	extractUserData(authData: TelegramAuthData): {
		telegramId: number;
		firstName: string;
		lastName?: string;
		username?: string;
		photoUrl?: string;
	} {
		return {
			telegramId: authData.id,
			firstName: authData.first_name,
			lastName: authData.last_name,
			username: authData.username,
			photoUrl: authData.photo_url,
		};
	}
}

