const KEY = 'unpaused:signed-in-as';

/**
 * Whether this browser has ever held an account, and under which email.
 *
 * Logging out clears the session and the device token, so the next visit looks
 * identical to a first one — and "Play now" would quietly mint a new person
 * rather than offering the way back. This is the only thing left that
 * remembers, so it decides which door the landing page leads with.
 */
export function rememberSignedIn(email: string | undefined): void {
  if (!email) return;
  try {
    localStorage.setItem(KEY, email);
  } catch {
    // Private windows and blocked storage: the landing page just leads with
    // "Play now" instead, which is the same as before.
  }
}

export function readSignedInAs(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** For "not me": stops the browser insisting on an account nobody here has. */
export function forgetSignedIn(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to forget if it could not be written in the first place.
  }
}
