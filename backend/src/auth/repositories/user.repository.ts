import { Injectable } from '@nestjs/common';
import { User as PrismaUser } from '@prisma/client';
import { UserEntity } from '../entities/user.entity';
import { PrismaService } from '@prisma/prisma.service';
import { UpsertUserDto } from '../dto/upsert-user.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Finds a user by their ID
   * @param id - The ID of the user
   * @returns The UserEntity
   */
  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });
    return user ? this.fromPrisma(user) : null;
  }

  /**
   * Finds a user by their Spotify user ID
   * @param spotifyUserId - The Spotify user ID of the user
   * @returns The UserEntity
   */
  async findBySpotifyUserId(spotifyUserId: string): Promise<UserEntity | null> {
    const user = await this.prismaService.user.findUnique({
      where: { spotifyUserId },
    });
    return user ? this.fromPrisma(user) : null;
  }

  /**
   * Upserts a user. On create: sets all fields including displayName.
   * On update: only syncs Spotify-owned fields (avatar, country, isTrusted)
   * so any custom displayName the user has set is preserved.
   */
  async upsert(data: UpsertUserDto): Promise<UserEntity> {
    const existing = await this.prismaService.user.findUnique({
      where: { spotifyUserId: data.spotifyUserId },
    });

    if (!existing) {
      const user = await this.prismaService.user.create({ data });
      return this.fromPrisma(user);
    }

    const user = await this.prismaService.user.update({
      where: { spotifyUserId: data.spotifyUserId },
      data: {
        avatarUrl: data.avatarUrl,
        country: data.country,
        ...(data.isTrusted !== undefined && { isTrusted: data.isTrusted }),
      },
    });
    return this.fromPrisma(user);
  }

  /**
   * Updates the display name for a user.
   */
  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { displayName },
    });
  }

  /**
   * Maps a Prisma user to a UserEntity
   * @param user - The Prisma user
   * @returns The UserEntity
   */
  private fromPrisma(user: PrismaUser): UserEntity {
    return {
      ...user,
      spotifyUserId: user.spotifyUserId ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      customAvatarUrl: user.customAvatarUrl ?? undefined,
      country: user.country ?? undefined,
    };
  }

  /**
   * Checks if a user is trusted
   * @param spotifyUserId - The Spotify user ID of the user
   * @returns True if the user is trusted, false otherwise
   */
  async isTrusted(spotifyUserId: string): Promise<boolean> {
    const user = await this.findBySpotifyUserId(spotifyUserId);
    return user?.isTrusted ?? false;
  }

  /**
   * Updates the encrypted refresh token for a user
   */
  async updateRefreshToken(
    spotifyUserId: string,
    encryptedRefreshToken: string,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { spotifyUserId },
      data: { encryptedRefreshToken },
    });
  }

  /**
   * Gets the encrypted refresh token for a user
   */
  async getRefreshToken(spotifyUserId: string): Promise<string | undefined> {
    const user = await this.prismaService.user.findUnique({
      where: { spotifyUserId },
      select: { encryptedRefreshToken: true },
    });
    return user?.encryptedRefreshToken ?? undefined;
  }
}
