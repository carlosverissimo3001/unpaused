import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@prisma/client';

export class AdminUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  spotifyUserId: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional({ type: String })
  avatarUrl?: string;

  @ApiProperty()
  isTrusted: boolean;

  @ApiProperty()
  isAdmin: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: User): AdminUserDto {
    return {
      id: entity.id,
      spotifyUserId: entity.spotifyUserId,
      displayName: entity.displayName,
      avatarUrl: entity.avatarUrl ?? undefined,
      isTrusted: entity.isTrusted,
      isAdmin: entity.isAdmin,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
