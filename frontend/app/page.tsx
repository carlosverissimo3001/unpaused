import { cookies } from 'next/headers';
import { HomeClient } from './HomeClient';
import { SITE_ACCESS_COOKIE, isAccessTokenValid } from '@/lib/site-access';

export default async function Home() {
  // The access cookie is httpOnly, so the client cannot answer this for itself.
  const canSignIn = await isAccessTokenValid(
    (await cookies()).get(SITE_ACCESS_COOKIE)?.value,
  );

  return <HomeClient canSignIn={canSignIn} />;
}
