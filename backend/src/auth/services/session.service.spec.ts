import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SessionService } from './session.service';
import { RedisService } from '../../redis/redis.service';
import { UserSessionDto } from '../dto/user-session.dto';

// ── Constants ────────────────────────────────────────────────────────

const USER_ID = 'user-1';

// ── Mocks ────────────────────────────────────────────────────────────

const mockRedisService = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
};

const mockConfigService = { get: jest.fn().mockReturnValue(604800) };

// ── Tests ────────────────────────────────────────────────────────────

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    service = module.get<SessionService>(SessionService);
  });

  it('creates a session for a user with no Spotify link', async () => {
    const sessionId = await service.createSession({
      userId: USER_ID,
      displayName: 'Vinyl Chorus',
      isTrusted: false,
    });

    const written = mockRedisService.set.mock.calls.find(
      ([key]) => key === `session:${sessionId}`,
    );
    const session = JSON.parse(written[1] as string) as UserSessionDto;

    expect(session.userId).toBe(USER_ID);
    expect(session.spotifyUserId).toBeUndefined();
  });

  it('keys the reverse mapping on the user id, not the Spotify id', async () => {
    const sessionId = await service.createSession({
      userId: USER_ID,
      displayName: 'Vinyl Chorus',
      isTrusted: false,
      spotifyUserId: 'spotify-1',
    });

    expect(mockRedisService.set).toHaveBeenCalledWith(
      `user-session:${USER_ID}`,
      sessionId,
      604800,
    );
    expect(mockRedisService.set).not.toHaveBeenCalledWith(
      'user-session:spotify-1',
      expect.anything(),
      expect.anything(),
    );
  });

  it('looks a session up by user id', async () => {
    mockRedisService.get.mockResolvedValue('session-1');
    mockRedisService.exists.mockResolvedValue(true);

    await expect(service.getSessionIdByUserId(USER_ID)).resolves.toBe(
      'session-1',
    );
    expect(mockRedisService.get).toHaveBeenCalledWith(
      `user-session:${USER_ID}`,
    );
  });
});
