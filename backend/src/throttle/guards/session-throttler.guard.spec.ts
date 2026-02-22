import { ExecutionContext } from '@nestjs/common';
import { SessionThrottlerGuard } from './session-throttler.guard';
import { SESSION_COOKIE_NAME } from '../../consts';

type ThrottlerLimitDetail = {
  timeToExpire: number;
  limit: number;
};
describe('SessionThrottlerGuard', () => {
  let guard: SessionThrottlerGuard;

  beforeEach(() => {
    guard = Object.create(SessionThrottlerGuard.prototype);
  });

  describe('getTracker', () => {
    it('should return the session cookie value when present', async () => {
      const req = {
        cookies: { [SESSION_COOKIE_NAME]: 'session-abc-123' },
        ip: '192.168.1.1',
      };

      const result = await guard.getTracker(req);
      expect(result).toBe('session-abc-123');
    });

    it('should fall back to IP when session cookie is missing', async () => {
      const req = {
        cookies: {} as Record<string, string>,
        ip: '10.0.0.1',
      };

      const result = await guard.getTracker(req);
      expect(result).toBe('10.0.0.1');
    });

    it('should fall back to IP when cookies object is undefined', async () => {
      const req = {
        cookies: undefined,
        ip: '172.16.0.1',
      };

      const result = await guard.getTracker(req);
      expect(result).toBe('172.16.0.1');
    });
  });

  describe('getErrorMessage', () => {
    const mockContext = {} as ExecutionContext;

    it('should return a human-readable message with limit and retry-after', async () => {
      const detail = {
        timeToExpire: 45000,
        limit: 20,
      } as ThrottlerLimitDetail;

      const message = await guard['getErrorMessage'](
        mockContext,
        detail as any,
      );
      expect(message).toBe(
        'Rate limit exceeded. Try again in 45s (limit: 20 requests per minute).',
      );
    });

    it('should ceil fractional seconds', async () => {
      const detail = {
        timeToExpire: 1500,
        limit: 60,
      } as ThrottlerLimitDetail;

      const message = await guard['getErrorMessage'](
        mockContext,
        detail as any,
      );
      expect(message).toBe(
        'Rate limit exceeded. Try again in 2s (limit: 60 requests per minute).',
      );
    });

    it('should handle sub-second expiry', async () => {
      const detail = {
        timeToExpire: 200,
        limit: 10,
      } as ThrottlerLimitDetail;

      const message = await guard['getErrorMessage'](
        mockContext,
        detail as any,
      );
      expect(message).toBe(
        'Rate limit exceeded. Try again in 1s (limit: 10 requests per minute).',
      );
    });
  });
});
