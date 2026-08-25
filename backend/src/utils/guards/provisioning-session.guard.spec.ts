import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProvisioningSessionGuard } from './provisioning-session.guard';
import { SessionService } from '@auth/services/session.service';
import { UserRepository } from '@auth/repositories/user.repository';
import { DEVICE_COOKIE_NAME, SESSION_COOKIE_NAME } from '../../consts';

// ── Mocks ────────────────────────────────────────────────────────────

const mockSessionService = {
  getSession: jest.fn(),
  createSession: jest.fn(),
  refreshUserSessionMapping: jest.fn(),
  createDeviceToken: jest.fn(),
  resolveDeviceToken: jest.fn(),
  deleteDeviceToken: jest.fn(),
};

const mockUserRepository = { createAnonymous: jest.fn(), findById: jest.fn() };

const mockConfigService = { get: jest.fn() };

function makeContext(cookies: Record<string, string>) {
  const response = { cookie: jest.fn() };
  const request = { cookies };
  return {
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext,
    request,
    response,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('ProvisioningSessionGuard', () => {
  let guard: ProvisioningSessionGuard;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvisioningSessionGuard,
        { provide: SessionService, useValue: mockSessionService },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    guard = module.get(ProvisioningSessionGuard);
  });

  it('creates exactly one user when there is no cookie', async () => {
    mockSessionService.createDeviceToken.mockResolvedValue('device-1');
    mockUserRepository.createAnonymous.mockResolvedValue({
      id: 'user-1',
      displayName: 'Vinyl Chorus',
      isTrusted: false,
    });
    mockSessionService.createSession.mockResolvedValue('session-1');
    const { context, response } = makeContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(mockUserRepository.createAnonymous).toHaveBeenCalledTimes(1);
    expect(response.cookie).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      'session-1',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('exposes the minted session to the handler on the same request', async () => {
    mockSessionService.createDeviceToken.mockResolvedValue('device-1');
    mockUserRepository.createAnonymous.mockResolvedValue({
      id: 'user-1',
      displayName: 'Vinyl Chorus',
      isTrusted: false,
    });
    mockSessionService.createSession.mockResolvedValue('session-1');
    const { context, request } = makeContext({});

    await guard.canActivate(context);

    expect(request.cookies[SESSION_COOKIE_NAME]).toBe('session-1');
  });

  it('creates no user when the cookie resolves to a live session', async () => {
    mockSessionService.getSession.mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-1',
    });
    const { context } = makeContext({ [SESSION_COOKIE_NAME]: 'session-1' });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(mockUserRepository.createAnonymous).not.toHaveBeenCalled();
  });

  it('provisions a fresh user when the cookie is stale and no device token', async () => {
    mockSessionService.getSession.mockRejectedValue(new Error('expired'));
    mockSessionService.createDeviceToken.mockResolvedValue('device-2');
    mockUserRepository.createAnonymous.mockResolvedValue({
      id: 'user-2',
      displayName: 'Neon Riff',
      isTrusted: false,
    });
    mockSessionService.createSession.mockResolvedValue('session-2');
    const { context } = makeContext({ [SESSION_COOKIE_NAME]: 'gone' });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(mockUserRepository.createAnonymous).toHaveBeenCalledTimes(1);
  });

  it('sets a device cookie alongside the session for a new player', async () => {
    mockUserRepository.createAnonymous.mockResolvedValue({
      id: 'user-1',
      displayName: 'Vinyl Chorus',
      isTrusted: false,
    });
    mockSessionService.createSession.mockResolvedValue('session-1');
    mockSessionService.createDeviceToken.mockResolvedValue('device-1');
    const { context, response } = makeContext({});

    await guard.canActivate(context);

    expect(mockSessionService.createDeviceToken).toHaveBeenCalledWith('user-1');
    expect(response.cookie).toHaveBeenCalledWith(
      DEVICE_COOKIE_NAME,
      'device-1',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('re-attaches the same anonymous user when only the device cookie survives', async () => {
    mockSessionService.getSession.mockRejectedValue(new Error('expired'));
    mockSessionService.resolveDeviceToken.mockResolvedValue('user-1');
    mockUserRepository.findById.mockResolvedValue({
      id: 'user-1',
      displayName: 'Vinyl Chorus',
      isTrusted: false,
      spotifyUserId: undefined,
    });
    mockSessionService.createSession.mockResolvedValue('session-9');
    const { context, request } = makeContext({
      [SESSION_COOKIE_NAME]: 'gone',
      [DEVICE_COOKIE_NAME]: 'device-1',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(mockUserRepository.createAnonymous).not.toHaveBeenCalled();
    expect(mockSessionService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
    );
    expect(request.cookies[SESSION_COOKIE_NAME]).toBe('session-9');
  });

  it('refuses a device token pointing at a credentialed account', async () => {
    mockSessionService.resolveDeviceToken.mockResolvedValue('user-1');
    mockUserRepository.findById.mockResolvedValue({
      id: 'user-1',
      displayName: 'Carlos',
      isTrusted: true,
      spotifyUserId: 'spotify-1',
    });
    mockUserRepository.createAnonymous.mockResolvedValue({
      id: 'user-2',
      displayName: 'Neon Riff',
      isTrusted: false,
    });
    mockSessionService.createSession.mockResolvedValue('session-2');
    mockSessionService.createDeviceToken.mockResolvedValue('device-2');
    const { context } = makeContext({ [DEVICE_COOKIE_NAME]: 'device-1' });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(mockSessionService.deleteDeviceToken).toHaveBeenCalledWith(
      'device-1',
    );
    expect(mockUserRepository.createAnonymous).toHaveBeenCalledTimes(1);
  });

  it('backfills a device token for a live session that predates it', async () => {
    mockSessionService.getSession.mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-1',
    });
    mockSessionService.createDeviceToken.mockResolvedValue('device-1');
    const { context } = makeContext({ [SESSION_COOKIE_NAME]: 'session-1' });

    await guard.canActivate(context);

    expect(mockSessionService.createDeviceToken).toHaveBeenCalledWith('user-1');
  });

  it('issues no device token for a Spotify-linked session', async () => {
    mockSessionService.getSession.mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-1',
      spotifyUserId: 'spotify-1',
    });
    const { context } = makeContext({ [SESSION_COOKIE_NAME]: 'session-1' });

    await guard.canActivate(context);

    expect(mockSessionService.createDeviceToken).not.toHaveBeenCalled();
  });
});
