import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GauntletDifficulty,
  GauntletEndReason,
  GauntletRunStatus,
} from '@prisma/client';
import { Transactional } from '@transaction/transactional.decorator';
import { AuthService } from '@auth/services/auth.service';
import { PlaylistService } from '@/playlist/services/playlist.service';
import { TrackService } from '@/track/services/track.service';
import { AppLoggerService } from '../../logger/logger.service';
import { TrackDto } from '../../track/dto/track.dto';
import { evaluateGuess } from '../../game/utils/guess-evaluator';
import { GuessResult } from '../../game/consts';
import { GauntletRunRepository } from '../repositories/gauntlet-run.repository';
import {
  GAUNTLET_SNIPPET_DURATIONS,
  GAUNTLET_MAX_SAMPLING_BATCHES,
  GAUNTLET_MAX_PREVIEW_ATTEMPTS,
} from '../consts';
import { GauntletRunStateDto } from '../dto/gauntlet-run-state.dto';
import { GauntletGuessResultDto } from '../dto/gauntlet-guess-result.dto';
import { GauntletLeaderboardDto } from '../dto/gauntlet-leaderboard.dto';
import { SubmitGauntletGuessDto } from '../dto/submit-gauntlet-guess.dto';
import { PersonalBestDto } from '../dto/personal-best.dto';
import {
  GauntletHistoryDto,
  GauntletHistoryEntryDto,
  GauntletHistorySummaryDto,
} from '../dto/gauntlet-history.dto';
import { GetGauntletHistoryDto } from '../dto/get-gauntlet-history.dto';
import { LeaderboardPeriod } from '../dto/get-leaderboard.dto';
import { LIKED_SONGS_ID_SUFFIX } from '../../consts';
import { differenceInSeconds, formatDate } from 'date-fns';

@Injectable()
export class GauntletService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly gauntletRunRepository: GauntletRunRepository,
    private readonly authService: AuthService,
    private readonly playlistService: PlaylistService,
    private readonly trackService: TrackService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(GauntletService.name);
  }

  @Transactional()
  async startRun(
    sessionId: string,
    playlistId: string,
    difficulty: GauntletDifficulty,
  ): Promise<GauntletRunStateDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    // Resume existing active run if one exists
    const existing = await this.gauntletRunRepository.findActiveRun(userId);
    if (existing && existing.currentTrack?.previewUrl) {
      return {
        runId: existing.id,
        score: existing.score,
        status: existing.status,
        difficulty: existing.difficulty,
        previewUrl: existing.currentTrack.previewUrl,
        snippetDuration: GAUNTLET_SNIPPET_DURATIONS[existing.difficulty],
      };
    }

    const run = await this.gauntletRunRepository.create(userId, difficulty);
    const snippetDuration = GAUNTLET_SNIPPET_DURATIONS[difficulty];

    const { trackId, previewUrl } = await this.pickNextTrack(
      sessionId,
      playlistId,
      [],
    );

    const updated = await this.gauntletRunRepository.setCurrentTrack(
      run.id,
      trackId,
      [trackId],
    );

    return {
      runId: updated.id,
      score: updated.score,
      status: updated.status,
      difficulty,
      previewUrl,
      snippetDuration,
    };
  }

  @Transactional()
  async submitGuess(
    sessionId: string,
    runId: string,
    guess: SubmitGauntletGuessDto,
    playlistId: string,
  ): Promise<GauntletGuessResultDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    const run = await this.gauntletRunRepository.findById(runId);
    if (!run) {
      throw new NotFoundException('Gauntlet run not found');
    }
    if (run.userId !== userId) {
      throw new NotFoundException('Gauntlet run not found');
    }
    if (run.status !== GauntletRunStatus.PLAYING) {
      throw new BadRequestException('Gauntlet run is already over');
    }
    if (!run.currentTrack) {
      throw new BadRequestException('No current track to guess');
    }

    // In gauntlet, only CORRECT counts. Everything else ends the run.
    const result = evaluateGuess(
      {
        trackId: guess.trackId,
        skip: guess.skip,
        trackName: guess.trackName,
        artistName: guess.artistName,
        albumName: guess.albumName,
      },
      run.currentTrack,
    );

    const isCorrect = result === GuessResult.Correct;
    const isSkip = result === GuessResult.Skip;

    const actualTrack = run.currentTrack
      ? {
          name: run.currentTrack.name,
          artistName: run.currentTrack.artistName,
          albumArt: run.currentTrack.albumImageUrl,
        }
      : undefined;

    if (!isCorrect) {
      const [prevPersonalBest, prevDailyBest] = await Promise.all([
        this.gauntletRunRepository.findPersonalBest(userId),
        this.gauntletRunRepository.findDailyBest(userId),
      ]);

      const endReason = isSkip
        ? GauntletEndReason.SKIP
        : GauntletEndReason.WRONG_GUESS;
      const ended = await this.gauntletRunRepository.endRun(run.id, endReason);

      return {
        correct: false,
        runOver: true,
        score: ended.score,
        status: ended.status,
        actualTrack,
        isNewPersonalBest: ended.score > prevPersonalBest,
        isNewDailyBest: ended.score > prevDailyBest,
      };
    }

    // Correct guess: increment score and advance to next track
    const scored = await this.gauntletRunRepository.incrementScore(run.id);
    const snippetDuration = GAUNTLET_SNIPPET_DURATIONS[run.difficulty];

    try {
      const next = await this.pickNextTrack(
        sessionId,
        playlistId,
        run.trackIds,
      );

      await this.gauntletRunRepository.setCurrentTrack(run.id, next.trackId, [
        ...run.trackIds,
        next.trackId,
      ]);

      return {
        correct: true,
        runOver: false,
        score: scored.score,
        status: scored.status,
        actualTrack,
        nextPreviewUrl: next.previewUrl,
        nextSnippetDuration: snippetDuration,
      };
    } catch (err) {
      // If we can't find another track, end the run gracefully
      this.logger.warn(
        `Could not pick next track for run ${run.id}: ${(err as Error).message}`,
      );
      const [prevPersonalBest, prevDailyBest] = await Promise.all([
        this.gauntletRunRepository.findPersonalBest(userId),
        this.gauntletRunRepository.findDailyBest(userId),
      ]);
      const ended = await this.gauntletRunRepository.endRun(
        run.id,
        GauntletEndReason.QUIT,
      );
      return {
        correct: true,
        runOver: true,
        score: ended.score,
        status: ended.status,
        actualTrack,
        isNewPersonalBest: ended.score > prevPersonalBest,
        isNewDailyBest: ended.score > prevDailyBest,
      };
    }
  }

  async endRun(sessionId: string, runId: string): Promise<GauntletRunStateDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    const run = await this.gauntletRunRepository.findById(runId);
    if (!run) {
      throw new NotFoundException('Gauntlet run not found');
    }
    if (run.userId !== userId) {
      throw new NotFoundException('Gauntlet run not found');
    }
    if (run.status !== GauntletRunStatus.PLAYING) {
      throw new BadRequestException('Gauntlet run is already over');
    }

    const ended = await this.gauntletRunRepository.endRun(
      runId,
      GauntletEndReason.QUIT,
    );

    return {
      runId: ended.id,
      score: ended.score,
      status: ended.status,
      difficulty: ended.difficulty,
      previewUrl: '',
      snippetDuration: GAUNTLET_SNIPPET_DURATIONS[ended.difficulty],
    };
  }

  async getRunState(
    sessionId: string,
    runId: string,
  ): Promise<GauntletRunStateDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    const run = await this.gauntletRunRepository.findById(runId);
    if (!run) {
      throw new NotFoundException('Gauntlet run not found');
    }
    if (run.userId !== userId) {
      throw new NotFoundException('Gauntlet run not found');
    }

    return {
      runId: run.id,
      score: run.score,
      status: run.status,
      difficulty: run.difficulty,
      previewUrl: run.currentTrack?.previewUrl ?? '',
      snippetDuration: GAUNTLET_SNIPPET_DURATIONS[run.difficulty],
    };
  }

  async getPersonalBest(sessionId: string): Promise<PersonalBestDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    const personalBest =
      await this.gauntletRunRepository.findPersonalBest(userId);

    return { personalBest };
  }

  async getHistory(
    sessionId: string,
    dto: GetGauntletHistoryDto,
  ): Promise<GauntletHistoryDto> {
    const { id: userId } =
      await this.authService.getUserBySessionId(sessionId);

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const [{ items, total }, summary] = await Promise.all([
      this.gauntletRunRepository.findUserHistory({
        userId,
        page,
        limit,
        difficulty: dto.difficulty,
      }),
      this.gauntletRunRepository.findUserHistorySummary({
        userId,
        difficulty: dto.difficulty,
      }),
    ]);

    const uniqueTrackIds = [...new Set(items.flatMap((run) => run.trackIds))];
    const tracks = await this.trackService.findMany(uniqueTrackIds);
    const trackMap = new Map(tracks.map((track) => [track.id, track]));

    const entries: GauntletHistoryEntryDto[] = items.map((run) => {
      const completedAt = run.completedAt ?? run.createdAt;
      const playedTracks = run.trackIds
        .map((trackId) => trackMap.get(trackId))
        .filter((track): track is NonNullable<typeof track> => !!track);

      return {
        id: run.id,
        date: formatDate(completedAt, 'yyyy-MM-dd'),
        score: run.score,
        difficulty: run.difficulty,
        durationSeconds: Math.max(
          differenceInSeconds(completedAt, run.createdAt),
          0,
        ),
        tracks: playedTracks,
      };
    });

    const historySummary: GauntletHistorySummaryDto = {
      totalRuns: summary.totalRuns,
      bestScore: summary.bestScore,
      averageScore: summary.averageScore,
      totalCorrectAnswers: summary.totalCorrectAnswers,
    };

    const totalPages = Math.ceil(total / limit);

    return {
      items: entries,
      meta: {
        totalItems: total,
        itemCount: entries.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
      summary: historySummary,
    };
  }

  async getLeaderboard(
    sessionId: string,
    period: LeaderboardPeriod,
    limit: number,
    offset: number,
  ): Promise<GauntletLeaderboardDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    const startDate = this.getPeriodStartDate(period);

    const rawEntries = await this.gauntletRunRepository.findLeaderboardEntries(
      startDate,
      limit,
      offset,
    );

    const entries = rawEntries.map((entry, index) => ({
      rank: offset + index + 1,
      userId: entry.userId,
      displayName: entry.displayName,
      avatarUrl: entry.avatarUrl ?? undefined,
      score: entry.score,
    }));

    const userBest = await this.gauntletRunRepository.findUserBestInPeriod(
      userId,
      startDate,
    );

    let userEntry: GauntletLeaderboardDto['userEntry'];
    if (userBest !== null) {
      const betterCount =
        await this.gauntletRunRepository.countUsersWithHigherScore(
          userBest,
          startDate,
        );
      userEntry = { rank: betterCount + 1, score: userBest };
    }

    return { entries, userEntry, period };
  }

  private getPeriodStartDate(period: LeaderboardPeriod): Date | null {
    if (period === 'alltime') {
      return null;
    }
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    if (period === 'daily') {
      return now;
    }
    // weekly: past 7 days
    now.setUTCDate(now.getUTCDate() - 6);
    return now;
  }

  /**
   * Picks a random track from the playlist that hasn't been used yet
   * and has a valid preview URL. Persists it in the DB for guess evaluation.
   * Tries up to maxBatches random batches before giving up, so a single
   * batch that happens to contain only already-used tracks doesn't prematurely
   * end the run.
   */
  private async pickNextTrack(
    sessionId: string,
    playlistId: string,
    usedTrackIds: string[],
  ): Promise<{ trackId: string; previewUrl: string }> {
    const usedSet = new Set(usedTrackIds);
    let sawAnyTracks = false;
    let sawAnyUnusedTracks = false;

    for (let batch = 0; batch < GAUNTLET_MAX_SAMPLING_BATCHES; batch++) {
      const spotifyTracks = await this.fetchPlaylistTracks(
        sessionId,
        playlistId,
      );

      if (!spotifyTracks.length) {
        continue;
      }

      sawAnyTracks = true;

      const unusedTracks = spotifyTracks.filter((t) => !usedSet.has(t.id));

      if (!unusedTracks.length) {
        continue;
      }

      sawAnyUnusedTracks = true;

      const shuffled = [...unusedTracks].sort(() => Math.random() - 0.5);
      const maxAttempts = Math.min(
        GAUNTLET_MAX_PREVIEW_ATTEMPTS,
        shuffled.length,
      );

      for (let i = 0; i < maxAttempts; i++) {
        const spotifyTrack = shuffled[i];
        try {
          const withPreview = await this.trackService.getTrackWithPreview(
            spotifyTrack.id,
            spotifyTrack,
          );
          if (!withPreview?.previewUrl) {
            continue;
          }

          // Persist track in DB for the guess evaluator
          await this.trackService.upsertTrack(spotifyTrack.id, {
            name: spotifyTrack.name,
            artistName: spotifyTrack.primaryArtist,
            albumImageUrl: spotifyTrack.imageUrl,
            albumName: spotifyTrack.albumName,
            albumUrl: `https://open.spotify.com/album/${spotifyTrack.albumId}`,
            releaseYear: spotifyTrack.releaseYear,
            previewUrl: withPreview.previewUrl,
            allArtists: spotifyTrack.allArtists,
          });

          return {
            trackId: spotifyTrack.id,
            previewUrl: withPreview.previewUrl,
          };
        } catch (err) {
          this.logger.warn(
            `Preview failed for ${spotifyTrack.id}: ${(err as Error).message}`,
          );
        }
      }
      // This batch had unused tracks but none yielded a valid preview; try another batch.
    }

    if (!sawAnyTracks) {
      throw new BadRequestException('No playable tracks in playlist');
    }

    if (!sawAnyUnusedTracks) {
      throw new BadRequestException(
        'No unused tracks available in playlist for this run (after sampling multiple batches)',
      );
    }

    throw new BadRequestException(
      'No tracks with preview audio available for gauntlet',
    );
  }

  private async fetchPlaylistTracks(
    sessionId: string,
    playlistId: string,
  ): Promise<TrackDto[]> {
    if (playlistId.endsWith(LIKED_SONGS_ID_SUFFIX)) {
      const { totalTracks } =
        await this.playlistService.getLikedSongsMetadata(sessionId);
      if (!totalTracks) {
        throw new BadRequestException('Liked Songs is empty');
      }
      const offset = Math.floor(Math.random() * Math.max(1, totalTracks - 49));
      return this.playlistService.getLikedTracksBatch(sessionId, offset);
    }

    return this.playlistService.getPlaylistFirstTracks(sessionId, playlistId);
  }
}
