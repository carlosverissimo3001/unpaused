import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";

const SESSION_COOKIE_NAME = "unpaused_session";

export const SessionId = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const sessionId = request.cookies?.[SESSION_COOKIE_NAME];
      if (!sessionId) {
        throw new UnauthorizedException("Not authenticated");
      }
      return sessionId;
    },
  );