"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getDailyPuzzle,
  submitDailyGuess,
  fetchMe,
  ROUND_DURATIONS,
  type DailyState,
  type TrackOption,
  type User,
} from "@/lib/api";
import {
  ArrowLeft,
  Music2,
  Play,
  Pause,
  SkipForward,
  Check,
  X,
  Minus,
  Search,
  Calendar,
  Trophy,
} from "lucide-react";

export default function DailyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [daily, setDaily] = useState<DailyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<TrackOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Check auth and load daily
  useEffect(() => {
    const init = async () => {
      const u = await fetchMe();
      if (!u) {
        router.push("/");
        return;
      }
      setUser(u);

      if (!u.isTrusted) {
        setError("Daily mode is only available for trusted users");
        setLoading(false);
        return;
      }

      const d = await getDailyPuzzle();
      if (!d) {
        setError("Failed to load daily puzzle");
      } else {
        setDaily(d);
      }
      setLoading(false);
    };

    init();
  }, [router]);

  // Audio control
  const snippetDuration = daily
    ? ROUND_DURATIONS[Math.min(daily.currentRound, ROUND_DURATIONS.length - 1)]
    : 0;

  const playSnippet = useCallback(() => {
    if (!audioRef.current || !daily?.previewUrl) return;

    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }, snippetDuration * 1000);
  }, [daily?.previewUrl, snippetDuration]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  // Update audio progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const progress = (audio.currentTime / snippetDuration) * 100;
      setAudioProgress(Math.min(progress, 100));
    };

    audio.addEventListener("timeupdate", updateProgress);
    return () => audio.removeEventListener("timeupdate", updateProgress);
  }, [snippetDuration]);

  // Filter tracks for search
  const filteredTracks =
    daily?.trackOptions.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Submit guess
  const handleGuess = async (skip = false) => {
    if (!daily) return;

    stopAudio();
    const result = await submitDailyGuess(
      skip ? null : selectedTrack?.id || null,
      skip
    );

    if (result) {
      setDaily((prev) =>
        prev
          ? {
              ...prev,
              currentRound: result.currentRound,
              snippetDuration: result.snippetDuration,
              status: result.status,
              guesses: [
                ...prev.guesses,
                {
                  trackId: skip ? null : selectedTrack?.id || null,
                  trackName: skip ? null : selectedTrack?.name || null,
                  artistName: skip ? null : selectedTrack?.artist || null,
                  result: result.result,
                },
              ],
              alreadyPlayed: result.gameOver,
            }
          : null
      );
      setSelectedTrack(null);
      setSearchQuery("");

      // Refetch to get answer if game over
      if (result.gameOver) {
        const updated = await getDailyPuzzle();
        if (updated) setDaily(updated);
      }
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading daily puzzle...</div>
      </main>
    );
  }

  if (error || !daily) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || "Failed to load"}</p>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </main>
    );
  }

  const isGameOver = daily.status !== "playing" || daily.alreadyPlayed;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-[#0d1117] to-[#161b22]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-spotify-green/10 via-transparent to-transparent" />
      </div>

      {/* Hidden audio element */}
      {daily.previewUrl && (
        <audio ref={audioRef} src={daily.previewUrl} preload="auto" />
      )}

      {/* Header */}
      <header className="p-6 border-b border-white/5">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
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

      {/* Game content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md space-y-8">
          {/* Daily header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-spotify-green/20 rounded-full text-spotify-green mb-4">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Daily Challenge</span>
            </div>
            <h1 className="text-2xl font-bold">{daily.date}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              From: {daily.playlistName}
            </p>
          </div>

          {/* Already played message */}
          {daily.alreadyPlayed && daily.previousResult && (
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-xl font-bold mb-2">
                {daily.previousResult.wonAt
                  ? `You got it in ${daily.previousResult.wonAt}!`
                  : "Better luck tomorrow!"}
              </h2>
              <p className="text-muted-foreground">
                Score: {daily.previousResult.score} / 6
              </p>
            </div>
          )}

          {/* Round indicator */}
          {!daily.alreadyPlayed && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {isGameOver
                  ? daily.status === "won"
                    ? "🎉 You got it!"
                    : "😢 Better luck tomorrow"
                  : `Round ${daily.currentRound + 1} of ${ROUND_DURATIONS.length}`}
              </p>
              <div className="flex justify-center gap-2">
                {ROUND_DURATIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-2 rounded-full ${
                      i < daily.guesses.length
                        ? daily.guesses[i].result === "correct"
                          ? "bg-spotify-green"
                          : daily.guesses[i].result === "artist"
                          ? "bg-yellow-500"
                          : "bg-red-500/50"
                        : i === daily.currentRound && !isGameOver
                        ? "bg-white/30"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Audio player */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="text-center mb-4">
              <p className="text-2xl font-bold">{snippetDuration}s</p>
              <p className="text-sm text-muted-foreground">snippet duration</p>
            </div>

            <div className="h-2 bg-white/10 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-spotify-green transition-all duration-100"
                style={{ width: `${isPlaying ? audioProgress : 0}%` }}
              />
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                variant={isPlaying ? "outline" : "spotify"}
                onClick={isPlaying ? stopAudio : playSnippet}
                disabled={!daily.previewUrl}
                className="rounded-full w-16 h-16"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>
            </div>
          </div>

          {/* Guess history */}
          {daily.guesses.length > 0 && (
            <div className="space-y-2">
              {daily.guesses.map((guess, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    guess.result === "correct"
                      ? "bg-spotify-green/20 border border-spotify-green/30"
                      : guess.result === "artist"
                      ? "bg-yellow-500/20 border border-yellow-500/30"
                      : guess.result === "skip"
                      ? "bg-white/5 border border-white/10"
                      : "bg-red-500/20 border border-red-500/30"
                  }`}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {guess.result === "correct" ? (
                      <Check className="w-5 h-5 text-spotify-green" />
                    ) : guess.result === "artist" ? (
                      <Minus className="w-5 h-5 text-yellow-500" />
                    ) : guess.result === "skip" ? (
                      <SkipForward className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {guess.result === "skip" ? (
                      <p className="text-sm text-muted-foreground">Skipped</p>
                    ) : (
                      <>
                        <p className="font-medium truncate">
                          {guess.trackName || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {guess.artistName || "Unknown"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Answer reveal */}
          {isGameOver && daily.answer && (
            <div className="bg-spotify-green/20 border border-spotify-green/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                The answer was
              </p>
              <p className="text-xl font-bold">{daily.answer.name}</p>
              <p className="text-muted-foreground">{daily.answer.artist}</p>
            </div>
          )}

          {/* Guess input */}
          {!isGameOver && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                    setSelectedTrack(null);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search for a song..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-spotify-green/50"
                />

                {showDropdown && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-10">
                    {filteredTracks.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">
                        No matches found
                      </p>
                    ) : (
                      filteredTracks.slice(0, 10).map((track) => (
                        <button
                          key={track.id}
                          onClick={() => {
                            setSelectedTrack(track);
                            setSearchQuery(track.name);
                            setShowDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <p className="font-medium truncate">{track.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {track.artist}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => handleGuess(false)}
                  disabled={!selectedTrack}
                >
                  Submit Guess
                </Button>
                <Button variant="outline" onClick={() => handleGuess(true)}>
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip
                </Button>
              </div>
            </div>
          )}

          {/* Back button when done */}
          {isGameOver && (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">Back to Playlists</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
