import {
	Injectable,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from './auth.guard';
import { MemberType } from '../libs/enums/member.enum';
import { Message } from '../libs/enums/common.enum';

@Injectable()
export class AdminGuard extends AuthGuard {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		// First check authentication (from AuthGuard)
		const isAuthenticated = await super.canActivate(context);
		if (!isAuthenticated) {
			return false;
		}

		// Then check if user is admin
		const ctx = GqlExecutionContext.create(context);
		const request = ctx.getContext().req;
		const user = request.user;

		if (!user || user.memberType !== MemberType.ADMIN) {
			throw new ForbiddenException(Message.ADMIN_ONLY);
		}

		return true;
	}
}

