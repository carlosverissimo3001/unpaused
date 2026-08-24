'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMe } from '@/hooks/auth/useMe';
import { consumeAuthReturnUrl, peekAuthReturnUrl } from '@/lib/auth-return';
import { StreakFreezePrompt } from '@/components/streak/StreakFreezePrompt';
import { useMyPlaylists } from '@/hooks/playlists/useMyPlaylists';
import { useLogout } from '@/hooks/auth/useLogout';
import { usePlaylistFilters } from '@/hooks/playlists/usePlaylistFilters';
import { useAuthError } from '@/hooks/auth/useAuthError';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { AppHeader } from '@/components/features/AppHeader';
import { GameModesGallery } from '@/components/features/GameModesGallery';
import { PlaylistFilters } from '@/components/features/playlist/PlaylistFilters';
import { PlaylistGrid } from '@/components/features/playlist/PlaylistGrid';
import { UnauthenticatedView } from '@/components/features/UnauthenticatedView';
import { AppFooter } from '@/components/features/AppFooter';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTimezoneSync } from '@/hooks/user-preferences/useTimezoneSync';

export function HomeClient({ canSignIn }: { canSignIn: boolean }) {
  const playlistFilters = usePlaylistFilters();
  const { error } = useAuthError();

  const { data: user, isLoading: isLoadingUser } = useMe();

  // Every visitor who starts a round has a session, so a session no longer
  // means signed in. Only a linked credential does.
  const hasAccount = !!user?.hasLinkedAccount;

  useTimezoneSync({ enabled: hasAccount });

  // Detect post-OAuth pending redirect synchronously on mount so we can
  // render a blank overlay instead of a flash of the homepage while
  // useMe resolves and consumeAuthReturnUrl fires below.
  const [hasPendingReturn, setHasPendingReturn] = useState(false);
  useEffect(() => {
    if (peekAuthReturnUrl()) {
      // A useState initialiser would read sessionStorage during hydration and
      // mismatch the server render, reintroducing the flash this prevents.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasPendingReturn(true);
    }
  }, []);

  // Hard navigation: a return url can point at a rewrite the client router
  // cannot resolve locally.
  useEffect(() => {
    if (hasAccount) {
      const returnUrl = consumeAuthReturnUrl();
      if (returnUrl) {
        window.location.replace(returnUrl);
      }
    }
  }, [hasAccount]);
  const { data: playlistsResponse, isLoading: isLoadingPlaylists } =
    useMyPlaylists({
      onlyPublic: playlistFilters.visibility === 'public',
      onlyPrivate: playlistFilters.visibility === 'private',
      sortBy: playlistFilters.sortBy,
      enabled: hasAccount,
    });
  const logoutMutation = useLogout();
  const [streakDismissed, setStreakDismissed] = useState(false);

  const handleLogout = async () => {
    logoutMutation.mutate();
  };

  const playlists = playlistsResponse?.items || [];

  // Suppress homepage flash when we know a returnTo redirect is queued.
  // Renders a black full-bleed div until the redirect effect above fires.
  if (hasPendingReturn) {
    return <main aria-hidden="true" className="min-h-screen bg-black" />;
  }

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
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle 80% 50% at 50% 0%, rgba(30,215,96,0.1), transparent 70%)',
            filter: 'blur(60px)',
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

          {hasAccount ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4 sm:space-y-6"
            >
              <GameModesGallery isTrusted={user.isTrusted} />

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

                <div className="mt-4" />
              </div>

              <PlaylistGrid
                playlists={playlists}
                isLoading={isLoadingPlaylists}
                onClearFilters={playlistFilters.clearFilters}
              />
            </motion.div>
          ) : (
            <UnauthenticatedView canSignIn={canSignIn} />
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
