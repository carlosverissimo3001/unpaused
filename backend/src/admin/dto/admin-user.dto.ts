import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvatarSource, User } from '@prisma/client';

export class AdminUserDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  spotifyUserId?: string;

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
    const effectiveAvatarUrl =
      entity.avatarSource === AvatarSource.CUSTOM
        ? entity.customAvatarUrl
        : entity.avatarUrl;

    return {
      id: entity.id,
      spotifyUserId: entity.spotifyUserId ?? undefined,
      displayName: entity.displayName,
      avatarUrl: effectiveAvatarUrl ?? undefined,
      isTrusted: entity.isTrusted,
      isAdmin: entity.isAdmin,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
