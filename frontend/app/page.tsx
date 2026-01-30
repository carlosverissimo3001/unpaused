"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Disc3 } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { useMyPlaylists } from "@/hooks/useMyPlaylists";
import { useLogout } from "@/hooks/useLogout";
import { useTokenLogin } from "@/hooks/useTokenLogin";
import { usePlaylistFilters } from "@/hooks/usePlaylistFilters";
import { usePlaylistUrlLoader } from "@/hooks/usePlaylistUrlLoader";
import { useAuthError } from "@/hooks/useAuthError";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { AppHeader } from "@/components/features/AppHeader";
import { DailyChallengeBanner } from "@/components/features/DailyChallengeBanner";
import { PlaylistUrlSearch } from "@/components/features/PlaylistUrlSearch";
import { PlaylistFilters } from "@/components/features/PlaylistFilters";
import { PlaylistGrid } from "@/components/features/PlaylistGrid";
import { UnauthenticatedView } from "@/components/features/UnauthenticatedView";
import { AppFooter } from "@/components/features/AppFooter";

export default function Home() {
  const [tokenInput, setTokenInput] = useState("");
  const [ambientColor, setAmbientColor] = useState<string>("rgba(30, 215, 96, 0.1)");

  // Custom hooks
  const playlistFilters = usePlaylistFilters();
  const playlistUrlLoader = usePlaylistUrlLoader();
  const { error } = useAuthError();

  // Data fetching hooks
  const { data: user, isLoading: isLoadingUser } = useMe();
  const { data: playlistsResponse, isLoading: isLoadingPlaylists } = useMyPlaylists({
    includePrivate: playlistFilters.includePrivate,
    onlyUserOwned: playlistFilters.onlyUserOwned,
  });
  const logoutMutation = useLogout();
  const tokenLoginMutation = useTokenLogin();

  // Event handlers
  const handleLogout = async () => {
    logoutMutation.mutate();
  };

  const handleTokenLogin = async (token: string) => {
    await tokenLoginMutation.mutateAsync({
      accessToken: token,
    });
  };

  const playlists = playlistsResponse?.items || [];
  const loading = isLoadingUser;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Disc3 className="w-12 h-12 text-primary animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-[#0d1117] to-[#161b22]" />
        <motion.div
          className="absolute inset-0"
          animate={{
            background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${ambientColor}, transparent 70%)`,
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            filter: "blur(80px)",
            opacity: 0.6,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-spotify-green/10 via-transparent to-transparent" />
      </div>


      <AppHeader
        user={user}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      />

      <div className="flex-1 px-6 py-8 relative z-10">
        <ErrorBanner error={error} />

        {user ? (
          <div className="max-w-4xl mx-auto">
            {/* <DailyChallengeBanner isTrusted={user.isTrusted} /> */}

            <PlaylistUrlSearch
              playlistUrl={playlistUrlLoader.playlistUrl}
              urlError={playlistUrlLoader.urlError}
              isSearchFocused={playlistUrlLoader.isSearchFocused}
              onPlaylistUrlChange={playlistUrlLoader.setPlaylistUrl}
              onSearchFocus={playlistUrlLoader.setIsSearchFocused}
              onLoad={playlistUrlLoader.handleLoad}
            />

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Your Playlists</h1>
                </div>
              </div>
              
              <PlaylistFilters
                includePrivate={playlistFilters.includePrivate}
                onlyUserOwned={playlistFilters.onlyUserOwned}
                onIncludePrivateChange={playlistFilters.setIncludePrivate}
                onOnlyUserOwnedChange={playlistFilters.setOnlyUserOwned}
                onClearFilters={playlistFilters.clearFilters}
              />
            </div>

            <PlaylistGrid
              playlists={playlists}
              isLoading={isLoadingPlaylists}
              onPlaylistHover={setAmbientColor}
              onClearFilters={playlistFilters.clearFilters}
            />
          </div>
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

      <AppFooter />
    </main>
  );
}
