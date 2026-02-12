import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SESSION_COOKIE_NAME } from '../../consts';
import { AuthService } from '@auth/services/auth.service';

@Injectable()
export class TrustedUserGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionId) {
      throw new ForbiddenException('Not authenticated');
    }

    const user = await this.authService.getUserBySessionId(sessionId);
    if (!user.isTrusted) {
      throw new ForbiddenException('Trusted user access required');
    }

    request.user = user;
    return true;
  }
}
