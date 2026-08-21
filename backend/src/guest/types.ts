// Augments Express's Request with the field GuestSessionGuard populates,
// mirroring how SessionGuard/AuthGuard rely on cookie-parser's own
// augmentation for `request.cookies`.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      guestId?: string;
    }
  }
}

export {};
