/**
 * Last.fm tags are free text submitted by anyone, so alongside genres they
 * carry ids, dates and whatever else somebody pasted in. A tag with no letters
 * in it is not a genre, and a year would give away the one hint the era is for.
 */
const MAX_TAG_LENGTH = 30;

export function isDescriptiveTag(tag: string): boolean {
  const trimmed = tag.trim();
  if (!trimmed || trimmed.length > MAX_TAG_LENGTH) {
    return false;
  }
  return /\p{L}/u.test(trimmed);
}
