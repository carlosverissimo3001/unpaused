/** Strips the qualifiers Spotify appends but iTunes/Deezer usually don't. */
export function normalizeForMatch(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+[-–]\s+.*$/, '')
    .replace(
      /\s*[([][^)\]]*(remaster|mono|stereo|version|edit|live|deluxe|feat|anniversary)[^)\]]*[)\]]/gi,
      '',
    )
    .replace(/[^a-z0-9]/g, '');
}

export function matches(candidate: string, expected: string): boolean {
  const a = normalizeForMatch(candidate);
  const b = normalizeForMatch(expected);
  if (!a || !b) {
    return false;
  }
  return a === b || a.includes(b) || b.includes(a);
}

export function isSameTrack(
  candidate: { title: string; artist: string },
  expected: { title: string; artist: string },
): boolean {
  return (
    matches(candidate.title, expected.title) &&
    matches(candidate.artist, expected.artist)
  );
}
