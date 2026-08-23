/**
 * Route gating in proxy.ts. The guest cases are the ones that matter: guest
 * play lives under /game, which is otherwise session-gated, so a careless
 * prefix match sends the signed-out visitor it exists for back to /.
 */

import { NextRequest } from 'next/server';
import { proxy } from './proxy';

function request(pathname: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(`https://unpaused.test${pathname}`));
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

const SESSION = { unpaused_session: 'a-session-id' };

describe('proxy route gating', () => {
  test('lets a signed out visitor reach guest play', async () => {
    const response = await proxy(request('/game/guest'));
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  test('sends a signed out visitor away from a playlist game', async () => {
    const response = await proxy(request('/game/some-playlist-id'));
    expect(response.headers.get('location')).toBe('https://unpaused.test/');
  });

  test('lets a signed in visitor reach a playlist game', async () => {
    const response = await proxy(request('/game/some-playlist-id', SESSION));
    expect(response.status).toBe(200);
  });

  test.each(['/daily', '/speed-run', '/history', '/preferences', '/admin'])(
    'gates %s on a session',
    async (pathname) => {
      const response = await proxy(request(pathname));
      expect(response.headers.get('location')).toBe('https://unpaused.test/');
    },
  );

  test('leaves the multiplayer join flow to handle sign in itself', async () => {
    const response = await proxy(request('/multiplayer/join/ABCD'));
    expect(response.status).toBe(200);
  });

  test('gates a multiplayer room on a session', async () => {
    const response = await proxy(request('/multiplayer/room-id'));
    expect(response.headers.get('location')).toBe('https://unpaused.test/');
  });
});
