import { cookies } from 'next/headers';
import { HomeClient } from './HomeClient';
import {
  SITE_ACCESS_COOKIE,
  SPOTIFY_RETURN_COOKIE,
  isAccessTokenValid,
  readSpotifyReturnToken,
} from '@/lib/site-access';

export default async function Home() {
  // Both cookies are httpOnly, so the client cannot answer this for itself.
  const jar = await cookies();

  // Same two answers the proxy accepts on /api/auth/login. If they disagreed,
  // the button would lie in one direction or the other.
  const canSignIn =
    (await isAccessTokenValid(jar.get(SITE_ACCESS_COOKIE)?.value)) ||
    !!(await readSpotifyReturnToken(jar.get(SPOTIFY_RETURN_COOKIE)?.value));

  return <HomeClient canSignIn={canSignIn} />;
}
