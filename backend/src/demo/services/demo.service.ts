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
import { DemoPlaylistService } from './demo-playlist.service';
import {
  DEMO_OPTION_COUNT,
  DEMO_PLAYLISTS,
  DEMO_ROUND_PREFIX,
  DEMO_ROUND_TTL_SECONDS,
  DEMO_SNIPPET_STEPS,
  type DemoPlaylist,
} from '../demo.constants';
import { DemoTrackEntity } from '../entities/demo-track.entity';
import {
  DemoGuessResultDto,
  DemoRoundDto,
  DemoRoundStatus,
} from '../dto/demo-round.dto';

type RoundState = {
  playlistSlug: string;
  answer: DemoTrackEntity;
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
    private readonly playlists: DemoPlaylistService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(DemoService.name);
  }

  getPlaylists(): DemoPlaylist[] {
    return DEMO_PLAYLISTS;
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
      answer,
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
    const result: Record<string, number> = {};

    for (const playlist of DEMO_PLAYLISTS) {
      try {
        const tracks = await this.playlists.fetchTracks(playlist.playlistId);
        if (!tracks.length) {
          this.logger.warn(
            `No tracks parsed for ${playlist.slug}; keeping previous set`,
          );
          result[playlist.slug] = 0;
          continue;
        }
        result[playlist.slug] = await this.repository.replacePlaylist(
          playlist.slug,
          tracks,
        );
      } catch (error) {
        // One playlist failing must not take the others down, and the previous
        // set stays in place.
        this.logger.warn(
          `Refresh failed for ${playlist.slug}: ${(error as Error).message}`,
        );
        result[playlist.slug] = 0;
      }
    }

    this.logger.log(`Demo refresh complete: ${JSON.stringify(result)}`);
    return result;
  }

  /** True when no playlist has any tracks, so a first run is needed. */
  async isEmpty(): Promise<boolean> {
    const counts = await Promise.all(
      DEMO_PLAYLISTS.map((p) => this.repository.countByPlaylist(p.slug)),
    );
    return counts.every((c) => c === 0);
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
