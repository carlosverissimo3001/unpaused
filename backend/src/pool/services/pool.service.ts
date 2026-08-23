import { Injectable, NotFoundException } from '@nestjs/common';
import { TrackEntity } from '../../track/entities/track.entity';
import { TrackRepository } from '../../track/repositories/track.repository';
import {
  PoolCandidate,
  PoolTrackRepository,
} from '../repositories/pool-track.repository';
import { POOL_CANDIDATE_CACHE_MS } from '../../consts';
import { weightedPick } from '../utils/weighted-pick';

@Injectable()
export class PoolService {
  /**
   * The candidate list only changes when the pool is reseeded, so it is held
   * in memory rather than fetched per round. Exclusions are applied here
   * instead of in the query, which would make the cache useless.
   */
  private candidates: PoolCandidate[] = [];
  private cachedAt = 0;

  constructor(
    private readonly poolTrackRepository: PoolTrackRepository,
    private readonly trackRepository: TrackRepository,
  ) {}

  /**
   * @param excludeIds tracks already used in this session, so a round doesn't
   * repeat a song the player just heard.
   */
  async pickTrack(excludeIds: string[] = []): Promise<TrackEntity> {
    const candidates = await this.getCandidates();
    const id = weightedPick(candidates, new Set(excludeIds));
    if (!id) {
      throw new NotFoundException('No guest track available');
    }

    // The seed writes a `tracks` row for every pool entry, so this is a hit
    // unless the two tables have drifted.
    const track = await this.trackRepository.findById(id);
    if (!track) {
      throw new NotFoundException(`Pool track ${id} is missing from tracks`);
    }
    return track;
  }

  async isReady(): Promise<boolean> {
    return (await this.getCandidates()).length > 0;
  }

  async stats() {
    return this.poolTrackRepository.stats();
  }

  private async getCandidates(): Promise<PoolCandidate[]> {
    const age = Date.now() - this.cachedAt;
    if (this.candidates.length > 0 && age < POOL_CANDIDATE_CACHE_MS) {
      return this.candidates;
    }
    this.candidates = await this.poolTrackRepository.findCandidates();
    this.cachedAt = Date.now();
    return this.candidates;
  }
}
