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
	constructor(private readonly authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const ctx = GqlExecutionContext.create(context);
		const request = ctx.getContext().req;

		const authHeader = request.headers.authorization;
		if (!authHeader) {
			throw new UnauthorizedException(Message.TOKEN_NOT_EXIST);
		}

		const token = authHeader.replace('Bearer ', '');
		if (!token) {
			throw new UnauthorizedException(Message.TOKEN_NOT_EXIST);
		}

		try {
			const payload = await this.authService.verifyToken(token);
			// Attach user to request
			request.user = payload;
			return true;
		} catch (error) {
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}
	}
}

