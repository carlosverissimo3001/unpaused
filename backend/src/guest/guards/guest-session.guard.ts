import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';
import { GuestSessionService } from '../services/guest-session.service';
import {
  GUEST_COOKIE_NAME,
  GUEST_SESSION_TTL_SECONDS,
} from '../guest.constants';
import { getCookieOptions } from '../../auth/utils/http-helpers';

/**
 * Self-provisioning, unlike SessionGuard: a missing or expired guest cookie
 * doesn't reject the request, it mints a new guest identity and sets the
 * cookie on the response. Guest identity is ambient, not a login gate.
 */
@Injectable()
export class GuestSessionGuard implements CanActivate {
  constructor(private readonly guestSessionService: GuestSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const existing = request.cookies?.[GUEST_COOKIE_NAME] as string | undefined;

    if (existing && (await this.guestSessionService.touch(existing))) {
      request.guestId = existing;
      return true;
    }

    const guestId = await this.guestSessionService.createSession();
    response.cookie(
      GUEST_COOKIE_NAME,
      guestId,
      getCookieOptions({ sessionMaxAge: GUEST_SESSION_TTL_SECONDS }),
    );
    request.guestId = guestId;
    return true;
  }
}
