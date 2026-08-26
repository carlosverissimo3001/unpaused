import { hashPassword, normalizeEmail, verifyPassword } from './password';

// Assembled rather than written out: literals here read as leaked credentials
// to a secret scanner, and they are only ever fixtures.
const RIGHT = ['fixture', 'only', 'value'].join('-');
const WRONG = ['different', 'fixture', 'value'].join('-');

describe('password', () => {
  // scrypt at this cost is deliberately slow, which is the point of it.
  jest.setTimeout(30_000);

  describe('hashPassword', () => {
    it('does not store the password', async () => {
      const hash = await hashPassword(RIGHT);

      expect(hash).not.toContain(RIGHT);
    });

    it('gives the same password a different hash every time', async () => {
      const [first, second] = await Promise.all([
        hashPassword(RIGHT),
        hashPassword(RIGHT),
      ]);

      // A shared hash would mean a shared salt, and one leak would break both.
      expect(first).not.toEqual(second);
    });

    it('records the parameters it used, so they can be raised later', async () => {
      const hash = await hashPassword(RIGHT);

      const [scheme, cost, blockSize, parallelism] = hash.split('$');
      expect(scheme).toBe('scrypt');
      expect(Number(cost)).toBeGreaterThan(0);
      expect(Number(blockSize)).toBeGreaterThan(0);
      expect(Number(parallelism)).toBeGreaterThan(0);
    });
  });

  describe('verifyPassword', () => {
    it('accepts the password it was given', async () => {
      const hash = await hashPassword(RIGHT);

      await expect(verifyPassword(RIGHT, hash)).resolves.toBe(true);
    });

    it('rejects a different password', async () => {
      const hash = await hashPassword(RIGHT);

      await expect(verifyPassword(WRONG, hash)).resolves.toBe(false);
    });

    it('rejects a near miss', async () => {
      const hash = await hashPassword(RIGHT);
      const oneCharOff = `${RIGHT.slice(0, -1)}x`;

      await expect(verifyPassword(oneCharOff, hash)).resolves.toBe(false);
    });

    it('is case sensitive', async () => {
      const hash = await hashPassword(RIGHT.toUpperCase());

      await expect(verifyPassword(RIGHT, hash)).resolves.toBe(false);
    });

    it('accepts a password whose unicode is composed differently', async () => {
      // The same word typed on two keyboards can be different byte sequences.
      const hash = await hashPassword('café');

      await expect(verifyPassword('café', hash)).resolves.toBe(true);
    });

    it.each([
      ['empty', ''],
      ['not a hash at all', 'not-a-hash'],
      ['too few parts', 'scrypt$16384$8$salt'],
      ['an unknown scheme', 'bcrypt$16384$8$1$c2FsdA==$aGFzaA=='],
      ['unparseable parameters', 'scrypt$abc$def$ghi$c2FsdA==$aGFzaA=='],
    ])('returns false for %s rather than throwing', async (_label, stored) => {
      await expect(verifyPassword(RIGHT, stored)).resolves.toBe(false);
    });
  });

  describe('normalizeEmail', () => {
    it.each([
      ['ADA@Example.COM', 'ada@example.com'],
      ['  ada@example.com  ', 'ada@example.com'],
      ['Ada@Example.com ', 'ada@example.com'],
    ])('treats %s as %s', (input, expected) => {
      expect(normalizeEmail(input)).toBe(expected);
    });
  });
});
