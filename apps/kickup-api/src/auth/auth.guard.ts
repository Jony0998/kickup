import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { Message } from '../libs/enums/common.enum';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly authService: AuthService) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const type = context.getType<string>();
		let request: any;
		let response: any;
		if (type === 'http') {
			const http = context.switchToHttp();
			request = http.getRequest();
			response = http.getResponse();
		} else {
			const ctx = GqlExecutionContext.create(context);
			request = ctx.getContext().req;
			response = ctx.getContext().res;
		}

		const authHeader = request.headers.authorization as string | undefined;
		const cookieHeader = request.headers.cookie as string | undefined;
		const cookies = this.parseCookies(cookieHeader);

		const token = authHeader?.startsWith('Bearer ')
			? authHeader.replace('Bearer ', '')
			: cookies.accessToken;

		if (!token) {
			throw new UnauthorizedException(Message.TOKEN_NOT_EXIST);
		}

		try {
			const payload = await this.authService.verifyToken(token);
			request.user = payload;
			return true;
		} catch (error) {
			if (process.env.NODE_ENV !== 'production') {
				console.warn('AuthGuard: Token verification failed:', (error as Error).message);
			}
			// If token expired, try to refresh using refresh token
			const refreshToken = cookies.refreshToken;
			if (refreshToken && error.name === 'TokenExpiredError') {
				try {
					const authResponse = await this.authService.refreshAccessToken(refreshToken);
					// Set new access token in cookie
					if (response) {
						const isProd = process.env.NODE_ENV === 'production';
						response.cookie('accessToken', authResponse.accessToken, {
							httpOnly: true,
							secure: isProd,
							sameSite: isProd ? 'none' : 'lax',
							path: '/',
							maxAge: 15 * 60 * 1000, // 15 minutes
						});

						if (authResponse.refreshToken) {
							response.cookie('refreshToken', authResponse.refreshToken, {
								httpOnly: true,
								secure: isProd,
								sameSite: isProd ? 'none' : 'lax',
								path: '/',
								maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
							});
						}
					}
					// Attach user to request
					request.user = {
						sub: authResponse.member._id,
						memberNick: authResponse.member.memberNick,
						memberType: authResponse.member.memberType,
					};
					return true;
				} catch (refreshError) {
					// Refresh failed, throw original error
					throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
				}
			}
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}
	}

	private parseCookies(cookieHeader?: string): Record<string, string> {
		if (!cookieHeader) return {};
		return cookieHeader.split(';').reduce((acc, part) => {
			const [rawKey, ...rest] = part.split('=');
			const key = rawKey?.trim();
			if (!key) return acc;
			const value = rest.join('=').trim();
			acc[key] = decodeURIComponent(value);
			return acc;
		}, {} as Record<string, string>);
	}
}

