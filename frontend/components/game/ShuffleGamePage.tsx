'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowLeft, Play } from 'lucide-react';
import { usePoolGameOrchestrator } from '@/hooks/game/usePoolGameOrchestrator';
import { useMe } from '@/hooks/auth/useMe';
import { useVolume } from '@/hooks/game/useVolume';
import { useWarnOnLeave } from '@/hooks/useWarnOnLeave';
import { useImageColor } from '@/hooks/misc/useImageColor';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RoundProgressBar } from './RoundProgressBar';
import { VolumeSlider } from './VolumeSlider';
import { PlaySnippetButton } from './PlaySnippetButton';
import { SongRevealCard } from './SongRevealCard';
import { ClaimNamePrompt } from './ClaimNamePrompt';
import { GuessHistoryList } from './GuessHistoryList';
import { GameTitle } from './GameTitle';
import { GuessInput } from './GuessInput';
import { HintPanel } from './HintPanel';
import { AlbumArtReveal } from './AlbumArtReveal';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

const SHAKE_VARIANTS: Variants = {
  shake: {
    x: [0, -12, 12, -12, 12, -6, 6, 0],
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/**
 * A round drawn from the curated pool rather than a playlist: the same
 * presentational components and the same endpoints, minus the playlist picker
 * and stats panel. Open to anyone — for a signed-out visitor, starting one is
 * also what mints their account.
 */
export function ShuffleGamePage({
  canSignIn,
  autoStart = false,
}: {
  canSignIn: boolean;
  autoStart?: boolean;
}) {
  const { volume, setVolume } = useVolume();
  const { data: user } = useMe();

  const {
    hasBegun,
    begin,
    gameState,
    isLoading,
    error,
    isGameOver,
    submitPending,
    shouldShake,
    gameAudio,
    spotifySearch,
    handleSubmit,
    handleSkip,
    handlePlayAgain,
  } = usePoolGameOrchestrator({ volume, autoStart });

  const {
    audioRef,
    fullAudioRef,
    isPlaying,
    playSnippet,
    pauseSnippet,
    snippetProgress,
    snippetPeaks,
  } = gameAudio;

  useWarnOnLeave(!!gameState && !isGameOver);

  const albumArtColor = useImageColor(
    isGameOver && gameState?.answer?.albumImageUrl
      ? gameState.answer.albumImageUrl
      : null,
  );

  // The round is what mints the account, so it waits for a deliberate tap
  // rather than firing on page load.
  if (!hasBegun) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center overflow-visible"
        style={{ background: 'rgb(var(--bg))' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 text-center flex flex-col gap-8 sm:gap-12 max-w-2xl px-6"
        >
          <div className="flex flex-col gap-4 sm:gap-6">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-fg leading-[0.9]">
              Name the
              <br />
              <span className="text-spotify-green drop-shadow-[0_0_40px_rgba(30,215,96,0.35)]">
                song.
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-fg/50 max-w-[280px] sm:max-w-md mx-auto leading-relaxed font-medium">
              Six chances. It starts with one second.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2 w-full max-w-[240px]">
              <div className="relative group w-full">
                <div className="absolute -inset-1 bg-spotify-green/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
                <Button
                  variant="spotify"
                  onClick={begin}
                  className="relative !h-12 sm:!h-14 w-full !rounded-full text-base font-bold gap-2 transition-all duration-500 shadow-xl"
                >
                  <Play fill="currentColor" className="w-4 h-4" />
                  Play
                </Button>
              </div>
              <span className="text-xs text-fg/45">No sign-in needed</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-fg/40 hover:text-fg/70 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center"
        style={{ background: 'rgb(var(--bg))' }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center p-4 sm:p-6"
        style={{ background: 'rgb(var(--bg))' }}
      >
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#1DB954] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return null;
  }

  const preloadAlbumUrl =
    !isGameOver && gameState.albumImageUrl ? gameState.albumImageUrl : null;

  return (
    <div
      className="min-h-screen min-h-[100dvh] overflow-y-auto"
      style={{ background: 'rgb(var(--bg))' }}
    >
      {preloadAlbumUrl && (
        <Image
          src={preloadAlbumUrl}
          alt=""
          width={1}
          height={1}
          priority
          className="absolute w-0 h-0 opacity-0 pointer-events-none"
          sizes="(max-width: 768px) 144px, 176px"
        />
      )}
      <motion.div
        className="fixed inset-0 -z-10 pointer-events-none"
        animate={{
          opacity: [0.6, 1, 0.6],
          background: [
            `radial-gradient(ellipse 120% 80% at 50% 0%, ${albumArtColor} 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 80% at 20% 80%, rgba(29, 185, 84, 0.05) 0%, transparent 45%)`,
            `radial-gradient(ellipse 130% 90% at 50% 0%, ${albumArtColor} 0%, transparent 50%),
             radial-gradient(ellipse 90% 130% at 80% 100%, rgba(29, 185, 84, 0.12) 0%, transparent 50%),
             radial-gradient(ellipse 90% 90% at 20% 80%, rgba(29, 185, 84, 0.08) 0%, transparent 45%)`,
            `radial-gradient(ellipse 120% 80% at 50% 0%, ${albumArtColor} 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 80% at 20% 80%, rgba(29, 185, 84, 0.05) 0%, transparent 45%)`,
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        variants={SHAKE_VARIANTS}
        animate={shouldShake ? 'shake' : ''}
        className="p-3 sm:p-6 md:p-8 lg:p-10 relative z-10 flex flex-col min-h-screen min-h-[100dvh] safe-area-inset"
      >
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-3 sm:gap-0">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-fg/60 hover:text-fg transition-colors text-sm font-semibold shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <VolumeSlider volume={volume} onVolumeChange={setVolume} />
            </div>
            {/* Nothing at all while the site is gated: /api/auth/login is
                blocked without the access cookie, so offering it is a dead end. */}
            {canSignIn && !user?.hasLinkedAccount && (
              <a href="/api/auth/login" className="shrink-0">
                <Button
                  variant="outline"
                  className="!h-9 px-4 !rounded-full text-xs font-semibold"
                >
                  <Image
                    src="/spotify-icon.svg"
                    alt=""
                    width={14}
                    height={14}
                    // The icon ships dark and vanishes against the page.
                    className="mr-2 shrink-0 brightness-0 invert"
                  />
                  Sign in
                </Button>
              </a>
            )}
          </div>

          {!isGameOver && (
            <GameTitle
              mode={GameMode.All}
              currentRound={gameState.currentRound}
              maxRounds={gameState.maxRounds}
            />
          )}

          <audio
            ref={audioRef}
            src={gameState.previewUrl ?? undefined}
            preload="auto"
            crossOrigin="anonymous"
          />
          {isGameOver && gameState.previewUrl && (
            <audio
              ref={fullAudioRef}
              src={gameState.previewUrl}
              preload="auto"
              loop={false}
            />
          )}

          {!isGameOver && (
            <RoundProgressBar
              currentRound={gameState.currentRound}
              guesses={gameState.guesses}
              totalRounds={gameState.maxRounds}
              snippetSteps={gameState.snippetSteps}
              progress={snippetProgress}
              peaks={snippetPeaks}
              isPlaying={isPlaying}
            />
          )}

          {!isGameOver && (
            <AlbumArtReveal
              albumImageUrl={gameState.albumImageUrl}
              currentRound={gameState.currentRound}
              maxRounds={gameState.maxRounds}
            />
          )}

          {!isGameOver && (
            <PlaySnippetButton
              snippetDuration={gameState.snippetDuration}
              isPlaying={isPlaying}
              onPlay={playSnippet}
              onPause={pauseSnippet}
            />
          )}

          {!isGameOver && (
            <HintPanel
              hints={gameState.hints ?? []}
              currentRound={gameState.currentRound}
            />
          )}

          <AnimatePresence mode="wait">
            {isGameOver ? (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <SongRevealCard
                  status={gameState.status}
                  answer={gameState.answer}
                  previewUrl={gameState.previewUrl}
                  showPlayAgain
                  onPlayAgain={handlePlayAgain}
                  isFullSongPlaying={gameAudio.isFullSongPlaying}
                  onToggleFullSong={gameAudio.toggleFullSong}
                />
                <div className="mt-4 flex flex-col">
                  <ClaimNamePrompt />
                </div>
              </motion.div>
            ) : (
              <div className="relative z-20">
                <GuessInput
                  search={spotifySearch}
                  onSubmit={handleSubmit}
                  onSkip={handleSkip}
                  submitPending={submitPending}
                  gameMode={GameMode.All}
                />
              </div>
            )}
          </AnimatePresence>

          <GuessHistoryList
            guesses={gameState.guesses}
            isGameOver={!!isGameOver}
          />
        </div>
      </motion.div>
    </div>
  );
}
