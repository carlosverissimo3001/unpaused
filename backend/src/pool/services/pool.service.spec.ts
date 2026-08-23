import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrackRepository } from '../../track/repositories/track.repository';
import { PoolTrackRepository } from '../repositories/pool-track.repository';
import { PoolService } from './pool.service';
import { POOL_CANDIDATE_CACHE_MS } from '../../consts';

const candidate = (id: string, fame: number) => ({ id, fame });

describe('PoolService', () => {
  let service: PoolService;
  let poolTracks: { findCandidates: jest.Mock; count: jest.Mock; stats: jest.Mock };
  let tracks: { findById: jest.Mock };

  beforeEach(async () => {
    poolTracks = {
      findCandidates: jest.fn().mockResolvedValue([candidate('dz:1', 500)]),
      count: jest.fn().mockResolvedValue(1),
      stats: jest.fn(),
    };
    tracks = {
      findById: jest.fn().mockResolvedValue({ id: 'dz:1', name: 'Song' }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PoolService,
        { provide: PoolTrackRepository, useValue: poolTracks },
        { provide: TrackRepository, useValue: tracks },
      ],
    }).compile();

    service = moduleRef.get(PoolService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns the track behind the picked pool entry', async () => {
    await expect(service.pickTrack()).resolves.toMatchObject({ id: 'dz:1' });
    expect(tracks.findById).toHaveBeenCalledWith('dz:1');
  });

  it('reads the candidate list once across repeated picks', async () => {
    await service.pickTrack();
    await service.pickTrack();
    await service.pickTrack();

    expect(poolTracks.findCandidates).toHaveBeenCalledTimes(1);
  });

  it('re-reads the candidate list once the cache has aged out', async () => {
    await service.pickTrack();

    jest
      .spyOn(Date, 'now')
      .mockReturnValue(Date.now() + POOL_CANDIDATE_CACHE_MS + 1);
    await service.pickTrack();

    expect(poolTracks.findCandidates).toHaveBeenCalledTimes(2);
  });

  it('caches the whole pool, not the exclusions', async () => {
    // Exclusions are applied in memory precisely so they cannot fragment the
    // cache; a differing exclude list must not trigger another read.
    await service.pickTrack(['dz:99']);
    await service.pickTrack(['dz:98']);

    expect(poolTracks.findCandidates).toHaveBeenCalledTimes(1);
    expect(poolTracks.findCandidates).toHaveBeenCalledWith();
  });

  it('throws when the pool has nothing left to offer', async () => {
    poolTracks.findCandidates.mockResolvedValue([]);

    await expect(service.pickTrack()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when a pool entry has no matching track row', async () => {
    tracks.findById.mockResolvedValue(null);

    await expect(service.pickTrack()).rejects.toThrow('missing from tracks');
  });

  it('is not ready while the pool is empty', async () => {
    poolTracks.findCandidates.mockResolvedValue([]);

    await expect(service.isReady()).resolves.toBe(false);
  });
});
