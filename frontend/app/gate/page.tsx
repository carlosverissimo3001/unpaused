import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { GateForm } from './GateForm';
import { safeNext } from '@/lib/safe-next';
import { SITE_ACCESS_COOKIE, isAccessTokenValid } from '@/lib/site-access';

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const access = (await cookies()).get(SITE_ACCESS_COOKIE)?.value;
  if (await isAccessTokenValid(access)) {
    redirect(safeNext((await searchParams).next));
  }
  return <GateForm />;
}
