import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import {
  EMAIL_COOLDOWN_PREFIX,
  EMAIL_DAILY_PREFIX,
  EMAIL_SEND_COOLDOWN_SECONDS,
  EMAIL_SEND_DAILY_LIMIT,
  EMAIL_SEND_DAY_SECONDS,
} from '../consts';
import { emailFingerprint } from '../utils/auth-token';

/**
 * How often one address may be mailed, whether or not anyone is registered at
 * it.
 *
 * The "whether or not" is the point. If a registered address were rate limited
 * and an unknown one were not, the difference between the two answers tells a
 * caller which addresses have accounts here -- the same thing the endpoints go
 * out of their way not to say. So the limit is recorded against every address
 * that is submitted, and the caller is never told it applied.
 */
@Injectable()
export class EmailSendLimiter {
  constructor(private readonly redis: RedisService) {}

  /**
   * Records the attempt and says whether a mail may go out. Always call it,
   * even for an address with no account: skipping it for unknown addresses is
   * what would make the timing readable.
   */
  async claim(email: string): Promise<boolean> {
    const id = emailFingerprint(email);
    const cooldownKey = `${EMAIL_COOLDOWN_PREFIX}${id}`;
    const dailyKey = `${EMAIL_DAILY_PREFIX}${id}`;

    if (await this.redis.exists(cooldownKey)) {
      return false;
    }

    const client = this.redis.getClient();
    const sentToday = await client.incr(dailyKey);
    if (sentToday === 1) {
      await client.expire(dailyKey, EMAIL_SEND_DAY_SECONDS);
    }
    if (sentToday > EMAIL_SEND_DAILY_LIMIT) {
      return false;
    }

    await this.redis.set(cooldownKey, '1', EMAIL_SEND_COOLDOWN_SECONDS);
    return true;
  }
}
