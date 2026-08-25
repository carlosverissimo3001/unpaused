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

/** For the one thing Spotify still buys: playing your own library. */
@Injectable()
export class SpotifyLinkedGuard implements CanActivate {
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
      throw new ForbiddenException(
        'This action requires a linked Spotify account',
      );
    }

    return true;
  }
}
