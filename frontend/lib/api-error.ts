import { ResponseError } from '@/sdk/runtime';

/**
 * NestJS (and many backends) return error bodies like:
 * { "message": "Playlist is empty", "error": "Bad Request", "statusCode": 400 }
 * Validation errors may use "message" as an array of strings.
 *
 * Use this helper to surface the API message in the UI instead of the generic
 * "Response returned an error code" from the SDK.
 */
export async function getApiErrorMessage(error: unknown): Promise<string> {
  if (error instanceof ResponseError && error.response) {
    try {
      const body = await error.response.clone().json();
      const msg = body.message;
      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg)) return msg.join(', ');
      if (body.error) return String(body.error);
    } catch {
      // ignore JSON parse / clone errors
    }
  }
  if (error instanceof Error) return error.message;
  return 'An error occurred';
}
