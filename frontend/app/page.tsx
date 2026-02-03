"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Disc3 } from "lucide-react";
import { useMe } from "@/hooks/auth/useMe";
import { useMyPlaylists } from "@/hooks/playlists/useMyPlaylists";
import { useLogout } from "@/hooks/auth/useLogout";
import { useTokenLogin } from "@/hooks/auth/useTokenLogin";
import { usePlaylistFilters } from "@/hooks/playlists/usePlaylistFilters";
import { usePlaylistUrlLoader } from "@/hooks/playlists/usePlaylistUrlLoader";
import { useAuthError } from "@/hooks/auth/useAuthError";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { AppHeader } from "@/components/features/AppHeader";
import { DailyChallengeBanner } from "@/components/features/DailyChallengeBanner";
import { PlaylistUrlSearch } from "@/components/features/playlist/PlaylistUrlSearch";
import { PlaylistFilters } from "@/components/features/playlist/PlaylistFilters";
import { PlaylistGrid } from "@/components/features/playlist/PlaylistGrid";
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
      <main className="min-h-screen flex items-center justify-center bg-spotify-black">
        <Disc3 className="w-12 h-12 text-spotify-green animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-spotify-black text-white">
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
            opacity: 0.5,
          }}
        />
      </div>

      <AppHeader user={user} onLogout={handleLogout} isLoggingOut={logoutMutation.isPending} />

      <div className="flex-1 px-6 py-8 relative z-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <ErrorBanner error={error} />

          {user ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <DailyChallengeBanner isTrusted={user.isTrusted} />

              <div className="relative z-20 mt-4 -mb-2">
                <PlaylistUrlSearch
                  playlistUrl={playlistUrlLoader.playlistUrl}
                  urlError={playlistUrlLoader.urlError}
                  isSearchFocused={playlistUrlLoader.isSearchFocused}
                  onPlaylistUrlChange={playlistUrlLoader.setPlaylistUrl}
                  onSearchFocus={playlistUrlLoader.setIsSearchFocused}
                  onLoad={playlistUrlLoader.handleLoad}
                />
              </div>

              <div className="mb-8 pt-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-3">
                      <h1 className="text-4xl font-black tracking-tighter text-white">
                        Your Playlists
                      </h1>
                      {!isLoadingPlaylists && (
                        <span className="text-lg font-mono text-spotify-green/40 font-light tracking-tighter">
                          /{playlists.length.toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>
                    <p className="text-white/20 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">
                      Collection Overview
                    </p>
                  </div>

                  <div className="flex items-center pb-1">
                    <PlaylistFilters
                      includePrivate={playlistFilters.includePrivate}
                      onlyUserOwned={playlistFilters.onlyUserOwned}
                      onIncludePrivateChange={playlistFilters.setIncludePrivate}
                      onOnlyUserOwnedChange={playlistFilters.setOnlyUserOwned}
                      onClearFilters={playlistFilters.clearFilters}
                    />
                  </div>
                </div>
                
                <motion.div
                  animate={{ borderColor: ambientColor }}
                  className="w-full h-px border-b border-white/5 mt-4 opacity-30"
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
    </main>
  );
}