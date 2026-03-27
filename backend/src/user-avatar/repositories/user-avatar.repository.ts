import { Injectable, NotFoundException } from '@nestjs/common';
import { AvatarSource, Prisma, User } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class UserAvatarRepository {
  constructor(private readonly prisma: PrismaService) {}

  async setCustomAvatar(
    userId: string,
    customAvatarUrl: string,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        customAvatarUrl,
        avatarSource: AvatarSource.CUSTOM,
      },
    });
  }

  async setAvatarSource(userId: string, source: AvatarSource): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { avatarSource: source },
      });
    } catch (err) {
      // TODO(agent): Consider creating a custom error wrapper PrismaToUnpausedError to handle this more elegantly across the codebase
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw err;
    }
  }
}
