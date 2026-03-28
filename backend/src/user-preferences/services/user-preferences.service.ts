import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '../../auth/services/auth.service';
import { UserPreferencesRepository } from '../repositories/user-preferences.repository';
import { UserPreferenceDto } from '../dto/user-preference.dto';
import { UpdateUserPreferenceDto } from '../dto/update-user-preference.dto';

@Injectable()
export class UserPreferencesService {
  private readonly logger = new Logger(UserPreferencesService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userPreferencesRepository: UserPreferencesRepository,
  ) {}

  /**
   * Given a user ID, fetches the user's preferences. Returns default preferences if none are found.
   * @param userId The ID of the user whose preferences are being fetched or created.
   * @returns The user preferences for the given user ID, either fetched from the database or default values if no preferences exist.
   */
  async get(userId: string): Promise<UserPreferenceDto> {
    return this.userPreferencesRepository.findByUserId(userId);
  }

  /**
   *  Given a session ID, retrieves the associated user and then fetches that user's preferences. If no preferences are found, returns default preferences.
   * @param sessionId The session ID used to identify the user whose preferences are being fetched or created.
   * @returns The user preferences for the user associated with the given session ID, either fetched from the database or default values if no preferences exist.
   */
  async getBySessionId(sessionId: string): Promise<UserPreferenceDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    return this.get(userId);
  }

  async update(
    sessionId: string,
    dto: UpdateUserPreferenceDto,
  ): Promise<UserPreferenceDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    return await this.userPreferencesRepository.upsert(userId, dto);
  }

  /**
   * Resolves the user's IANA timezone, falling back to 'UTC' if unset or invalid.
   * @param userId The ID of the user whose timezone is being resolved.
   * @returns The user's timezone if set and valid, or 'UTC' if unset or invalid.
   */
  async getUserTimezone(userId: string): Promise<string> {
    const prefs = await this.get(userId);
    const timezone = prefs?.timezone;
    if (!timezone) {
      return 'UTC';
    }
    try {
      Intl.DateTimeFormat('en-US', { timeZone: timezone });
      return timezone;
    } catch {
      this.logger.warn(
        `Invalid timezone "${timezone}" for user ${userId}, falling back to UTC`,
      );
      return 'UTC';
    }
  }
}
