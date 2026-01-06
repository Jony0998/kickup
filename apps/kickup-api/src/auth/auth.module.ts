import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { TelegramAuthService } from './telegram-auth.service';

@Module({
	imports: [
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
				signOptions: {
					expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
				},
			}),
			inject: [ConfigService],
		}),
	],
	providers: [AuthService, TelegramAuthService],
	exports: [AuthService, TelegramAuthService, JwtModule],
})
export class AuthModule {}

