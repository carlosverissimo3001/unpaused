import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthTokenType } from '@prisma/client';
import { AppLoggerService } from '../../logger/logger.service';
import { EmailService } from '../../email/services/email.service';
import { AuthTokenRepository } from '../repositories/auth-token.repository';
import { UserRepository } from '../repositories/user.repository';
import { SessionService } from './session.service';
import { EmailSendLimiter } from './email-send-limiter.service';
import { PASSWORD_RESET_TTL_SECONDS } from '../consts';
import { createAuthToken, hashAuthToken } from '../utils/auth-token';
import { hashPassword } from '../utils/password';
import { passwordResetEmail } from '../emails/password-reset.email';

@Injectable()
export class PasswordResetService {
  private readonly logger: AppLoggerService;
  private readonly frontendUrl: string;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: AuthTokenRepository,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
    private readonly limiter: EmailSendLimiter,
    configService: ConfigService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(PasswordResetService.name);
    this.frontendUrl =
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Returns nothing, always, however it went. Saying "no such account" here
   * would turn this endpoint into a way to ask which addresses are registered,
   * so an unknown address, an unverified one and a Spotify-only row all get
   * the same silence a successful send gets.
   */
  async request(email: string): Promise<void> {
    // Claimed before anything is looked up, so the time this takes does not
    // depend on whether the address is known.
    const allowed = await this.limiter.claim(email, 'reset');

    const user = await this.userRepository.findByEmail(email);

    // An unverified address is one nobody has proved they can read. Mailing a
    // way into an account to an address like that is the thing verification
    // exists to prevent.
    if (!allowed || !user?.passwordHash || !user.emailVerifiedAt) {
      return;
    }

    const { token, tokenHash } = createAuthToken();
    await this.tokenRepository.issue({
      userId: user.id,
      email,
      type: AuthTokenType.PASSWORD_RESET,
      tokenHash,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000),
    });

    const link = `${this.frontendUrl}/reset?token=${token}`;
    await this.emailService.send(passwordResetEmail(email, link));
  }

  /**
   * Spends a link and sets the new password. False for anything that is not a
   * live token — wrong, expired and already used are one answer.
   */
  async confirm(token: string, password: string): Promise<boolean> {
    const record = await this.tokenRepository.findByHash(
      hashAuthToken(token),
      AuthTokenType.PASSWORD_RESET,
    );

    if (!record) {
      return false;
    }

    // Spent either way: an expired link is used up, not retryable.
    await this.tokenRepository.consume(record.id);

    if (record.expiresAt.getTime() < Date.now()) {
      return false;
    }

    await this.userRepository.setPassword(
      record.userId,
      await hashPassword(password),
    );

    // Whoever asked for this is at the start of a new session, not in one.
    // Everything still signed in as them is either an old browser of theirs or
    // the reason they are here.
    await this.sessionService.deleteSessionsForUser(record.userId);

    this.logger.log(`Reset the password for user ${record.userId}`);
    return true;
  }
}
