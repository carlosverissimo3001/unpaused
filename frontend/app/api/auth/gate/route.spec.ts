/**
 * Tests for rate limiter functionality
 */

import { authGateRateLimiter } from '@/lib/rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset the rate limiter between tests
    authGateRateLimiter.reset('test-ip');
  });

  test('should allow requests within limit', () => {
    const ip = '192.168.1.1';

    // First 5 attempts should be allowed
    for (let i = 0; i < 5; i++) {
      const status = authGateRateLimiter.check(ip);
      expect(status.isBlocked).toBe(false);
      expect(status.remainingAttempts).toBeGreaterThan(0);
      authGateRateLimiter.recordAttempt(ip);
    }
  });

  test('should block after exceeding limit', () => {
    const ip = '192.168.1.2';

    // Record 5 failed attempts
    for (let i = 0; i < 5; i++) {
      authGateRateLimiter.recordAttempt(ip);
    }

    // 6th attempt should be blocked
    const status = authGateRateLimiter.check(ip);
    expect(status.isBlocked).toBe(true);
    expect(status.remainingAttempts).toBe(0);
    expect(status.retryAfter).toBeGreaterThan(0);
  });

  test('should reset after successful authentication', () => {
    const ip = '192.168.1.3';

    // Record some failed attempts
    authGateRateLimiter.recordAttempt(ip);
    authGateRateLimiter.recordAttempt(ip);

    // Reset after successful auth
    authGateRateLimiter.reset(ip);

    // Should be able to attempt again
    const status = authGateRateLimiter.check(ip);
    expect(status.isBlocked).toBe(false);
    expect(status.remainingAttempts).toBe(5);
  });

  test('should handle multiple IPs independently', () => {
    const ip1 = '192.168.1.4';
    const ip2 = '192.168.1.5';

    // Block first IP
    for (let i = 0; i < 5; i++) {
      authGateRateLimiter.recordAttempt(ip1);
    }

    // Second IP should still be allowed
    const status1 = authGateRateLimiter.check(ip1);
    const status2 = authGateRateLimiter.check(ip2);

    expect(status1.isBlocked).toBe(true);
    expect(status2.isBlocked).toBe(false);
  });
});
