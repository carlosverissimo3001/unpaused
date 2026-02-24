import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoomStatus } from '@prisma/client';
import { AuthService } from '../../auth/services/auth.service';
import {
  RoomRepository,
  RoomWithPlayers,
} from '../repositories/room.repository';
import { RoomDto } from '../dto/room.dto';
import { CreateRoomDto } from '../dto/create-room.dto';
import { TrackPoolService } from './track-pool.service';

const INVITE_CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;
const MAX_INVITE_CODE_ATTEMPTS = 10;

@Injectable()
export class RoomService {
  constructor(
    private readonly authService: AuthService,
    private readonly roomRepository: RoomRepository,
    private readonly trackPoolService: TrackPoolService,
  ) {}

  async createRoom(sessionId: string, dto: CreateRoomDto): Promise<RoomDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const inviteCode = await this.generateUniqueInviteCode();

    const room = await this.roomRepository.createRoom(
      userId,
      inviteCode,
      dto.roundCount,
    );

    return RoomDto.fromEntity(room);
  }

  async getRoomState(roomId: string): Promise<RoomDto> {
    const room = await this.findRoomOrThrow(roomId);
    return RoomDto.fromEntity(room);
  }

  async joinRoom(sessionId: string, inviteCode: string): Promise<RoomDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    const room = await this.roomRepository.findByInviteCode(
      inviteCode.toUpperCase(),
    );
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Room is no longer accepting players');
    }

    // Idempotent: if already in room, just return current state
    const existingPlayer = await this.roomRepository.findPlayerInRoom(
      room.id,
      userId,
    );
    if (existingPlayer) {
      return RoomDto.fromEntity(room);
    }

    await this.roomRepository.addPlayer(room.id, userId);

    // Re-fetch to include the new player
    const updated = await this.findRoomOrThrow(room.id);
    return RoomDto.fromEntity(updated);
  }

  async startGame(sessionId: string, roomId: string): Promise<RoomDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const room = await this.findRoomOrThrow(roomId);

    if (room.hostId !== userId) {
      throw new ForbiddenException('Only the host can start the game');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Game has already started or completed');
    }

    // Pool tracks from all players' liked songs
    const playerUserIds = room.players.map((p) => p.userId);
    let trackIds: string[];
    try {
      trackIds = await this.trackPoolService.selectTracksForRoom(
        playerUserIds,
        room.roundCount,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message =
        error instanceof Error && error.message
          ? `Failed to select tracks for this room: ${error.message}`
          : 'Failed to select tracks for this room';
      throw new BadRequestException(message);
    }

    if (trackIds.length < room.roundCount) {
      throw new BadRequestException(
        `Not enough tracks to start the game (required: ${room.roundCount}, found: ${trackIds.length})`,
      );
    }

    const updated = await this.roomRepository.updateStatus(
      roomId,
      RoomStatus.PLAYING,
      {
        startedAt: new Date(),
        trackIds,
      },
    );

    return RoomDto.fromEntity(updated);
  }

  async leaveRoom(sessionId: string, roomId: string): Promise<void> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const room = await this.findRoomOrThrow(roomId);

    const isPlayer = room.players.some((p) => p.userId === userId);
    if (!isPlayer) {
      throw new BadRequestException('You are not in this room');
    }

    // If host leaves, expire the room
    if (room.hostId === userId) {
      await this.roomRepository.updateStatus(roomId, RoomStatus.EXPIRED);
      return;
    }

    // Otherwise just remove the player
    await this.roomRepository.removePlayer(roomId, userId);
  }

  private async findRoomOrThrow(roomId: string): Promise<RoomWithPlayers> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  private async generateUniqueInviteCode(): Promise<string> {
    for (let i = 0; i < MAX_INVITE_CODE_ATTEMPTS; i++) {
      const code = this.generateInviteCode();
      const exists = await this.roomRepository.inviteCodeExists(code);
      if (!exists) {
        return code;
      }
    }
    throw new Error('Failed to generate unique invite code');
  }

  private generateInviteCode(): string {
    let code = '';
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
      code += INVITE_CODE_CHARSET.charAt(
        Math.floor(Math.random() * INVITE_CODE_CHARSET.length),
      );
    }
    return code;
  }
}
