import { Injectable } from "@nestjs/common";
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { SESSION_COOKIE_NAME } from "../../consts";
import { SessionService } from "@auth/services/session.service";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionId) {
      throw new UnauthorizedException("No active session found");
    }

    await this.sessionService.getSession(sessionId);
    return true;
  }
}
