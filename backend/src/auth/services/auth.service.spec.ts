import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AvatarSource } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '@prisma/prisma.service';
import { SpotifyService } from './spotify.service';
import { SpotifyAuthService } from './spotify-auth.service';
import { SessionService } from './session.service';
import { UserRepository } from '../repositories/user.repository';
import { UserSessionDto } from '../dto/user-session.dto';
import { UserEntity } from '../entities/user.entity';

// ── Constants ────────────────────────────────────────────────────────

const SESSION_ID = 'session-1';
const USER_ID = 'user-1';
const SPOTIFY_USER_ID = 'spotify-1';

// ── Factories ────────────────────────────────────────────────────────

function makeSession(overrides: Partial<UserSessionDto> = {}): UserSessionDto {
  return {
    sessionId: SESSION_ID,
    userId: USER_ID,
    spotifyUserId: SPOTIFY_USER_ID,
    displayName: 'Vinyl Chorus',
    isTrusted: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: USER_ID,
    spotifyUserId: SPOTIFY_USER_ID,
    displayName: 'Vinyl Chorus',
    avatarUrl: 'https://spotify.test/avatar.jpg',
    customAvatarUrl: undefined,
    avatarSource: AvatarSource.SPOTIFY,
    isTrusted: false,
    isAdmin: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    country: 'PT',
    ...overrides,
  };
}

// ── Mocks ────────────────────────────────────────────────────────────

const mockPrismaService = {
  user: { findUnique: jest.fn() },
};

const mockSpotifyService = {};

const mockSpotifyAuthService = {
  getValidAccessToken: jest.fn(),
  revokeTokens: jest.fn(),
  storeTokens: jest.fn(),
};

const mockSessionService = {
  getSession: jest.fn(),
  deleteSession: jest.fn(),
  createSession: jest.fn(),
  updateSessionDisplayName: jest.fn(),
};

const mockUserRepository = {
  findById: jest.fn(),
  upsert: jest.fn(),
  updateDisplayName: jest.fn(),
};

// ── Test Suite ───────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SpotifyService, useValue: mockSpotifyService },
        { provide: SpotifyAuthService, useValue: mockSpotifyAuthService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── getUserBySessionId ───────────────────────────────────────────

  describe('getUserBySessionId', () => {
    it('resolves the user row the session points at', async () => {
      const row = { id: USER_ID, displayName: 'Vinyl Chorus' };
      mockSessionService.getSession.mockResolvedValue(makeSession());
      mockPrismaService.user.findUnique.mockResolvedValue(row);

      await expect(service.getUserBySessionId(SESSION_ID)).resolves.toBe(row);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
      });
    });

    it('resolves a session that carries no Spotify link', async () => {
      const row = { id: USER_ID, displayName: 'Vinyl Chorus' };
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ spotifyUserId: undefined }),
      );
      mockPrismaService.user.findUnique.mockResolvedValue(row);

      await expect(service.getUserBySessionId(SESSION_ID)).resolves.toBe(row);
    });

    it('rejects when the user row is gone', async () => {
      mockSessionService.getSession.mockResolvedValue(makeSession());
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserBySessionId(SESSION_ID)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── getCurrentUser ───────────────────────────────────────────────

  describe('getCurrentUser', () => {
    it('loads the row by user id and reports the effective avatar', async () => {
      mockSessionService.getSession.mockResolvedValue(makeSession());
      mockUserRepository.findById.mockResolvedValue(
        makeUser({
          avatarSource: AvatarSource.CUSTOM,
          customAvatarUrl: 'https://cdn.test/custom.jpg',
          isAdmin: true,
        }),
      );

      const result = await service.getCurrentUser(SESSION_ID);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(USER_ID);
      expect(result.avatarUrl).toBe('https://cdn.test/custom.jpg');
      expect(result.spotifyAvatarUrl).toBe('https://spotify.test/avatar.jpg');
      expect(result.isAdmin).toBe(true);
      expect(result.displayName).toBe('Vinyl Chorus');
    });

    it('omits the Spotify id when the account is not linked', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ spotifyUserId: undefined }),
      );
      mockUserRepository.findById.mockResolvedValue(
        makeUser({ spotifyUserId: undefined }),
      );

      const result = await service.getCurrentUser(SESSION_ID);

      expect(result.spotifyUserId).toBeUndefined();
    });

    it('rejects when no user row matches the session', async () => {
      mockSessionService.getSession.mockResolvedValue(makeSession());
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.getCurrentUser(SESSION_ID)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── getValidAccessToken ──────────────────────────────────────────

  describe('getValidAccessToken', () => {
    it('returns a token for a linked account', async () => {
      const session = makeSession();
      mockSessionService.getSession.mockResolvedValue(session);
      mockSpotifyAuthService.getValidAccessToken.mockResolvedValue('token-1');

      const result = await service.getValidAccessToken(SESSION_ID);

      expect(result).toEqual({ session, accessToken: 'token-1' });
      expect(mockSpotifyAuthService.getValidAccessToken).toHaveBeenCalledWith(
        SPOTIFY_USER_ID,
      );
    });

    it('refuses a session with no linked Spotify account', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ spotifyUserId: undefined }),
      );

      await expect(service.getValidAccessToken(SESSION_ID)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockSpotifyAuthService.getValidAccessToken).not.toHaveBeenCalled();
    });
  });

  // ── logout ───────────────────────────────────────────────────────

  describe('logout', () => {
    it('revokes Spotify tokens and drops the session', async () => {
      mockSessionService.getSession.mockResolvedValue(makeSession());

      await service.logout(SESSION_ID);

      expect(mockSpotifyAuthService.revokeTokens).toHaveBeenCalledWith(
        SPOTIFY_USER_ID,
      );
      expect(mockSessionService.deleteSession).toHaveBeenCalledWith(SESSION_ID);
    });

    it('still drops a session it cannot read, so the cookie can be cleared', async () => {
      // A pre-re-key blob makes getSession throw; logout must not propagate it.
      mockSessionService.getSession.mockRejectedValue(
        new UnauthorizedException('Session not found'),
      );

      await expect(service.logout(SESSION_ID)).resolves.toBeUndefined();

      expect(mockSpotifyAuthService.revokeTokens).not.toHaveBeenCalled();
      expect(mockSessionService.deleteSession).toHaveBeenCalledWith(SESSION_ID);
    });

    it('skips revocation for an unlinked account', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ spotifyUserId: undefined }),
      );

      await service.logout(SESSION_ID);

      expect(mockSpotifyAuthService.revokeTokens).not.toHaveBeenCalled();
      expect(mockSessionService.deleteSession).toHaveBeenCalledWith(SESSION_ID);
    });
  });
});
