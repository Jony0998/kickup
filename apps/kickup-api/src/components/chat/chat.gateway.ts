import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, forwardRef } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: { origin: true },
    namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly authService: AuthService,
        @Inject(forwardRef(() => ChatService))
        private readonly chatService: ChatService,
    ) {}

    async handleConnection(client: Socket) {
        const token = client.handshake.auth?.token as string | undefined;
        if (!token) {
            client.disconnect();
            return;
        }
        try {
            const payload = await this.authService.verifyToken(token);
            (client as any).data = (client as any).data || {};
            (client as any).data.userId = payload.sub;
            console.log(`Client connected: ${client.id}, userId: ${payload.sub}`);
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() roomId: string,
    ) {
        const userId = (client as any).data?.userId;
        if (!userId) {
            client.emit('joinError', { message: 'Not authenticated' });
            return { event: 'joinError', data: 'Not authenticated' };
        }

        if (roomId.startsWith('match:')) {
            const matchId = roomId.replace(/^match:/, '');
            const canAccess = await this.chatService.canAccessMatchChat(userId, matchId);
            if (!canAccess) {
                client.emit('joinError', { message: 'Access denied to this match chat' });
                return { event: 'joinError', data: 'Access denied' };
            }
        }

        if (roomId.startsWith('team:')) {
            const teamId = roomId.replace(/^team:/, '');
            const canAccess = await this.chatService.canAccessTeamChat(userId, teamId);
            if (!canAccess) {
                client.emit('joinError', { message: 'Access denied to this team chat' });
                return { event: 'joinError', data: 'Access denied' };
            }
        }

        client.join(roomId);
        console.log(`Client ${client.id} joined room: ${roomId}`);
        return { event: 'joinedRoom', data: roomId };
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() roomId: string,
    ) {
        client.leave(roomId);
        console.log(`Client ${client.id} left room: ${roomId}`);
        return { event: 'leftRoom', data: roomId };
    }

    emitNewMessage(chatId: string, message: any) {
        this.server.to(chatId).emit('newMessage', message);
    }
}
