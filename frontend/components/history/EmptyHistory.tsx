'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EmptyHistoryProps {
  dailyOnly: boolean;
}

export function EmptyHistory({ dailyOnly }: EmptyHistoryProps) {
  return (
    <div className="rounded-2xl border border-fg/10 bg-fg/[0.03] backdrop-blur-sm p-12 text-center">
      <p className="text-fg/60 mb-6">
        {dailyOnly ? 'No daily games yet.' : 'No games yet.'}
      </p>
      <Button variant="spotify" size="lg" asChild className="!rounded-full">
        <Link href="/daily" className="inline-flex items-center gap-2">
          Play Daily
        </Link>
      </Button>
    </div>
  );
}
