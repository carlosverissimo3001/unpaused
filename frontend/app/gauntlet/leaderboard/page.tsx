'use client';

import { AppHeader } from '@/components/features/AppHeader';
import { AppFooter } from '@/components/features/AppFooter';
import { GauntletLeaderboard } from '@/components/gauntlet/GauntletLeaderboard';
import { useMe } from '@/hooks/auth/useMe';
import { useLogout } from '@/hooks/auth/useLogout';

export default function LeaderboardPage() {
  const { data: user } = useMe();
  const logoutMutation = useLogout();

  return (
    <main className="min-h-screen flex flex-col relative overflow-x-hidden text-fg">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.12), transparent 50%)',
          }}
        />
      </div>

      <AppHeader
        user={user}
        onLogout={() => logoutMutation.mutate()}
        isLoggingOut={logoutMutation.isPending}
      />

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        <div className="max-w-lg mx-auto">
          <GauntletLeaderboard />
        </div>
      </div>

      <AppFooter />
    </main>
  );
}
