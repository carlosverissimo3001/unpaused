import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import '../types';

/**
 * Reads the guest id populated by GuestSessionGuard. Throws if the guard
 * wasn't applied to the route - that's a wiring bug, not a client error.
 */
export const GuestId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const guestId = request.guestId;
    if (!guestId) {
      throw new InternalServerErrorException(
        'GuestId decorator used without GuestSessionGuard',
      );
    }
    return guestId;
  },
);
