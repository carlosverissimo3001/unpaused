"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  fetchMe,
  logout,
  getLoginUrl,
  getDevLoginUrl,
  fetchMyPlaylists,
  type User,
  type PlaylistSummary,
} from "@/lib/api";
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
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // Extract playlist ID from Spotify URL
  const parsePlaylistUrl = (url: string): string | null => {
    // Handles:
    // - https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
    // - https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=xxx
    // - spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
    // - 37i9dQZF1DXcBWIGoYBM5M (just the ID)
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
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setError(urlError === "auth_failed" ? "Authentication failed" : urlError);
      window.history.replaceState({}, "", "/");
    }

    fetchMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  // Fetch playlists when user is logged in
  useEffect(() => {
    if (user) {
      setLoadingPlaylists(true);
      fetchMyPlaylists()
        .then((res) => {
          if (res) setPlaylists(res.items);
        })
        .finally(() => setLoadingPlaylists(false));
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setPlaylists([]);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Disc3 className="w-12 h-12 text-primary animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-[#0d1117] to-[#161b22]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-spotify-green/10 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-white/5">
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
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">Sign out</span>
            </Button>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 px-6 py-8">
        {error && (
          <div className="mb-8 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm max-w-md mx-auto">
            {error}
          </div>
        )}

        {user ? (
          <div className="max-w-4xl mx-auto">
            {/* Daily challenge for trusted users */}
            {user.isTrusted && (
              <div className="mb-8 p-6 bg-gradient-to-r from-spotify-green/20 to-emerald-600/20 rounded-xl border border-spotify-green/30">
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
                  <Button variant="spotify" asChild>
                    <Link href="/daily">
                      <Play className="w-4 h-4 mr-2" />
                      Play Today
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
              <label className="block text-sm font-medium mb-2">Load any playlist by URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={playlistUrl}
                  onChange={(e) => {
                    setPlaylistUrl(e.target.value);
                    setUrlError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLoadPlaylist();
                  }}
                  placeholder="Paste Spotify playlist URL or ID..."
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-spotify-green/50 focus:border-spotify-green/50"
                />
                <Button
                  onClick={handleLoadPlaylist}
                  disabled={!playlistUrl.trim()}
                  className="px-4"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Load
                </Button>
              </div>
              {urlError && <p className="text-sm text-destructive mt-2">{urlError}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                Works with any public playlist, e.g. open.spotify.com/playlist/...
              </p>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Your Playlists</h1>
              <p className="text-muted-foreground">Or select one of your playlists</p>
            </div>

            {loadingPlaylists ? (
              <div className="flex items-center justify-center py-12">
                <Disc3 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No playlists found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlists.map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-8 max-w-lg">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  Music discovery,
                  <br />
                  <span className="text-spotify-green">reimagined.</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Connect your Spotify account to get started.
                </p>
              </div>

              <Button variant="spotify" size="lg" asChild className="text-base">
                <a href={getLoginUrl()}>
                  <Image
                    src="/spotify-icon.svg"
                    alt="Spotify"
                    width={24}
                    height={24}
                    className="mr-2"
                  />
                  Continue with Spotify
                </a>
              </Button>

              {process.env.NODE_ENV === "development" && (
                <div className="pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <a href={getDevLoginUrl()}>Dev Login (skip OAuth)</a>
                  </Button>
                </div>
              )}

              <p className="pt-8 text-xs text-muted-foreground/60">Powered by Spotify®</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-muted-foreground border-t border-white/5">
        Powered by Spotify. Not affiliated with Spotify AB.
      </footer>
    </main>
  );
}

function PlaylistCard({ playlist }: { playlist: PlaylistSummary }) {
  const imageUrl = playlist.images[0]?.url;

  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className="group relative bg-white/5 hover:bg-white/10 rounded-xl p-4 text-left transition-all duration-200 border border-white/5 hover:border-white/10 block"
    >
      <div className="flex gap-4">
        {/* Playlist image */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
          {imageUrl ? (
            <Image src={imageUrl} alt={playlist.name} fill className="object-cover" sizes="80px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ListMusic className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Playlist info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate group-hover:text-spotify-green transition-colors">
            {playlist.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate mt-1">
            {playlist.description || `By ${playlist.owner.displayName}`}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{playlist.totalTracks} tracks</span>
            <span className="flex items-center gap-1">
              {playlist.public ? (
                <>
                  <Globe className="w-3 h-3" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  Private
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
