import { cookies } from 'next/headers';
import { SignInClient } from './SignInClient';
import {
  SITE_ACCESS_COOKIE,
  SPOTIFY_RETURN_COOKIE,
  isAccessTokenValid,
  readSpotifyReturnToken,
} from '@/lib/site-access';

export default async function SignInPage() {
  const jar = await cookies();

  const canSignIn =
    (await isAccessTokenValid(jar.get(SITE_ACCESS_COOKIE)?.value)) ||
    !!(await readSpotifyReturnToken(jar.get(SPOTIFY_RETURN_COOKIE)?.value));

  return <SignInClient canSignIn={canSignIn} />;
}
