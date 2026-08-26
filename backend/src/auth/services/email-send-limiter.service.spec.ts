/**
 * The limiter's job is to be indifferent to whether an address has an account.
 * If it were not, how fast it answered would be an answer.
 */

import { Test } from '@nestjs/testing';
import { RedisService } from '../../redis/redis.service';
import { EmailSendLimiter } from './email-send-limiter.service';
import { EMAIL_SEND_DAILY_LIMIT } from '../consts';
import { emailFingerprint } from '../utils/auth-token';

describe('EmailSendLimiter', () => {
  const store = new Map<string, number>();
  const cooldowns = new Set<string>();

  const client = {
    incr: jest.fn((key: string) => {
      const next = (store.get(key) ?? 0) + 1;
      store.set(key, next);
      return Promise.resolve(next);
    }),
    expire: jest.fn().mockResolvedValue(1),
  };

  const redis = {
    getClient: () => client,
    exists: jest.fn((key: string) => Promise.resolve(cooldowns.has(key))),
    set: jest.fn((key: string) => {
      cooldowns.add(key);
      return Promise.resolve();
    }),
  };

  async function build() {
    const module = await Test.createTestingModule({
      providers: [EmailSendLimiter, { provide: RedisService, useValue: redis }],
    }).compile();
    return module.get(EmailSendLimiter);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    store.clear();
    cooldowns.clear();
  });

  it('allows the first mail to an address', async () => {
    const limiter = await build();
    await expect(limiter.claim('player@example.com', 'verify')).resolves.toBe(
      true,
    );
  });

  it('refuses a second one straight away', async () => {
    const limiter = await build();
    await limiter.claim('player@example.com', 'verify');
    await expect(limiter.claim('player@example.com', 'verify')).resolves.toBe(
      false,
    );
  });

  it('holds separate cooldowns for separate addresses', async () => {
    const limiter = await build();
    await limiter.claim('one@example.com', 'verify');
    await expect(limiter.claim('two@example.com', 'verify')).resolves.toBe(
      true,
    );
  });

  it('stops at the daily cap even once the cooldowns have passed', async () => {
    const limiter = await build();

    for (let i = 0; i < EMAIL_SEND_DAILY_LIMIT; i++) {
      cooldowns.clear();
      await expect(limiter.claim('player@example.com', 'verify')).resolves.toBe(
        true,
      );
    }

    cooldowns.clear();
    await expect(limiter.claim('player@example.com', 'verify')).resolves.toBe(
      false,
    );
  });

  it('gives the day counter a lifetime, so it cannot outlive the day', async () => {
    const limiter = await build();
    await limiter.claim('player@example.com', 'verify');
    expect(client.expire).toHaveBeenCalledTimes(1);

    cooldowns.clear();
    await limiter.claim('player@example.com', 'verify');
    expect(client.expire).toHaveBeenCalledTimes(1);
  });

  it('gives each purpose its own budget, so one cannot spend the other', async () => {
    const limiter = await build();

    await expect(limiter.claim('player@example.com', 'verify')).resolves.toBe(
      true,
    );
    // Same address, same instant: a shared cooldown would refuse this.
    await expect(limiter.claim('player@example.com', 'reset')).resolves.toBe(
      true,
    );
  });

  it('never writes the address itself into a key', async () => {
    const limiter = await build();
    await limiter.claim('player@example.com', 'verify');

    const keys = [
      ...redis.exists.mock.calls.flat(),
      ...redis.set.mock.calls.flat(),
      ...client.incr.mock.calls.flat(),
    ].join(' ');

    expect(keys).not.toContain('player@example.com');
    expect(keys).toContain(emailFingerprint('player@example.com'));
  });
});
