import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import { DemoTrackRepository } from '../repositories/demo-track.repository';
import { DemoPlaylistRepository } from '../repositories/demo-playlist.repository';
import { DemoPlaylistService } from './demo-playlist.service';
import {
  DEMO_OPTION_COUNT,
  DEMO_PLAYLISTS,
  DEMO_ROUND_PREFIX,
  DEMO_ROUND_TTL_SECONDS,
  DEMO_SNIPPET_STEPS,
} from '../demo.constants';
import { DemoTrackEntity } from '../entities/demo-track.entity';
import { DemoPlaylistEntity } from '../entities/demo-playlist.entity';

import {
  DemoGuessResultDto,
  DemoRoundDto,
  DemoRoundStatus,
} from '../dto/demo-round.dto';

/**
 * Only what a reveal needs. The full entity carried a `fetchedAt: Date` that
 * became a string once round state round-tripped through JSON, so the type was
 * lying, and it stored more per round than a 15-minute TTL should hold.
 */
type RoundAnswer = {
  id: string;
  name: string;
  artistName: string;
  albumImageUrl: string;
  previewUrl: string;
};

type RoundState = {
  playlistSlug: string;
  answer: RoundAnswer;
  optionIds: string[];
  attempt: number;
  wrongIds: string[];
  status: DemoRoundStatus;
};

@Injectable()
export class DemoService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly redis: RedisService,
    private readonly repository: DemoTrackRepository,
    private readonly playlistRepository: DemoPlaylistRepository,
    private readonly playlists: DemoPlaylistService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(DemoService.name);
  }

  /**
   * Served from the database so covers and names follow Spotify. Falls back to
   * the configured slugs before the first refresh has run, which keeps the
   * picker usable rather than empty.
   */
  async getPlaylists(): Promise<DemoPlaylistEntity[]> {
    const stored = await this.playlistRepository.findAll();
    if (stored.length) {
      return stored;
    }

    return DEMO_PLAYLISTS.map(({ slug, name }) => ({
      slug,
      name,
      imageUrl: '',
      description: null,
    }));
  }

  async createRound(playlistSlug: string): Promise<DemoRoundDto> {
    if (!DEMO_PLAYLISTS.some((p) => p.slug === playlistSlug)) {
      throw new NotFoundException(`Unknown playlist: ${playlistSlug}`);
    }

    const tracks = await this.repository.findByPlaylist(playlistSlug);
    if (tracks.length < DEMO_OPTION_COUNT) {
      // The daily refresh has not populated this playlist yet, or it failed on
      // an empty table. The client falls back to its offline round.
      throw new ServiceUnavailableException('Demo tracks are not ready yet');
    }

    const answer = tracks[Math.floor(Math.random() * tracks.length)];
    const decoys = this.shuffle(tracks.filter((t) => t.id !== answer.id)).slice(
      0,
      DEMO_OPTION_COUNT - 1,
    );
    const options = this.shuffle([answer, ...decoys]);

    const roundId = uuidv4();
    const state: RoundState = {
      playlistSlug,
      answer: this.toAnswer(answer),
      optionIds: options.map((o) => o.id),
      attempt: 0,
      wrongIds: [],
      status: DemoRoundStatus.PLAYING,
    };
    await this.save(roundId, state);

    return {
      roundId,
      previewUrl: answer.previewUrl,
      attempt: 1,
      totalAttempts: DEMO_SNIPPET_STEPS.length,
      snippetDuration: DEMO_SNIPPET_STEPS[0],
      options: options.map((o) => ({
        id: o.id,
        name: o.name,
        artistName: o.artistName,
      })),
    };
  }

  async guess(roundId: string, trackId: string): Promise<DemoGuessResultDto> {
    const state = await this.load(roundId);

    if (state.status !== DemoRoundStatus.PLAYING) {
      return this.toResult(state);
    }

    // Only the four options are valid, so the answer cannot be brute-forced
    // with arbitrary track ids.
    if (!state.optionIds.includes(trackId)) {
      throw new BadRequestException('That track is not one of the options');
    }

    if (trackId === state.answer.id) {
      state.status = DemoRoundStatus.WON;
    } else {
      state.wrongIds.push(trackId);
      state.attempt += 1;
      if (state.attempt >= DEMO_SNIPPET_STEPS.length) {
        state.status = DemoRoundStatus.LOST;
      }
    }

    await this.save(roundId, state);
    return this.toResult(state);
  }

  /** Refreshes every playlist. Called by the scheduled job. */
  async refreshAll(): Promise<Record<string, number>> {
    const entries = await Promise.all(
      DEMO_PLAYLISTS.map(async (playlist) => {
        try {
          const fetched = await this.playlists.fetchPlaylist(
            playlist.playlistId,
          );
          const tracks = fetched.tracks;
          if (!tracks.length) {
            this.logger.warn(
              `No tracks parsed for ${playlist.slug}; keeping previous set`,
            );
            return [playlist.slug, 0] as const;
          }
          const written = await this.repository.replacePlaylist(
            playlist.slug,
            tracks,
          );

          // Names and covers come from Spotify, so the picker matches whatever
          // the chart is actually called today.
          await this.playlistRepository.upsert(playlist.slug, {
            name: fetched.name || playlist.name,
            imageUrl: fetched.imageUrl,
            description: fetched.description,
          });

          return [playlist.slug, written] as const;
        } catch (error) {
          this.logger.warn(
            `Refresh failed for ${playlist.slug}: ${(error as Error).message}`,
          );
          return [playlist.slug, 0] as const;
        }
      }),
    );

    const result = Object.fromEntries(entries);
    const failed = entries
      .filter(([, count]) => count === 0)
      .map(([slug]) => slug);

    if (failed.length) {
      // Throwing is what makes the queue's configured backoff engage. A retry
      // re-fetches the playlists that already succeeded, which is harmless:
      // replacePlaylist is a full replace inside a transaction, so the work is
      // idempotent, and a chart left stale for 24h is the worse outcome.
      this.logger.error(
        `Demo refresh incomplete, retrying: ${JSON.stringify(result)}`,
      );
      throw new Error(`Demo refresh failed for: ${failed.join(', ')}`);
    }

    this.logger.log(`Demo refresh complete: ${JSON.stringify(result)}`);
    return result;
  }

  /**
   * Whether a refresh should run at boot rather than waiting for the schedule.
   * Checks the chart metadata as well as the tracks, so a deploy that adds a
   * table self-heals instead of serving a picker with no covers all day.
   */
  async needsSeeding(): Promise<boolean> {
    const [counts, playlists] = await Promise.all([
      Promise.all(
        DEMO_PLAYLISTS.map((p) => this.repository.countByPlaylist(p.slug)),
      ),
      this.playlistRepository.findAll(),
    ]);

    return counts.every((c) => c === 0) || playlists.length === 0;
  }

  private toAnswer(track: DemoTrackEntity): RoundAnswer {
    return {
      id: track.id,
      name: track.name,
      artistName: track.artistName,
      albumImageUrl: track.albumImageUrl,
      previewUrl: track.previewUrl,
    };
  }

  private toResult(state: RoundState): DemoGuessResultDto {
    const resolved = state.status !== DemoRoundStatus.PLAYING;
    return {
      correct: state.status === DemoRoundStatus.WON,
      status: state.status,
      attempt: Math.min(state.attempt + 1, DEMO_SNIPPET_STEPS.length),
      totalAttempts: DEMO_SNIPPET_STEPS.length,
      snippetDuration:
        DEMO_SNIPPET_STEPS[
          Math.min(state.attempt, DEMO_SNIPPET_STEPS.length - 1)
        ],
      wrongIds: state.wrongIds,
      // Revealed only once the round is over: until then the client never
      // holds the answer.
      answer: resolved
        ? {
            id: state.answer.id,
            name: state.answer.name,
            artistName: state.answer.artistName,
            albumImageUrl: state.answer.albumImageUrl,
          }
        : undefined,
    };
  }

  private async save(roundId: string, state: RoundState): Promise<void> {
    await this.redis.set(
      `${DEMO_ROUND_PREFIX}${roundId}`,
      JSON.stringify(state),
      DEMO_ROUND_TTL_SECONDS,
    );
  }

  private async load(roundId: string): Promise<RoundState> {
    const raw = await this.redis.get(`${DEMO_ROUND_PREFIX}${roundId}`);
    if (!raw) {
      throw new NotFoundException('Round not found or expired');
    }
    try {
      return JSON.parse(raw) as RoundState;
    } catch {
      throw new NotFoundException('Round state is corrupted');
    }
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
