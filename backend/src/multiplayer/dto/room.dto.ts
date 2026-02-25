import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomStatus, MultiplayerRoom, RoomPlayer, User } from '@prisma/client';
import { RoomPlayerDto } from './room-player.dto';

type RoomWithPlayers = MultiplayerRoom & {
  players: (RoomPlayer & {
    user: Pick<User, 'spotifyUserId' | 'displayName' | 'avatarUrl'>;
  })[];
};

export class RoomDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  inviteCode: string;

  @ApiProperty()
  hostId: string;

  @ApiProperty()
  roundCount: number;

  @ApiProperty({ enum: RoomStatus })
  status: RoomStatus;

  @ApiProperty({ type: [RoomPlayerDto] })
  players: RoomPlayerDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: Date })
  startedAt?: Date;

  @ApiPropertyOptional({ type: Date })
  completedAt?: Date;

  static fromEntity(room: RoomWithPlayers): RoomDto {
    return {
      id: room.id,
      inviteCode: room.inviteCode,
      hostId: room.hostId,
      roundCount: room.roundCount,
      status: room.status,
      players: room.players.map(RoomPlayerDto.fromEntity),
      createdAt: room.createdAt,
      startedAt: room.startedAt ?? undefined,
      completedAt: room.completedAt ?? undefined,
    };
  }
}
