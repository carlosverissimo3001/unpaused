import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '@redis/redis.service';
import {
  GUEST_SESSION_KEY_PREFIX,
  GUEST_SESSION_TTL_SECONDS,
} from '../guest.constants';

/**
 * Anonymous guest identity, ambient rather than a login: unlike SessionGuard,
 * nothing here ever rejects a request - a guest is provisioned on first
 * contact (see GuestSessionGuard) and simply exists from then on.
 */
@Injectable()
export class GuestSessionService {
  constructor(private readonly redis: RedisService) {}

  /** Creates a new guest identity and returns its id. */
  async createSession(): Promise<string> {
    const guestId = uuidv4();
    await this.redis.set(
      `${GUEST_SESSION_KEY_PREFIX}${guestId}`,
      String(Date.now()),
      GUEST_SESSION_TTL_SECONDS,
    );
    return guestId;
  }

  /**
   * Refreshes the TTL for an existing guest identity.
   * Returns false if the id is unknown/expired, so the caller can provision
   * a fresh one instead of trusting a stale cookie value.
   */
  async touch(guestId: string): Promise<boolean> {
    const key = `${GUEST_SESSION_KEY_PREFIX}${guestId}`;
    const exists = await this.redis.exists(key);
    if (!exists) {
      return false;
    }
    await this.redis.set(key, String(Date.now()), GUEST_SESSION_TTL_SECONDS);
    return true;
  }
}
