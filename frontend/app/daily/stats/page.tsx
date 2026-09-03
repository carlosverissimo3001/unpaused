import { redirect } from 'next/navigation';

/**
 * Daily stats live on the daily tab of the vault now. This route stays because
 * it is linked from the reveal card and from anywhere a player bookmarked it —
 * deleting it outright would break the end of a daily round.
 */
export default async function DailyStatsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ earnFreezes?: string }>;
}) {
  const { earnFreezes } = await searchParams;
  redirect(
    earnFreezes === '1'
      ? '/history?filter=daily&earnFreezes=1'
      : '/history?filter=daily',
  );
}
