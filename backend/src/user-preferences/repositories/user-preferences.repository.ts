import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPreference } from '@prisma/client';
import { UserPreferenceDto } from '../dto/user-preference.dto';

@Injectable()
export class UserPreferencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserPreferenceDto | null> {
    const preference = await this.prisma.userPreference.findUnique({
      where: { userId },
    });
    return preference ? this.fromPrisma(preference) : null;
  }

  async upsert(
    userId: string,
    data: Partial<
      Pick<
        UserPreference,
        | 'showAlbumHint'
        | 'showTextHints'
        | 'reducedMotion'
        | 'showGuessHistory'
        | 'timezone'
      >
    >,
  ): Promise<UserPreferenceDto> {
    const preference = await this.prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return this.fromPrisma(preference);
  }

  fromPrisma(prefs: UserPreference): UserPreferenceDto {
    return {
      ...prefs,
    };
  }
}
