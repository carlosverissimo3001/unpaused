import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { parse as parseCookie } from 'cookie';
import { AuthService } from '../../auth/services/auth.service';
import { SessionService } from '../../auth/services/session.service';
import { RoomRepository } from '../repositories/room.repository';
import { RoomDto } from '../dto/room.dto';

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  },
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomsGateway.name);

  /** roomId → Set of online userIds */
  private readonly presence = new Map<string, Set<string>>();

  /** roomId → pending host-disconnect timeout (debounce refresh flicker) */
  private readonly hostDisconnectTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  constructor(
    private readonly sessionService: SessionService,
    private readonly authService: AuthService,
    private readonly roomRepository: RoomRepository,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const cookieHeader = client.handshake.headers.cookie;
      if (!cookieHeader) {
        client.disconnect();
        return;
      }

      const cookies = parseCookie(cookieHeader);
      const sessionId = cookies['unpaused_session'];
      if (!sessionId) {
        client.disconnect();
        return;
      }

      // Validate session exists
      await this.sessionService.getSession(sessionId);

      // Resolve user
      const user = await this.authService.getUserBySessionId(sessionId);

      client.data.userId = user.id;
      client.data.sessionId = sessionId;

      this.logger.debug(`Client connected: ${client.id} (user ${user.id})`);
      client.emit('authenticated');
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data.userId as string | undefined;
    const roomIds = (client.data.roomIds as Set<string>) ?? new Set();

    if (userId) {
      for (const roomId of roomIds) {
        this.presence.get(roomId)?.delete(userId);
        this.emitPresenceUpdate(roomId);

        // Debounced host-disconnect detection (5s grace for page refreshes)
        this.roomRepository
          .findById(roomId)
          .then((room) => {
            if (
              room &&
              room.hostId === userId &&
              (room.status === 'WAITING' || room.status === 'PLAYING')
            ) {
              const timer = setTimeout(() => {
                this.hostDisconnectTimers.delete(roomId);
                this.server.to(roomId).emit('hostDisconnected', { roomId });
                this.logger.debug(`Host disconnect emitted for room ${roomId}`);
              }, 5000);
              this.hostDisconnectTimers.set(roomId, timer);
            }
          })
          .catch(() => {
            /* room may already be deleted */
          });
      }
    }

    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): Promise<void> {
    const userId = client.data.userId;
    if (!userId || !payload.roomId) {
      return;
    }

    // Validate user is a member of the room
    const player = await this.roomRepository.findPlayerInRoom(
      payload.roomId,
      userId,
    );
    if (!player) {
      return;
    }

    await client.join(payload.roomId);

    // Track presence
    if (!client.data.roomIds) {
      client.data.roomIds = new Set<string>();
    }
    (client.data.roomIds as Set<string>).add(payload.roomId);

    if (!this.presence.has(payload.roomId)) {
      this.presence.set(payload.roomId, new Set());
    }
    this.presence.get(payload.roomId)!.add(userId);
    this.emitPresenceUpdate(payload.roomId);

    // Cancel pending host-disconnect timer if the host is reconnecting
    if (this.hostDisconnectTimers.has(payload.roomId)) {
      const room = await this.roomRepository.findById(payload.roomId);
      if (room && room.hostId === userId) {
        clearTimeout(this.hostDisconnectTimers.get(payload.roomId));
        this.hostDisconnectTimers.delete(payload.roomId);
        this.server
          .to(payload.roomId)
          .emit('hostReconnected', { roomId: payload.roomId });
        this.logger.debug(
          `Host reconnected, cancelled disconnect timer for room ${payload.roomId}`,
        );
      }
    }

    this.logger.debug(`Client ${client.id} joined room ${payload.roomId}`);
  }

  @SubscribeMessage('sendReaction')
  handleSendReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; emoji: string },
  ): void {
    const userId = client.data.userId as string | undefined;
    if (!userId || !payload.roomId || !payload.emoji) return;

    const roomIds = client.data.roomIds as Set<string> | undefined;
    if (!roomIds?.has(payload.roomId)) return;

    // Broadcast to all others in the room
    client.to(payload.roomId).emit('reaction', {
      userId,
      emoji: payload.emoji,
    });
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): Promise<void> {
    if (!payload.roomId) {
      return;
    }
    await client.leave(payload.roomId);

    const userId = client.data.userId as string | undefined;
    if (userId) {
      (client.data.roomIds as Set<string> | undefined)?.delete(payload.roomId);
      this.presence.get(payload.roomId)?.delete(userId);
      this.emitPresenceUpdate(payload.roomId);
    }

    this.logger.debug(`Client ${client.id} left room ${payload.roomId}`);
  }

  private emitPresenceUpdate(roomId: string): void {
    const onlineUserIds = [...(this.presence.get(roomId) ?? [])];
    this.server.to(roomId).emit('presenceUpdate', { roomId, onlineUserIds });
  }

  emitRoomUpdate(roomId: string, room: RoomDto): void {
    this.server.to(roomId).emit('roomUpdated', room);
  }

  emitPlayerRoundComplete(
    roomId: string,
    data: { userId: string; displayName: string; roundIndex: number },
  ): void {
    this.server.to(roomId).emit('playerRoundComplete', data);
  }
}
