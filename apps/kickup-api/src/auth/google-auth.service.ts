import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleAuthService {
    private client: OAuth2Client;

    constructor(private readonly configService: ConfigService) {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        this.client = new OAuth2Client(clientId);
    }

    async verifyGoogleToken(token: string): Promise<any> {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken: token,
                audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
            });
            const payload = ticket.getPayload();
            return payload;
        } catch (error) {
            console.error('Error verifying Google token:', error);
            throw new UnauthorizedException('Invalid Google token');
        }
    }
}
