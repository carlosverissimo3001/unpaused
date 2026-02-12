import { parsePlaylistUrl } from './playlist-utils';

describe('parsePlaylistUrl', () => {
  describe('direct ID (22 alphanumeric characters)', () => {
    it('returns the ID when given a valid 22-character alphanumeric string', () => {
      const id = '37i9dQZF1DXcBWIGoYBM5M';
      expect(parsePlaylistUrl(id)).toBe(id);
    });

    it('returns the ID for lowercase alphanumeric', () => {
      const id = 'abcdefghij1234567890ab';
      expect(parsePlaylistUrl(id)).toBe(id);
    });

    it('returns the ID for mixed case', () => {
      const id = 'AbCdEfGhIjKlMnOpQrStUv';
      expect(parsePlaylistUrl(id)).toBe(id);
    });
  });

  describe('Spotify URI', () => {
    it('extracts ID from spotify:playlist:... format', () => {
      const id = '37i9dQZF1DXcBWIGoYBM5M';
      expect(parsePlaylistUrl(`spotify:playlist:${id}`)).toBe(id);
    });

    it('returns null when URI has ID that is too short', () => {
      expect(parsePlaylistUrl('spotify:playlist:short')).toBeNull();
    });

    it('extracts first 22 chars when URI has ID longer than 22 chars', () => {
      // Regex captures first 22 alphanumeric chars after playlist:
      expect(
        parsePlaylistUrl('spotify:playlist:37i9dQZF1DXcBWIGoYBM5Mextra'),
      ).toBe('37i9dQZF1DXcBWIGoYBM5M');
    });
  });

  describe('web URL', () => {
    it('extracts ID from open.spotify.com/playlist/... URL', () => {
      const id = '37i9dQZF1DXcBWIGoYBM5M';
      expect(parsePlaylistUrl(`https://open.spotify.com/playlist/${id}`)).toBe(
        id,
      );
    });

    it('extracts ID from URL without https', () => {
      const id = '37i9dQZF1DXcBWIGoYBM5M';
      expect(parsePlaylistUrl(`open.spotify.com/playlist/${id}`)).toBe(id);
    });

    it('extracts ID when URL has query params', () => {
      const id = '37i9dQZF1DXcBWIGoYBM5M';
      expect(
        parsePlaylistUrl(`https://open.spotify.com/playlist/${id}?si=abc123`),
      ).toBe(id);
    });
  });

  describe('whitespace', () => {
    it('trims leading and trailing whitespace', () => {
      const id = '37i9dQZF1DXcBWIGoYBM5M';
      expect(parsePlaylistUrl(`  ${id}  `)).toBe(id);
      expect(
        parsePlaylistUrl(`  https://open.spotify.com/playlist/${id}  `),
      ).toBe(id);
    });
  });

  describe('invalid input', () => {
    it('returns null for empty string', () => {
      expect(parsePlaylistUrl('')).toBeNull();
    });

    it('returns null for whitespace only', () => {
      expect(parsePlaylistUrl('   ')).toBeNull();
    });

    it('returns null for ID that is too short', () => {
      expect(parsePlaylistUrl('37i9dQZF1DXcBWIGo')).toBeNull();
    });

    it('returns null for ID that is too long', () => {
      expect(parsePlaylistUrl('37i9dQZF1DXcBWIGoYBM5Mxx')).toBeNull();
    });

    it('returns null for invalid URL format', () => {
      expect(
        parsePlaylistUrl('https://spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'),
      ).toBeNull();
      expect(
        parsePlaylistUrl(
          'https://open.spotify.com/album/37i9dQZF1DXcBWIGoYBM5M',
        ),
      ).toBeNull();
    });

    it('returns null for non-Spotify URL', () => {
      expect(
        parsePlaylistUrl('https://example.com/playlist/37i9dQZF1DXcBWIGoYBM5M'),
      ).toBeNull();
    });
  });
});
