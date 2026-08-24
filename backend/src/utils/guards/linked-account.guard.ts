import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from '@auth/services/session.service';
import { SESSION_COOKIE_NAME } from '../../consts';

/**
 * Any credential will do, unlike SpotifyLinkedGuard: this asks whether the
 * player has an account at all, so CAR-188's email logins pass it too.
 *
 * Multiplayer and the speed-run sit behind it until CAR-190 moves room state
 * out of the gateway process — an anonymous player now holds a real session
 * and could otherwise fill rooms a single backend instance cannot scale past.
 */
@Injectable()
export class LinkedAccountGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies?.[SESSION_COOKIE_NAME] as
      | string
      | undefined;

    if (!sessionId) {
      throw new UnauthorizedException('No active session found');
    }

    const session = await this.sessionService.getSession(sessionId);
    if (!session.spotifyUserId) {
      throw new ForbiddenException('This action requires an account');
    }

    return true;
  }
}
