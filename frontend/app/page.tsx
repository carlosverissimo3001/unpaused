"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Music2,
  Disc3,
  ListMusic,
  Lock,
  Globe,
  Search,
  Calendar,
  Play,
  X,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMe } from "@/hooks/useMe";
import { useMyPlaylists } from "@/hooks/useMyPlaylists";
import { useLogout } from "@/hooks/useLogout";
import { useTokenLogin } from "@/hooks/useTokenLogin";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { PlaylistSkeleton } from "@/components/playlist/PlaylistSkeleton";

export default function Home() {
  const router = useRouter();
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [ambientColor, setAmbientColor] = useState<string>("rgba(30, 215, 96, 0.1)");
  
  // Playlist filter state
  const [includePrivate, setIncludePrivate] = useState(false);
  const [onlyUserOwned, setOnlyUserOwned] = useState(true); // Default to true

  // TanStack Query hooks
  const { data: user, isLoading: isLoadingUser } = useMe();
  const { data: playlistsResponse, isLoading: isLoadingPlaylists } = useMyPlaylists({
    includePrivate,
    onlyUserOwned,
  });
  const logoutMutation = useLogout();
  const tokenLoginMutation = useTokenLogin();

  // Extract playlist ID from Spotify URL
  const parsePlaylistUrl = (url: string): string | null => {
    const trimmed = url.trim();

    // Direct ID (22 alphanumeric characters)
    if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
      return trimmed;
    }

    // Spotify URI
    const uriMatch = trimmed.match(/spotify:playlist:([a-zA-Z0-9]{22})/);
    if (uriMatch) return uriMatch[1];

    // Web URL
    const urlMatch = trimmed.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]{22})/);
    if (urlMatch) return urlMatch[1];

    return null;
  };

  const handleLoadPlaylist = () => {
    setUrlError(null);
    const playlistId = parsePlaylistUrl(playlistUrl);

    if (!playlistId) {
      setUrlError("Invalid Spotify playlist URL or ID");
      return;
    }

    router.push(`/playlist/${playlistId}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Spotify playlist"]');
        if (searchInput instanceof HTMLInputElement) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setError(urlError === "auth_failed" ? "Authentication failed" : urlError);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleLogout = async () => {
    logoutMutation.mutate();
  };

  const handleTokenLogin = async () => {
    if (!tokenInput.trim()) return;
    try {
      await tokenLoginMutation.mutateAsync({
        accessToken: tokenInput.trim(),
      });
      // Reload to refetch user data
      window.location.reload();
    } catch (error) {
      // Error is handled by mutation state
    }
  };

  const handleClearFilters = () => {
    setIncludePrivate(false);
    setOnlyUserOwned(true);
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
      {/* Immersive Ambient Background with Dynamic Glow */}
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

      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <Music2 className="w-8 h-8 text-spotify-green" />
          <span className="text-2xl font-bold tracking-tight">Unpaused</span>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-spotify-green to-emerald-600 flex items-center justify-center text-sm font-bold text-black">
                {user.displayName[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{user.displayName}</span>
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4" />
                <span className="ml-2 hidden sm:inline">Sign out</span>
              </Button>
            </motion.div>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 px-6 py-8 relative z-10">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm max-w-md mx-auto"
          >
            {error}
          </motion.div>
        )}

        {user ? (
          <div className="max-w-4xl mx-auto">
            {/* Daily challenge for trusted users */}
            {user.isTrusted && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8 p-6 bg-gradient-to-r from-spotify-green/20 to-emerald-600/20 rounded-xl border border-spotify-green/30 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-5 h-5 text-spotify-green" />
                      <h2 className="text-xl font-bold">Daily Challenge</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      A new mystery song every day from your playlists
                    </p>
                  </div>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button variant="spotify" asChild>
                      <Link href="/daily">
                        <Play className="w-4 h-4 mr-2" />
                        Play Today
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Premium Command Palette Search */}
            {/* <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8 p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10"
            >
              <label className="block text-sm font-medium mb-2">Load any playlist by URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={playlistUrl}
                    onChange={(e) => {
                      setPlaylistUrl(e.target.value);
                      setUrlError(null);
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLoadPlaylist();
                    }}
                    placeholder="Paste Spotify playlist URL or ID..."
                    className={`w-full px-4 py-2.5 pl-10 pr-20 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none transition-all duration-300 ${
                      isSearchFocused
                        ? "focus:ring-2 focus:ring-spotify-green/50 focus:border-spotify-green/50 shadow-[0_0_15px_rgba(30,215,96,0.2)]"
                        : ""
                    }`}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <AnimatePresence>
                    {!playlistUrl && (
                      <motion.kbd
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white/40 bg-white/5 border border-white/10 rounded"
                      >
                        <span className="text-xs">⌘</span>K
                      </motion.kbd>
                    )}
                  </AnimatePresence>
                </div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleLoadPlaylist}
                    disabled={!playlistUrl.trim()}
                    className="px-4"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Load
                  </Button>
                </motion.div>
              </div>
              {urlError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive mt-2"
                >
                  {urlError}
                </motion.p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Works with any public playlist, e.g. open.spotify.com/playlist/...
              </p>
            </motion.div> */}

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Your Playlists</h1>
                </div>
              </div>
              
              {/* Filter Controls */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-6 mt-4 p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10"
              >
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={includePrivate}
                    onChange={(e) => setIncludePrivate(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 bg-white/5 text-spotify-green focus:ring-spotify-green focus:ring-offset-0 focus:ring-offset-transparent focus:ring-2 cursor-pointer transition-colors"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Include private playlists
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={onlyUserOwned}
                    onChange={(e) => setOnlyUserOwned(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 bg-white/5 text-spotify-green focus:ring-spotify-green focus:ring-offset-0 focus:ring-offset-transparent focus:ring-2 cursor-pointer transition-colors"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Include only those I own
                  </span>
                </label>
              </motion.div>
            </div>

            {/* Playlist Grid with Skeleton States */}
            <div className="min-h-[400px] relative">
              <AnimatePresence mode="wait">
                {isLoadingPlaylists ? (
                  <motion.div
                    key="skeletons"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
                  >
                    {Array.from({ length: 6 }).map((_, i) => (
                      <PlaylistSkeleton key={i} />
                    ))}
                  </motion.div>
                ) : playlists.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No playlists found</p>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        onClick={handleClearFilters}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Clear Filters
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="playlists"
                    layoutRoot
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative"
                    style={{ 
                      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                      minHeight: "400px"
                    }}
                  >
                    <AnimatePresence mode="popLayout">
                      {playlists.map((playlist, index) => (
                        <PlaylistCard 
                          key={playlist.id} 
                          playlist={playlist} 
                          index={index}
                          onHover={setAmbientColor}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-8 max-w-lg">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  Song guessing,
                  <br />
                  <span className="text-spotify-green">reimagined.</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Connect your Spotify account to get started.
                </p>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-not-allowed">
                      <Button
                        variant="spotify"
                        size="lg"
                        asChild
                        className="text-base opacity-50 pointer-events-none"
                      >
                        <div role="button" aria-disabled="true" className="mt-4">
                          <Image
                            src="/spotify-icon.svg"
                            alt="Spotify"
                            width={24}
                            height={24}
                            className="mr-2"
                          />
                          Continue with Spotify
                        </div>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[250px] text-center">
                    <p>Spotify has temporarily disabled new app integrations. Use the token field below to play!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {process.env.NODE_ENV === "development" && (
                <div className="pt-4 space-y-4">
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      Or paste a Spotify access token:
                    </p>
                    <div className="flex gap-2 max-w-sm mx-auto">
                      <input
                        type="text"
                        value={tokenInput}
                        onChange={(e) => {
                          setTokenInput(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleTokenLogin();
                        }}
                        placeholder="Paste token..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-spotify-green/50"
                      />
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTokenLogin}
                          disabled={!tokenInput.trim() || tokenLoginMutation.isPending}
                        >
                          {tokenLoginMutation.isPending ? "..." : "Login"}
                        </Button>
                      </motion.div>
                    </div>
                    {tokenLoginMutation.isError && (
                      <p className="text-xs text-destructive mt-2">
                        {tokenLoginMutation.error?.message || "Invalid or expired token"}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-muted-foreground border-t border-white/5 relative z-10">
        Powered by Spotify. Not affiliated with Spotify AB.
      </footer>
    </main>
  );
}
