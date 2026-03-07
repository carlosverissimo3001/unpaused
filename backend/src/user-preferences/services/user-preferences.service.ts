import { Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/services/auth.service';
import { UserPreferencesRepository } from '../repositories/user-preferences.repository';
import { UserPreferenceDto } from '../dto/user-preference.dto';
import { UpdateUserPreferenceDto } from '../dto/update-user-preference.dto';

@Injectable()
export class UserPreferencesService {
  constructor(
    private readonly authService: AuthService,
    private readonly userPreferencesRepository: UserPreferencesRepository,
  ) {}

  async get(sessionId: string): Promise<UserPreferenceDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    return await this.userPreferencesRepository.upsert(userId, {});
  }

  async update(
    sessionId: string,
    dto: UpdateUserPreferenceDto,
  ): Promise<UserPreferenceDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    return await this.userPreferencesRepository.upsert(userId, dto);
  }
}
