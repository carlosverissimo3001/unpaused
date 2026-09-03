export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'failed';

/**
 * Desktop Chrome implements `navigator.share` and answers it with an OS sheet
 * offering Teams and Outlook — more steps than a copy, to reach a worse set of
 * targets. The sheet only earns its place on a touch device, where the
 * alternative is copy, leave, find the app, paste.
 */
function prefersShareSheet(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  );
}

/**
 * Hands the result to the native share sheet on a touch device, and to the
 * clipboard everywhere else.
 *
 * Everything goes in `text` and nothing in `url`: several targets keep the url
 * and drop the text, which would send the link without the grid — the grid is
 * the part worth sending.
 */
export async function shareResult(text: string): Promise<ShareOutcome> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    prefersShareSheet()
  ) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (err) {
      // A cancelled sheet is a decision, not a failure — don't fall through
      // and put it on their clipboard behind their back.
      if ((err as { name?: string } | null)?.name === 'AbortError') {
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
