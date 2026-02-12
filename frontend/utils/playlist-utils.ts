/**
 * Extract playlist ID from Spotify URL
 * @param url - The Spotify playlist URL
 * @returns The playlist ID or null if the URL is invalid
 */
export function parsePlaylistUrl(url: string): string | null {
  const trimmed = url.trim();

  // Direct ID (22 alphanumeric characters)
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed;
  }

  // Spotify URI
  const uriMatch = trimmed.match(/spotify:playlist:([a-zA-Z0-9]{22})/);
  if (uriMatch) return uriMatch[1];

  // Web URL
  const urlMatch = trimmed.match(
    /open\.spotify\.com\/playlist\/([a-zA-Z0-9]{22})/,
  );
  if (urlMatch) return urlMatch[1];

  return null;
}
