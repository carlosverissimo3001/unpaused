import { BadRequestException } from '@nestjs/common';

interface ErrorLogger {
  error(message: string, ...optionalParams: unknown[]): void;
}

export function handleSpotifyError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any,
  context: string,
  logger: ErrorLogger,
) {
  if (error.status === 429 || error.statusCode === 429) {
    const retryAfter = error.headers?.['retry-after'] || 'unknown';
    logger.error(
      `[RATE LIMIT] Spotify blocked us during ${context}. Retry after: ${retryAfter} seconds.`,
    );
    throw new BadRequestException(
      `Spotify rate limit exceeded. Please wait ${retryAfter} seconds.`,
    );
  }
  throw error;
}
