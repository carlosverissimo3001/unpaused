import { Test, TestingModule } from '@nestjs/testing';
import {
  GauntletDifficulty,
  GauntletRunStatus,
  GauntletSource,
} from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { setBasePrismaClient } from '@transaction/transaction.store';
import { GauntletService } from './gauntlet.service';
import { GauntletRunRepository } from '../repositories/gauntlet-run.repository';
import { AuthService } from '@auth/services/auth.service';
import { PlaylistService } from '../../playlist/services/playlist.service';
import { TrackService } from '../../track/services/track.service';
import { AppLoggerService } from '../../logger/logger.service';

const SESSION_ID = 'session-1';
const ME = 'user-me';

const mockRepo = {
  findLeaderboardEntries: jest.fn(),
  findUserBestInPeriod: jest.fn(),
  countUsersWithHigherScore: jest.fn(),
};

const mockAuthService = { getUserBySessionId: jest.fn() };

const mockLogger = {
  child: () => ({ log: jest.fn(), warn: jest.fn(), error: jest.fn() }),
};

function entry(overrides: Record<string, unknown>) {
  return {
    userId: 'user-other',
    displayName: 'Neon Riff',
    avatarUrl: 'https://example.test/a.png',
    score: 10,
    showStatsToOthers: true,
    ...overrides,
  };
}

describe('GauntletService.getLeaderboard', () => {
  let service: GauntletService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAuthService.getUserBySessionId.mockResolvedValue({ id: ME });
    mockRepo.findUserBestInPeriod.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GauntletService,
        { provide: GauntletRunRepository, useValue: mockRepo },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PlaylistService, useValue: {} },
        { provide: TrackService, useValue: {} },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(GauntletService);
  });

  it('names a player who has not hidden their stats', async () => {
    mockRepo.findLeaderboardEntries.mockResolvedValue([entry({})]);

    const { entries } = await service.getLeaderboard(
      SESSION_ID,
      'alltime',
      10,
      0,
    );

    expect(entries[0]).toMatchObject({
      displayName: 'Neon Riff',
      userId: 'user-other',
      isHidden: false,
    });
  });

  it('strips the name, avatar and id of a hidden player', async () => {
    mockRepo.findLeaderboardEntries.mockResolvedValue([
      entry({ showStatsToOthers: false }),
    ]);

    const { entries } = await service.getLeaderboard(
      SESSION_ID,
      'alltime',
      10,
      0,
    );

    expect(entries[0]).toEqual({
      rank: 1,
      userId: 'hidden:1',
      displayName: 'Anonymous',
      isHidden: true,
      score: 10,
    });
  });

  it('keeps the hidden entry ranked in place', async () => {
    mockRepo.findLeaderboardEntries.mockResolvedValue([
      entry({ userId: 'a', score: 30 }),
      entry({ userId: 'b', score: 20, showStatsToOthers: false }),
      entry({ userId: 'c', score: 10 }),
    ]);

    const { entries } = await service.getLeaderboard(
      SESSION_ID,
      'alltime',
      10,
      0,
    );

    expect(entries.map((e) => e.rank)).toEqual([1, 2, 3]);
    expect(entries[1].score).toBe(20);
  });

  it('still shows hidden players themselves by name', async () => {
    mockRepo.findLeaderboardEntries.mockResolvedValue([
      entry({ userId: ME, displayName: 'Carlos', showStatsToOthers: false }),
    ]);

    const { entries } = await service.getLeaderboard(
      SESSION_ID,
      'alltime',
      10,
      0,
    );

    expect(entries[0]).toMatchObject({
      userId: ME,
      displayName: 'Carlos',
      isHidden: false,
    });
  });

  it('offsets the placeholder id so a later page cannot collide', async () => {
    mockRepo.findLeaderboardEntries.mockResolvedValue([
      entry({ showStatsToOthers: false }),
    ]);

    const { entries } = await service.getLeaderboard(
      SESSION_ID,
      'alltime',
      10,
      10,
    );

    expect(entries[0].userId).toBe('hidden:11');
  });
});

const RUN_ID = 'run-1';
const PLAYLIST = 'playlist-a';

function run(overrides: Record<string, unknown> = {}) {
  return {
    id: RUN_ID,
    userId: ME,
    score: 0,
    status: GauntletRunStatus.PLAYING,
    difficulty: GauntletDifficulty.MEDIUM,
    source: GauntletSource.PLAYLIST,
    sourceId: PLAYLIST,
    trackIds: [],
    currentTrack: {
      id: 'track-1',
      name: 'Song',
      artistName: 'Artist',
      allArtists: ['Artist'],
    },
    createdAt: new Date(),
    ...overrides,
  };
}

const spotifyTrack = {
  id: 'track-2',
  name: 'Next',
  primaryArtist: 'Artist',
  allArtists: ['Artist'],
  albumName: 'Album',
  albumId: 'album-1',
  imageUrl: 'https://example.test/a.png',
  releaseYear: 2020,
  isrc: 'ISRC2',
};

describe('GauntletService and the source a run draws from', () => {
  let service: GauntletService;
  const repo = {
    create: jest.fn(),
    findActiveRun: jest.fn(),
    findById: jest.fn(),
    setCurrentTrack: jest.fn(),
    incrementScore: jest.fn(),
    endRun: jest.fn(),
    findPersonalBest: jest.fn(),
    findDailyBest: jest.fn(),
  };
  const playlistService = { getPlaylistFirstTracks: jest.fn() };
  const trackService = {
    playableUrl: jest.fn(),
    getTrackWithPreview: jest.fn(),
    upsertTrack: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // @Transactional() reaches for the client the app sets at bootstrap.
    setBasePrismaClient({
      $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    } as unknown as PrismaClient);
    mockAuthService.getUserBySessionId.mockResolvedValue({ id: ME });
    repo.findActiveRun.mockResolvedValue(null);
    repo.create.mockImplementation((params) =>
      Promise.resolve(run({ ...params, id: RUN_ID })),
    );
    repo.setCurrentTrack.mockImplementation(() => Promise.resolve(run()));
    repo.incrementScore.mockResolvedValue(run({ score: 1 }));
    repo.findPersonalBest.mockResolvedValue(0);
    repo.findDailyBest.mockResolvedValue(0);
    playlistService.getPlaylistFirstTracks.mockResolvedValue([spotifyTrack]);
    trackService.getTrackWithPreview.mockResolvedValue({
      previewUrl: 'https://example.test/p.mp3',
    });
    trackService.upsertTrack.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GauntletService,
        { provide: GauntletRunRepository, useValue: repo },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PlaylistService, useValue: playlistService },
        { provide: TrackService, useValue: trackService },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(GauntletService);
  });

  it('records what the run was started against', async () => {
    await service.startRun(SESSION_ID, PLAYLIST, GauntletDifficulty.MEDIUM);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        source: GauntletSource.PLAYLIST,
        sourceId: PLAYLIST,
      }),
    );
  });

  it('draws the next track from the run, not from the request', async () => {
    repo.findById.mockResolvedValue(
      run({ sourceId: 'playlist-the-run-began-on' }),
    );

    await service.submitGuess(SESSION_ID, RUN_ID, { trackId: 'track-1' });

    expect(playlistService.getPlaylistFirstTracks).toHaveBeenCalledWith(
      SESSION_ID,
      'playlist-the-run-began-on',
    );
  });

  it('ends a run whose source was never recorded rather than guessing at one', async () => {
    repo.findById.mockResolvedValue(run({ sourceId: null }));
    repo.endRun.mockResolvedValue(
      run({ status: GauntletRunStatus.ENDED, score: 1 }),
    );

    const result = await service.submitGuess(SESSION_ID, RUN_ID, {
      trackId: 'track-1',
    });

    expect(result.runOver).toBe(true);
    expect(playlistService.getPlaylistFirstTracks).not.toHaveBeenCalled();
  });
});
