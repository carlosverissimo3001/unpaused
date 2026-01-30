import { BadRequestException } from "@nestjs/common";

/** Any logger that can log errors (Nest Logger or AppLoggerService). */
interface ErrorLogger {
  error(message: string, ...optionalParams: unknown[]): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleSpotifyError(error: any, context: string, logger: ErrorLogger) {
    if (error.status === 429 || error.statusCode === 429) {
      const retryAfter = error.headers?.['retry-after'] || 'unknown';
      logger.error(`[RATE LIMIT] Spotify blocked us during ${context}. Retry after: ${retryAfter} seconds.`);
      throw new BadRequestException(`Spotify rate limit exceeded. Please wait ${retryAfter} seconds.`);
    }
    throw error;
}
