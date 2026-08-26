/**
 * The return token is what stands in for the site password months later, so
 * the thing worth pinning is that it cannot be made without the secret.
 */

import {
  readSpotifyReturnToken,
  signSpotifyReturnToken,
} from '@/lib/site-access';

const ORIGINAL = process.env.SITE_PASSWORD;

beforeEach(() => {
  process.env.SITE_PASSWORD = 'the-site-password';
});

afterAll(() => {
  process.env.SITE_PASSWORD = ORIGINAL;
});

describe('spotify return token', () => {
  test('round trips the id it was signed for', async () => {
    const token = await signSpotifyReturnToken('spotify-user-1');
    expect(await readSpotifyReturnToken(token)).toBe('spotify-user-1');
  });

  test('survives an id that is not plain ascii', async () => {
    const token = await signSpotifyReturnToken('usuário.tëst-99');
    expect(await readSpotifyReturnToken(token)).toBe('usuário.tëst-99');
  });

  test('rejects a token whose id was swapped for someone else', async () => {
    const token = await signSpotifyReturnToken('spotify-user-1');
    const [, signature] = token!.split('.');
    const forged = `${Buffer.from('someone-else').toString('base64url')}.${signature}`;
    expect(await readSpotifyReturnToken(forged)).toBeNull();
  });

  test('rejects a token signed with a different password', async () => {
    const token = await signSpotifyReturnToken('spotify-user-1');
    process.env.SITE_PASSWORD = 'a-rotated-password';
    expect(await readSpotifyReturnToken(token)).toBeNull();
  });

  test.each([undefined, '', 'no-separator', '.only-a-signature'])(
    'reads nothing out of %p',
    async (value) => {
      expect(await readSpotifyReturnToken(value)).toBeNull();
    },
  );

  test('signs nothing when there is no password to sign with', async () => {
    delete process.env.SITE_PASSWORD;
    expect(await signSpotifyReturnToken('spotify-user-1')).toBeNull();
  });
});
