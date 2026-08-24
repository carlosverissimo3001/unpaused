import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomPlayer, User } from '@prisma/client';

export class RoomPlayerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional({ type: String })
  avatarUrl?: string;

  @ApiProperty()
  isReady: boolean;

  @ApiProperty()
  totalScore: number;

  @ApiProperty()
  joinedAt: Date;

  static fromEntity(
    player: RoomPlayer & {
      user: Pick<User, 'displayName' | 'avatarUrl'>;
    },
  ): RoomPlayerDto {
    return {
      id: player.id,
      userId: player.userId,
      displayName: player.user.displayName,
      avatarUrl: player.user.avatarUrl ?? undefined,
      isReady: player.isReady,
      totalScore: player.totalScore,
      joinedAt: player.joinedAt,
    };
  }
}
