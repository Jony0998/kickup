import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { TelegramAuthService } from './telegram-auth.service';
import { GoogleAuthService } from './google-auth.service';
import RefreshTokenSchema from '../schemas/RefreshToken.model';
import MemberSchema from '../schemas/Member.model';

@Module({
	imports: [
		ConfigModule,
		MongooseModule.forFeature([
			{ name: 'RefreshToken', schema: RefreshTokenSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
				signOptions: {
					expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m', // Short-lived access token
				},
			}),
			inject: [ConfigService],
		}),
	],
	providers: [AuthService, AuthGuard, TelegramAuthService, GoogleAuthService],
	exports: [AuthService, AuthGuard, TelegramAuthService, GoogleAuthService, JwtModule],
})
export class AuthModule { }

