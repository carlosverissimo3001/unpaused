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
   * Gets all trusted users from the database
   * @returns The UserEntities
   */
  async getTrustedUsers(): Promise<UserEntity[]> {
    const users = await this.prismaService.user.findMany({
      where: { isTrusted: true },
    });
    return users.map((user) => this.fromPrisma(user));
  }

  /**
   * Upserts a user
   * @param data - The data to upsert the user with
   * @returns The UserEntity
   */
  async upsert(data: UpsertUserDto): Promise<UserEntity> {
    const user = await this.prismaService.user.upsert({
      where: { spotifyUserId: data.spotifyUserId },
      create: data,
      update: data,
    });
    return this.fromPrisma(user);
  }

  /**
   * Maps a Prisma user to a UserEntity
   * @param user - The Prisma user
   * @returns The UserEntity
   */
  private fromPrisma(user: PrismaUser): UserEntity {
    // This is a weird syntax, but will allow us to map something like a null to undefined lated
    return {
      ...user,
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
}
