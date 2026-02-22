import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerLimitDetail } from '@nestjs/throttler';
import { SESSION_COOKIE_NAME } from '../../consts';

/**
 * Custom throttler guard that identifies users by their session cookie
 * instead of IP address. Falls back to IP if no session cookie is present.
 */
@Injectable()
export class SessionThrottlerGuard extends ThrottlerGuard {
  async getTracker(req: Record<string, unknown>): Promise<string> {
    const cookies = req.cookies as Record<string, string> | undefined;
    return cookies?.[SESSION_COOKIE_NAME] ?? (req.ip as string);
  }

  protected async getErrorMessage(
    _context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<string> {
    const retryAfter = Math.ceil(throttlerLimitDetail.timeToExpire / 1000);
    return `Rate limit exceeded. Try again in ${retryAfter}s (limit: ${throttlerLimitDetail.limit} requests per minute).`;
  }
}
