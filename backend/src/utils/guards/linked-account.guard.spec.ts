import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { LinkedAccountGuard } from './linked-account.guard';
import { SessionService } from '@auth/services/session.service';
import { SESSION_COOKIE_NAME } from '../../consts';

const mockSessionService = { getSession: jest.fn() };

function makeContext(cookies: Record<string, string>) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ cookies }) }),
  } as unknown as ExecutionContext;
}

describe('LinkedAccountGuard', () => {
  let guard: LinkedAccountGuard;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkedAccountGuard,
        { provide: SessionService, useValue: mockSessionService },
      ],
    }).compile();
    guard = module.get(LinkedAccountGuard);
  });

  it('rejects a request with no session', async () => {
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refuses an anonymous player', async () => {
    mockSessionService.getSession.mockResolvedValue({
      userId: 'user-1',
      spotifyUserId: undefined,
    });

    await expect(
      guard.canActivate(makeContext({ [SESSION_COOKIE_NAME]: 'session-1' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('admits a player with a credential attached', async () => {
    mockSessionService.getSession.mockResolvedValue({
      userId: 'user-1',
      spotifyUserId: 'spotify-1',
    });

    await expect(
      guard.canActivate(makeContext({ [SESSION_COOKIE_NAME]: 'session-1' })),
    ).resolves.toBe(true);
  });
});
