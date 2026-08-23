import { catalogueTrackUrl } from './utils';

describe('catalogueTrackUrl', () => {
  it('links a Spotify-sourced track to Spotify', () => {
    expect(catalogueTrackUrl('0VjIjW4GlUZAMYd2vXMi3b')).toBe(
      'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    );
  });

  it('links a pool track to Deezer, without the namespace prefix', () => {
    expect(catalogueTrackUrl('dz:908604612')).toBe(
      'https://www.deezer.com/track/908604612',
    );
  });

  it('never puts a pool id behind a Spotify URL', () => {
    // The reveal card used to build this by hand, producing a link that
    // rendered normally and 404'd on click.
    expect(catalogueTrackUrl('dz:908604612')).not.toContain('spotify');
  });
});
