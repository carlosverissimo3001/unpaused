import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { MultiplayerRoom, RoomPlayer, RoomStatus, User } from '@prisma/client';

const PLAYERS_INCLUDE = {
  players: {
    include: {
      user: {
        select: { spotifyUserId: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { joinedAt: 'asc' as const },
  },
};

export type RoomWithPlayers = MultiplayerRoom & {
  players: (RoomPlayer & {
    user: Pick<User, 'spotifyUserId' | 'displayName' | 'avatarUrl'>;
  })[];
};

@Injectable()
export class RoomRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(
    hostId: string,
    inviteCode: string,
    roundCount: number,
  ): Promise<RoomWithPlayers> {
    return this.prisma.multiplayerRoom.create({
      data: {
        inviteCode,
        hostId,
        roundCount,
        players: {
          create: { userId: hostId },
        },
      },
      include: PLAYERS_INCLUDE,
    });
  }

  async findById(id: string): Promise<RoomWithPlayers | null> {
    return this.prisma.multiplayerRoom.findUnique({
      where: { id },
      include: PLAYERS_INCLUDE,
    });
  }

  async findByInviteCode(inviteCode: string): Promise<RoomWithPlayers | null> {
    return this.prisma.multiplayerRoom.findUnique({
      where: { inviteCode },
      include: PLAYERS_INCLUDE,
    });
  }

  async findPlayerInRoom(
    roomId: string,
    userId: string,
  ): Promise<RoomPlayer | null> {
    return this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
  }

  async addPlayer(roomId: string, userId: string): Promise<RoomPlayer> {
    return this.prisma.roomPlayer.create({
      data: { roomId, userId },
    });
  }

  async removePlayer(roomId: string, userId: string): Promise<void> {
    await this.prisma.roomPlayer.delete({
      where: { roomId_userId: { roomId, userId } },
    });
  }

  async updateStatus(
    roomId: string,
    status: RoomStatus,
    extra?: {
      startedAt?: Date;
      completedAt?: Date;
      trackIds?: string[];
    },
  ): Promise<RoomWithPlayers> {
    return this.prisma.multiplayerRoom.update({
      where: { id: roomId },
      data: { status, ...extra },
      include: PLAYERS_INCLUDE,
    });
  }

  async addToPlayerScore(playerId: string, score: number): Promise<void> {
    await this.prisma.roomPlayer.update({
      where: { id: playerId },
      data: { totalScore: { increment: score } },
    });
  }

  async toggleReady(roomId: string, userId: string): Promise<RoomWithPlayers> {
    const player = await this.prisma.roomPlayer.findUniqueOrThrow({
      where: { roomId_userId: { roomId, userId } },
    });

    await this.prisma.roomPlayer.update({
      where: { id: player.id },
      data: { isReady: !player.isReady },
    });

    return this.prisma.multiplayerRoom.findUniqueOrThrow({
      where: { id: roomId },
      include: PLAYERS_INCLUDE,
    });
  }

  async inviteCodeExists(code: string): Promise<boolean> {
    const room = await this.prisma.multiplayerRoom.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    return !!room;
  }
}
