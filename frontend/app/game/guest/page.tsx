import { cookies } from 'next/headers';
import { GuestGamePage } from '@/components/game/GuestGamePage';
import { SITE_ACCESS_COOKIE, isAccessTokenValid } from '@/lib/site-access';

export default async function GuestPlaylistGamePage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  // Arriving from the landing page's Play button carries the gesture with it,
  // so the round starts without asking for a second click.
  const autoStart = (await searchParams).start === '1';

  // The access cookie is httpOnly, so the client cannot answer this for itself.
  const canSignIn = await isAccessTokenValid(
    (await cookies()).get(SITE_ACCESS_COOKIE)?.value,
  );

  return <GuestGamePage canSignIn={canSignIn} autoStart={autoStart} />;
}
