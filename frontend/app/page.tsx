'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/auth/useMe';
import { consumeAuthReturnUrl } from '@/lib/auth-return';
import { StreakFreezePrompt } from '@/components/streak/StreakFreezePrompt';
import { useMyPlaylists } from '@/hooks/playlists/useMyPlaylists';
import { useLogout } from '@/hooks/auth/useLogout';
import { useTokenLogin } from '@/hooks/auth/useTokenLogin';
import { usePlaylistFilters } from '@/hooks/playlists/usePlaylistFilters';
import { useAuthError } from '@/hooks/auth/useAuthError';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { AppHeader } from '@/components/features/AppHeader';
import { DailyChallengeBanner } from '@/components/features/DailyChallengeBanner';
import { PlaylistFilters } from '@/components/features/playlist/PlaylistFilters';
import { PlaylistGrid } from '@/components/features/playlist/PlaylistGrid';
import { UnauthenticatedView } from '@/components/features/UnauthenticatedView';
import { AppFooter } from '@/components/features/AppFooter';
import { MultiplayerBanner } from '@/components/multiplayer/MultiplayerBanner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Home() {
  const [tokenInput, setTokenInput] = useState('');
  const [ambientColor, setAmbientColor] = useState<string>(
    'rgba(30, 215, 96, 0.1)',
  );

  const router = useRouter();
  const playlistFilters = usePlaylistFilters();
  const { error } = useAuthError();

  const { data: user, isLoading: isLoadingUser } = useMe();

  // Handle post-OAuth redirect back to multiplayer join (or other) pages
  useEffect(() => {
    if (user) {
      const returnUrl = consumeAuthReturnUrl();
      if (returnUrl) {
        router.replace(returnUrl);
      }
    }
  }, [user, router]);
  const { data: playlistsResponse, isLoading: isLoadingPlaylists } =
    useMyPlaylists({
      onlyPublic: playlistFilters.visibility === 'public',
      onlyPrivate: playlistFilters.visibility === 'private',
      sortBy: playlistFilters.sortBy,
      enabled: !!user,
    });
  const logoutMutation = useLogout();
  const tokenLoginMutation = useTokenLogin();
  const [streakDismissed, setStreakDismissed] = useState(false);

  const handleLogout = async () => {
    logoutMutation.mutate();
  };

  const handleTokenLogin = async (token: string) => {
    await tokenLoginMutation.mutateAsync({
      accessToken: token,
    });
  };

  const playlists = playlistsResponse?.items || [];

  if (isLoadingUser) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-[100vw] flex flex-col relative overflow-x-hidden text-fg">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />
        <motion.div
          className="absolute inset-0"
          animate={{
            background: `radial-gradient(circle 80% 50% at 50% 0%, ${ambientColor}, transparent 70%)`,
          }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            filter: 'blur(60px)',
            opacity: 0.4,
          }}
        />
      </div>

      <AppHeader
        user={user}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      />

      <div className="flex-1 px-4 sm:px-6 py-2 sm:py-8 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-3 sm:gap-6">
          <ErrorBanner error={error} />

          {user ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4 sm:space-y-6"
            >
              <DailyChallengeBanner isTrusted={user.isTrusted} />
              <MultiplayerBanner />

              {/* Main Content Header */}
              <div className="mt-1 sm:mt-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
                  <div className="flex items-baseline gap-2 sm:gap-3">
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-fg whitespace-nowrap">
                      Your Playlists
                    </h1>

                    {!isLoadingPlaylists && (
                      <span className="text-sm sm:text-lg font-mono text-spotify-green/70 font-light tracking-tighter shrink-0">
                        /{playlists.length.toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  <PlaylistFilters
                    visibility={playlistFilters.visibility}
                    onVisibilityChange={playlistFilters.setVisibility}
                    sortBy={playlistFilters.sortBy}
                    onSortByChange={playlistFilters.setSortBy}
                  />
                </div>

                <motion.div
                  animate={{ borderColor: ambientColor }}
                  className="w-full h-px border-b border-fg/5 mt-4 opacity-30"
                />
              </div>

              <PlaylistGrid
                playlists={playlists}
                isLoading={isLoadingPlaylists}
                onPlaylistHover={setAmbientColor}
                onClearFilters={playlistFilters.clearFilters}
              />
            </motion.div>
          ) : (
            <UnauthenticatedView
              onTokenLogin={handleTokenLogin}
              tokenInput={tokenInput}
              setTokenInput={setTokenInput}
              isTokenLoginPending={tokenLoginMutation.isPending}
              tokenLoginError={tokenLoginMutation.error || null}
            />
          )}
        </div>
      </div>

      <AppFooter />

      {/* Streak at risk overlay */}
      {!streakDismissed && (
        <StreakFreezePrompt onResolved={() => setStreakDismissed(true)} />
      )}
    </main>
  );
}
