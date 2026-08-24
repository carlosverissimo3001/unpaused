import { Test, TestingModule } from '@nestjs/testing';
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
