import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { SessionService } from '@auth/services/session.service';
import { UserRepository } from '@auth/repositories/user.repository';
import { generateHandle } from '@auth/utils/handle-generator';
import { getCookieOptions } from '@auth/utils/http-helpers';
import { SESSION_COOKIE_NAME } from '../../consts';

/**
 * Self-provisioning, unlike SessionGuard: a missing or stale cookie mints a
 * real user rather than rejecting. Only routes that start a round carry it,
 * so a crawler on the landing page never creates a row.
 */
@Injectable()
export class ProvisioningSessionGuard implements CanActivate {
  private readonly sessionMaxAge: number;

  constructor(
    private readonly sessionService: SessionService,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {
    this.sessionMaxAge =
      this.configService.get<number>('SESSION_MAX_AGE_SECONDS') || 604800;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const existing = request.cookies?.[SESSION_COOKIE_NAME] as
      | string
      | undefined;

    if (existing) {
      try {
        const session = await this.sessionService.getSession(existing);
        await this.sessionService.refreshUserSessionMapping(
          session.userId,
          existing,
        );
        return true;
      } catch {
        // Stale cookie: fall through and provision a fresh identity.
      }
    }

    const user = await this.userRepository.createAnonymous(generateHandle());
    const sessionId = await this.sessionService.createSession({
      userId: user.id,
      displayName: user.displayName,
      isTrusted: user.isTrusted,
    });

    // @SessionId reads request.cookies, which the response cookie never reaches.
    request.cookies = { ...request.cookies, [SESSION_COOKIE_NAME]: sessionId };

    response.cookie(
      SESSION_COOKIE_NAME,
      sessionId,
      getCookieOptions({ sessionMaxAge: this.sessionMaxAge }),
    );

    return true;
  }
}
