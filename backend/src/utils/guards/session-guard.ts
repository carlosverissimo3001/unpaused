import { Injectable } from "@nestjs/common";
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { SESSION_COOKIE_NAME } from "../../consts";

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.cookies?.[SESSION_COOKIE_NAME];
    
    if (!sessionId) {
      throw new UnauthorizedException("No active session found");
    }
    return true;
  }
}