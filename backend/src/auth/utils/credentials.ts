import { UserEntity } from '../entities/user.entity';

/**
 * Whether a row is an account rather than an anonymous player. Spotify is the
 * only credential today; CAR-188 adds a second, and this is the one place that
 * has to learn about it.
 */
export function hasCredential(
  user: Pick<UserEntity, 'spotifyUserId'> | null | undefined,
): boolean {
  return !!user?.spotifyUserId;
}
