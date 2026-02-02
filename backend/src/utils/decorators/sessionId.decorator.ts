import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { SESSION_COOKIE_NAME } from "../../consts";

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