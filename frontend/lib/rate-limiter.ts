/**
 * Simple in-memory rate limiter for API routes
 * Tracks attempts by IP address and blocks after exceeding threshold
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;
  private lastCleanup: number = Date.now();
  private readonly cleanupIntervalMs: number = 5 * 60 * 1000; // 5 minutes

  constructor(
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    blockDurationMs: number = 15 * 60 * 1000 // 15 minutes
  ) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;
  }

  /**
   * Check if an identifier (e.g., IP address) is rate limited
   * @param identifier - Unique identifier (typically IP address)
   * @returns Object with isBlocked status and remaining attempts
   */
  check(identifier: string): {
    isBlocked: boolean;
    remainingAttempts: number;
    retryAfter?: number;
  } {
    this.maybeCleanup();
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        isBlocked: true,
        remainingAttempts: 0,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      };
    }

    // Reset if window has passed
    if (!entry || entry.resetTime < now) {
      return {
        isBlocked: false,
        remainingAttempts: this.maxAttempts,
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.maxAttempts) {
      const blockedUntil = now + this.blockDurationMs;
      this.attempts.set(identifier, {
        ...entry,
        blockedUntil,
      });
      return {
        isBlocked: true,
        remainingAttempts: 0,
        retryAfter: Math.ceil(this.blockDurationMs / 1000),
      };
    }

    return {
      isBlocked: false,
      remainingAttempts: this.maxAttempts - entry.count,
    };
  }

  /**
   * Record an attempt for an identifier
   * @param identifier - Unique identifier (typically IP address)
   */
  recordAttempt(identifier: string): void {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry || entry.resetTime < now) {
      // Start new window
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
    } else {
      // Increment count in current window
      this.attempts.set(identifier, {
        ...entry,
        count: entry.count + 1,
      });
    }
  }

  /**
   * Reset attempts for an identifier (e.g., after successful authentication)
   * @param identifier - Unique identifier (typically IP address)
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Run cleanup if enough time has passed since last cleanup
   */
  private maybeCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupIntervalMs) {
      this.cleanup();
      this.lastCleanup = now;
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.attempts.forEach((entry, key) => {
      // Remove if reset time has passed and not currently blocked
      if (entry.resetTime < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.attempts.delete(key));
  }
}

// Create a singleton instance for the auth gate
export const authGateRateLimiter = new RateLimiter(
  5, // Max 5 attempts
  15 * 60 * 1000, // Within 15 minutes
  15 * 60 * 1000 // Block for 15 minutes
);
