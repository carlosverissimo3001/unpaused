import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { DemoPlaylistService } from './demo-playlist.service';
import { AppLoggerService } from '../../logger/logger.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const PLAYLIST_ID = '37i9dQZEVXbKyJS56d1pgi';

/**
 * This service parses someone else's undocumented HTML, so the cases worth
 * testing are the ones where that HTML is not what we expect.
 *
 * Fixtures are built here rather than captured from Spotify: a saved page is
 * 20KB of third-party markup, and it would not detect a shape change anyway,
 * since it freezes the same assumption the parser makes.
 */
const encode = (state: unknown) =>
  `<script id="initialState">${Buffer.from(
    JSON.stringify(state),
    'utf-8',
  ).toString('base64')}</script>`;

const item = (over: Record<string, unknown> = {}) => ({
  itemV2: {
    data: {
      uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b',
      name: 'Carnívoro',
      artists: {
        items: [{ profile: { name: 'Chico da Tina' } }],
      },
      albumOfTrack: {
        coverArt: {
          sources: [
            { url: 'https://i.scdn.co/image/small', width: 64 },
            { url: 'https://i.scdn.co/image/large', width: 640 },
          ],
        },
      },
      previews: {
        audioPreviews: { items: [{ url: 'https://p.scdn.co/mp3-preview/a' }] },
      },
      ...over,
    },
  },
});

const page = (items: unknown[]) =>
  encode({
    entities: {
      items: {
        [`spotify:playlist:${PLAYLIST_ID}`]: {
          name: 'Top 50 - Portugal',
          description: 'Your daily update of the most played tracks right now.',
          images: {
            items: [{ sources: [{ url: 'https://charts-images/pt.jpg' }] }],
          },
          content: { items },
        },
      },
    },
  });

describe('DemoPlaylistService', () => {
  let service: DemoPlaylistService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemoPlaylistService,
        {
          provide: AppLoggerService,
          useValue: {
            child: () => ({
              log: jest.fn(),
              warn: jest.fn(),
              error: jest.fn(),
              debug: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get(DemoPlaylistService);
  });

  it('extracts id, name, artists and the largest cover art', async () => {
    mockedAxios.get.mockResolvedValue({ data: page([item()]) });

    const { tracks } = await service.fetchPlaylist(PLAYLIST_ID);
    const [track] = tracks;

    expect(track).toEqual({
      id: '0VjIjW4GlUZAMYd2vXMi3b',
      name: 'Carnívoro',
      artistName: 'Chico da Tina',
      albumImageUrl: 'https://i.scdn.co/image/large',
      previewUrl: 'https://p.scdn.co/mp3-preview/a',
    });
  });

  it('reads the chart name, description and cover art', async () => {
    mockedAxios.get.mockResolvedValue({ data: page([item()]) });

    const playlist = await service.fetchPlaylist(PLAYLIST_ID);

    expect(playlist.name).toBe('Top 50 - Portugal');
    expect(playlist.imageUrl).toBe('https://charts-images/pt.jpg');
    expect(playlist.description).toContain('most played');
  });

  it('survives the base64 round trip with non-ASCII titles', async () => {
    // The Portuguese and Spanish charts are full of accented titles; decoding
    // the blob as anything but UTF-8 mangles them silently.
    mockedAxios.get.mockResolvedValue({ data: page([item()]) });

    const { tracks } = await service.fetchPlaylist(PLAYLIST_ID);
    const [track] = tracks;

    expect(track.name).toBe('Carnívoro');
    expect(track.name).not.toContain('�');
  });

  it('joins every credited artist', async () => {
    mockedAxios.get.mockResolvedValue({
      data: page([
        item({
          artists: {
            items: [
              { profile: { name: 'Shakira' } },
              { profile: { name: 'Burna Boy' } },
            ],
          },
        }),
      ]),
    });

    const { tracks } = await service.fetchPlaylist(PLAYLIST_ID);

    expect(tracks[0].artistName).toBe('Shakira, Burna Boy');
  });

  it('drops tracks with no preview, which real charts contain', async () => {
    mockedAxios.get.mockResolvedValue({
      data: page([
        item(),
        item({ previews: { audioPreviews: { items: [] } } }),
        item({ previews: undefined }),
      ]),
    });

    const { tracks } = await service.fetchPlaylist(PLAYLIST_ID);
    expect(tracks).toHaveLength(1);
  });

  it('skips malformed items instead of failing the whole playlist', async () => {
    mockedAxios.get.mockResolvedValue({
      data: page([
        { itemV2: { data: { uri: 'spotify:track:abc' } } }, // no name
        { itemV2: {} },
        {},
      ]),
    });

    await expect(service.fetchPlaylist(PLAYLIST_ID)).resolves.toMatchObject({
      tracks: [],
    });
  });

  it('throws when the embedded state is missing', async () => {
    mockedAxios.get.mockResolvedValue({
      data: '<html><body>nope</body></html>',
    });

    await expect(service.fetchPlaylist(PLAYLIST_ID)).rejects.toThrow(
      'initialState script not found',
    );
  });

  it('throws when the blob is not valid JSON', async () => {
    mockedAxios.get.mockResolvedValue({
      data: '<script id="initialState">bm90LWpzb24=</script>',
    });

    await expect(service.fetchPlaylist(PLAYLIST_ID)).rejects.toThrow();
  });

  it('returns nothing when the JSON shape changes, rather than throwing', async () => {
    // The likeliest failure: valid page, valid JSON, different structure. The
    // caller keeps the previous set on an empty result, so degrading beats
    // throwing here.
    mockedAxios.get.mockResolvedValue({
      data: encode({ entities: { items: {} } }),
    });

    await expect(service.fetchPlaylist(PLAYLIST_ID)).resolves.toMatchObject({
      tracks: [],
    });
  });

  it('propagates a network failure so the caller keeps the previous set', async () => {
    mockedAxios.get.mockRejectedValue(new Error('ETIMEDOUT'));

    await expect(service.fetchPlaylist(PLAYLIST_ID)).rejects.toThrow('ETIMEDOUT');
  });
});
