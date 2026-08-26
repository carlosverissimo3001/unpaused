import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthTokenType } from '@prisma/client';
import { AppLoggerService } from '../../logger/logger.service';
import { EmailService } from '../../email/services/email.service';
import { AuthTokenRepository } from '../repositories/auth-token.repository';
import { UserRepository } from '../repositories/user.repository';
import { SessionService } from './session.service';
import { EmailSendLimiter } from './email-send-limiter.service';
import { PasswordResetService } from './password-reset.service';
import { hashAuthToken } from '../utils/auth-token';
import { verifyPassword } from '../utils/password';

const mockTokenRepository = {
  issue: jest.fn(),
  findByHash: jest.fn(),
  consume: jest.fn(),
};
const mockUserRepository = { findByEmail: jest.fn(), setPassword: jest.fn() };
const mockSessionService = { deleteSessionsForUser: jest.fn() };
const mockEmailService = { send: jest.fn() };
const mockLimiter = { claim: jest.fn() };

const VERIFIED_ACCOUNT = {
  id: 'user-1',
  passwordHash: 'a-stored-hash',
  emailVerifiedAt: new Date(),
};

async function build() {
  const logger = new AppLoggerService();
  jest.spyOn(logger, 'log').mockImplementation(() => {});

  const module = await Test.createTestingModule({
    providers: [
      PasswordResetService,
      { provide: AuthTokenRepository, useValue: mockTokenRepository },
      { provide: UserRepository, useValue: mockUserRepository },
      { provide: SessionService, useValue: mockSessionService },
      { provide: EmailService, useValue: mockEmailService },
      { provide: EmailSendLimiter, useValue: mockLimiter },
      {
        provide: ConfigService,
        useValue: { get: () => 'https://unpaused.test' },
      },
      { provide: AppLoggerService, useValue: logger },
    ],
  }).compile();

  return module.get(PasswordResetService);
}

describe('PasswordResetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLimiter.claim.mockResolvedValue(true);
    mockEmailService.send.mockResolvedValue(true);
  });

  describe('request', () => {
    it('mails a link to a verified account', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(VERIFIED_ACCOUNT);
      const service = await build();

      await service.request('player@example.com');

      expect(mockEmailService.send).toHaveBeenCalled();
      expect(mockTokenRepository.issue).toHaveBeenCalledWith(
        expect.objectContaining({ type: AuthTokenType.PASSWORD_RESET }),
      );
    });

    it('sends nothing to an address nobody has registered', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const service = await build();

      await service.request('nobody@example.com');

      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    it('rate limits an unknown address too, so the timing says nothing', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const service = await build();

      await service.request('nobody@example.com');

      expect(mockLimiter.claim).toHaveBeenCalledWith('nobody@example.com');
    });

    it('will not mail a way in to an address nobody has proved they read', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        ...VERIFIED_ACCOUNT,
        emailVerifiedAt: null,
      });
      const service = await build();

      await service.request('player@example.com');

      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    it('sends nothing for a Spotify-only account, which has no password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        ...VERIFIED_ACCOUNT,
        passwordHash: null,
      });
      const service = await build();

      await service.request('player@example.com');

      expect(mockEmailService.send).not.toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    const live = {
      id: 'token-row',
      userId: 'user-1',
      email: 'player@example.com',
      expiresAt: new Date(Date.now() + 60_000),
    };

    it('stores the new password hashed, never as given', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(live);
      const service = await build();

      await expect(service.confirm('a-token', 'a-new-password')).resolves.toBe(
        true,
      );

      const [userId, stored] = mockUserRepository.setPassword.mock.calls[0];
      expect(userId).toBe('user-1');
      expect(stored).not.toContain('a-new-password');
      await expect(verifyPassword('a-new-password', stored)).resolves.toBe(
        true,
      );
    });

    it('signs the account out everywhere, since a reset may not be theirs', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(live);
      const service = await build();

      await service.confirm('a-token', 'a-new-password');

      expect(mockSessionService.deleteSessionsForUser).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('looks the token up by its hash', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(live);
      const service = await build();

      await service.confirm('a-token', 'a-new-password');

      expect(mockTokenRepository.findByHash).toHaveBeenCalledWith(
        hashAuthToken('a-token'),
        AuthTokenType.PASSWORD_RESET,
      );
    });

    it('refuses an expired link and changes no password', async () => {
      mockTokenRepository.findByHash.mockResolvedValue({
        ...live,
        expiresAt: new Date(Date.now() - 1),
      });
      const service = await build();

      await expect(service.confirm('a-token', 'a-new-password')).resolves.toBe(
        false,
      );
      expect(mockUserRepository.setPassword).not.toHaveBeenCalled();
      expect(mockTokenRepository.consume).toHaveBeenCalledWith('token-row');
    });

    it('refuses a token nobody issued', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(null);
      const service = await build();

      await expect(service.confirm('made-up', 'a-new-password')).resolves.toBe(
        false,
      );
      expect(mockUserRepository.setPassword).not.toHaveBeenCalled();
    });
  });
});
