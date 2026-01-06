import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Member } from '../schemas/Member.model';

export interface JwtPayload {
	sub: string; // member ID
	memberNick: string;
	memberType: string;
}

export interface AuthResponse {
	member: Member;
	accessToken: string;
}

@Injectable()
export class AuthService {
	constructor(private readonly jwtService: JwtService) {}

	async generateToken(member: Member): Promise<string> {
		const payload: JwtPayload = {
			sub: member._id.toString(),
			memberNick: member.memberNick,
			memberType: member.memberType,
		};

		return this.jwtService.sign(payload);
	}

	async verifyToken(token: string): Promise<JwtPayload> {
		return this.jwtService.verify(token);
	}

	async createAuthResponse(member: Member): Promise<AuthResponse> {
		const accessToken = await this.generateToken(member);
		return {
			member,
			accessToken,
		};
	}
}

