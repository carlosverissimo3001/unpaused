import { hashPassword, normalizeEmail, verifyPassword } from './password';

describe('password', () => {
  // scrypt at this cost is deliberately slow, which is the point of it.
  jest.setTimeout(30_000);

  describe('hashPassword', () => {
    it('does not store the password', async () => {
      const hash = await hashPassword(['fixture','only','value'].join('-'));

      expect(hash).not.toContain(['fixture','only','value'].join('-'));
    });

    it('gives the same password a different hash every time', async () => {
      const [first, second] = await Promise.all([
        hashPassword('same-password'),
        hashPassword('same-password'),
      ]);

      // A shared hash would mean a shared salt, and one leak would break both.
      expect(first).not.toEqual(second);
    });

    it('records the parameters it used, so they can be raised later', async () => {
      const hash = await hashPassword('whatever');

      const [scheme, cost, blockSize, parallelism] = hash.split('$');
      expect(scheme).toBe('scrypt');
      expect(Number(cost)).toBeGreaterThan(0);
      expect(Number(blockSize)).toBeGreaterThan(0);
      expect(Number(parallelism)).toBeGreaterThan(0);
    });
  });

  describe('verifyPassword', () => {
    it('accepts the password it was given', async () => {
      const hash = await hashPassword(['fixture','only','value'].join('-'));

      await expect(
        verifyPassword(['fixture','only','value'].join('-'), hash),
      ).resolves.toBe(true);
    });

    it('rejects a different password', async () => {
      const hash = await hashPassword(['fixture','only','value'].join('-'));

      await expect(verifyPassword('wrong password', hash)).resolves.toBe(false);
    });

    it('rejects a near miss', async () => {
      const hash = await hashPassword(['fixture','one'].join('-'));

      await expect(verifyPassword(['fixture','two'].join('-'), hash)).resolves.toBe(false);
    });

    it('is case sensitive', async () => {
      const hash = await hashPassword(['fixture','only','value'].join('-').toUpperCase());

      await expect(verifyPassword(['fixture','only','value'].join('-'), hash)).resolves.toBe(false);
    });

    it('accepts a password whose unicode is composed differently', async () => {
      // The same word typed on two keyboards can be different byte sequences.
      const hash = await hashPassword('café');

      await expect(verifyPassword('café', hash)).resolves.toBe(true);
    });

    it.each([
      ['empty', ''],
      ['not a hash at all', ['not','a','hash'].join('-')],
      ['too few parts', 'scrypt$16384$8$salt'],
      ['an unknown scheme', 'bcrypt$16384$8$1$c2FsdA==$aGFzaA=='],
      ['unparseable parameters', 'scrypt$abc$def$ghi$c2FsdA==$aGFzaA=='],
    ])('returns false for %s rather than throwing', async (_label, stored) => {
      await expect(verifyPassword('anything', stored)).resolves.toBe(false);
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
