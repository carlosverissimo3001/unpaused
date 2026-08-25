import { cookies } from 'next/headers';
import { JoinByCodeClient } from '@/components/multiplayer/JoinByCodeClient';
import { SITE_ACCESS_COOKIE, isAccessTokenValid } from '@/lib/site-access';

export default async function JoinByCodePage() {
  // The access cookie is httpOnly, so the client cannot answer this for itself.
  const canSignIn = await isAccessTokenValid(
    (await cookies()).get(SITE_ACCESS_COOKIE)?.value,
  );

  return <JoinByCodeClient canSignIn={canSignIn} />;
}
