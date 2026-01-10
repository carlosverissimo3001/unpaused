"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchPlaylistById, fetchMe, type PlaylistDetails, type User } from "@/lib/api";
import {
  ArrowLeft,
  Music2,
  Disc3,
  Clock,
  ListMusic,
  ExternalLink,
  Globe,
  Lock,
  Play,
} from "lucide-react";

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe().then((u) => {
      if (!u) {
        router.push("/");
        return;
      }
      setUser(u);
    });
  }, [router]);

  useEffect(() => {
    if (!user || !playlistId) return;

    setLoading(true);
    setError(null);

    fetchPlaylistById(playlistId)
      .then((p) => {
        if (!p) {
          setError("Playlist not found");
        } else {
          setPlaylist(p);
        }
      })
      .catch(() => setError("Failed to load playlist"))
      .finally(() => setLoading(false));
  }, [user, playlistId]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Disc3 className="w-12 h-12 text-primary animate-spin" />
      </main>
    );
  }

  if (error || !playlist) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || "Playlist not found"}</p>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to playlists
          </Link>
        </Button>
      </main>
    );
  }

  const imageUrl = playlist.images[0]?.url;
  const totalDurationMs = playlist.tracks.reduce(
    (acc, t) => acc + t.track.durationMs,
    0
  );

  return (
    <main className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-[#0d1117] to-[#161b22]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-spotify-green/10 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <header className="p-6 border-b border-white/5">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Music2 className="w-5 h-5 text-spotify-green" />
            <span className="font-semibold">Unpaused</span>
          </div>
        </div>
      </header>

      {/* Playlist header */}
      <section className="px-6 py-8 border-b border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-6">
          {/* Playlist cover */}
          <div className="relative w-48 h-48 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 shadow-2xl mx-auto sm:mx-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={playlist.name}
                fill
                className="object-cover"
                sizes="192px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ListMusic className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Playlist info */}
          <div className="flex flex-col justify-end text-center sm:text-left">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
              Playlist
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-muted-foreground mb-4 max-w-lg">
                {playlist.description}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {playlist.owner.displayName}
              </span>
              <span>•</span>
              <span>{playlist.totalTracks} tracks</span>
              <span>•</span>
              <span>{formatDuration(totalDurationMs)}</span>
              <span>•</span>
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
            <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="spotify" size="sm" asChild>
                <Link href={`/game/${playlist.id}`}>
                  <Play className="w-4 h-4 mr-2" />
                  Play Game
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={playlist.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Spotify
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Track list */}
      <section className="flex-1 px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground border-b border-white/10 mb-2">
            <span className="w-8 text-center">#</span>
            <span>Title</span>
            <span className="hidden sm:block">Album</span>
            <span className="flex items-center justify-end">
              <Clock className="w-4 h-4" />
            </span>
          </div>

          {/* Tracks */}
          <div className="space-y-1">
            {playlist.tracks.map((item, index) => (
              <TrackRow
                key={item.track.id}
                track={item.track}
                index={index + 1}
              />
            ))}
          </div>

          {playlist.tracks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>This playlist is empty</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function TrackRow({
  track,
  index,
}: {
  track: PlaylistDetails["tracks"][0]["track"];
  index: number;
}) {
  const albumImageUrl = track.album.images[0]?.url;

  return (
    <div className="group grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors items-center">
      {/* Index */}
      <span className="w-8 text-center text-sm text-muted-foreground">
        {index}
      </span>

      {/* Track info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 rounded overflow-hidden bg-white/10 flex-shrink-0">
          {albumImageUrl ? (
            <Image
              src={albumImageUrl}
              alt={track.album.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Disc3 className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate group-hover:text-spotify-green transition-colors">
            {track.name}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {track.artists.map((a) => a.name).join(", ")}
          </p>
        </div>
      </div>

      {/* Album */}
      <p className="text-sm text-muted-foreground truncate hidden sm:block">
        {track.album.name}
      </p>

      {/* Duration */}
      <span className="text-sm text-muted-foreground text-right">
        {formatTrackDuration(track.durationMs)}
      </span>
    </div>
  );
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
}

function formatTrackDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}