export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'failed';

/**
 * Hands the result to the native share sheet where there is one, and to the
 * clipboard everywhere else.
 *
 * Everything goes in `text` and nothing in `url`: several targets keep the url
 * and drop the text, which would send the link without the grid — the grid is
 * the part worth sending.
 */
export async function shareResult(text: string): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (err) {
      // A cancelled sheet is a decision, not a failure — don't fall through
      // and put it on their clipboard behind their back.
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'dismissed';
      }
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
