import { Test, TestingModule } from '@nestjs/testing';
import { TrackPoolService } from './track-pool.service';
import { PlaylistService } from '../../playlist/services/playlist.service';
import { TrackService } from '../../track/services/track.service';
import { SessionService } from '../../auth/services/session.service';
import { AppLoggerService } from '../../logger/logger.service';
import { PrismaService } from '../../prisma/prisma.service';

function makeTrack(id: string, name = `Track ${id}`) {
  return {
    id,
    name,
    normalizedName: name.toLowerCase(),
    artists: ['Artist'],
    albumName: 'Album',
    albumId: 'album-1',
    imageUrl: 'https://img.test/1.jpg',
    durationMs: 200000,
    externalUrl: `https://open.spotify.com/track/${id}`,
    previewUrl: `https://preview.test/${id}.mp3`,
    isPlayable: true,
    primaryArtist: 'Artist',
    releaseYear: 2024,
    allArtists: ['Artist'],
  };
}

describe('TrackPoolService', () => {
  let service: TrackPoolService;
  let playlistService: jest.Mocked<PlaylistService>;
  let trackService: jest.Mocked<TrackService>;
  let sessionService: jest.Mocked<SessionService>;
  let prisma: { user: { findMany: jest.Mock } };

  beforeEach(async () => {
    playlistService = {
      getLikedSongsMetadata: jest.fn(),
      getLikedTracksBatch: jest.fn(),
    } as any;

    trackService = {
      getTrackWithPreview: jest.fn(),
    } as any;

    sessionService = {
      getSessionIdBySpotifyUserId: jest.fn(),
    } as any;

    prisma = {
      user: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackPoolService,
        { provide: PlaylistService, useValue: playlistService },
        { provide: TrackService, useValue: trackService },
        { provide: SessionService, useValue: sessionService },
        { provide: PrismaService, useValue: prisma },
        { provide: AppLoggerService, useValue: new AppLoggerService() },
      ],
    }).compile();

    service = module.get(TrackPoolService);
  });

  it('should select tracks weighted by likedByCount', async () => {
    // 2 players, both like track-A, only player1 likes track-B
    const trackA = makeTrack('track-A');
    const trackB = makeTrack('track-B');

    prisma.user.findMany
      .mockResolvedValueOnce([{ id: 'user-1', spotifyUserId: 'sp-1' }, { id: 'user-2', spotifyUserId: 'sp-2' }])

    sessionService.getSessionIdBySpotifyUserId
      .mockResolvedValueOnce('sess-1')
      .mockResolvedValueOnce('sess-2');

    playlistService.getLikedSongsMetadata.mockResolvedValue({
      totalTracks: 100,
    } as any);

    // Player 1 has both tracks, Player 2 has only track-A
    playlistService.getLikedTracksBatch
      .mockResolvedValueOnce([trackA, trackB])
      .mockResolvedValueOnce([trackA, trackB])
      .mockResolvedValueOnce([trackA, trackB])
      .mockResolvedValueOnce([trackA])
      .mockResolvedValueOnce([trackA])
      .mockResolvedValueOnce([trackA]);

    trackService.getTrackWithPreview.mockImplementation(
      async (id: string) => ({
        id,
        previewUrl: `https://preview/${id}.mp3`,
        name: `Track ${id}`,
        artistName: 'Artist',
        albumImageUrl: undefined,
        albumName: undefined,
        albumUrl: undefined,
        releaseYear: undefined,
        metadata: {},
        lastScrapedAt: new Date(),
        createdAt: new Date(),
      }) as any,
    );

    const result = await service.selectTracksForRoom(
      ['user-1', 'user-2'],
      2,
    );

    expect(result).toHaveLength(2);
    expect(result).toContain('track-A');
    expect(result).toContain('track-B');
  });

  it('should skip players without active sessions', async () => {
    const track = makeTrack('track-1');

    prisma.user.findMany
      .mockResolvedValueOnce([{ id: 'user-1', spotifyUserId: 'sp-1' }, { id: 'user-2', spotifyUserId: 'sp-2' }]);

    sessionService.getSessionIdBySpotifyUserId
      .mockResolvedValueOnce('sess-1')
      .mockResolvedValueOnce(null); // player 2 has no session

    playlistService.getLikedSongsMetadata.mockResolvedValue({
      totalTracks: 50,
    } as any);

    playlistService.getLikedTracksBatch.mockResolvedValue([track]);

    trackService.getTrackWithPreview.mockResolvedValue({
      id: track.id,
      previewUrl: 'https://preview/1.mp3',
      name: track.name,
      artistName: 'Artist',
      albumImageUrl: undefined,
      albumName: undefined,
      albumUrl: undefined,
      releaseYear: undefined,
      metadata: {},
      lastScrapedAt: new Date(),
      createdAt: new Date(),
    } as any);

    const result = await service.selectTracksForRoom(
      ['user-1', 'user-2'],
      1,
    );

    expect(result).toHaveLength(1);
    // Only player 1's session was used
    expect(sessionService.getSessionIdBySpotifyUserId).toHaveBeenCalledTimes(2);
  });

  it('should throw when no active sessions exist', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'user-1', spotifyUserId: 'sp-1' }]);
    sessionService.getSessionIdBySpotifyUserId.mockResolvedValue(null);

    await expect(
      service.selectTracksForRoom(['user-1'], 3),
    ).rejects.toThrow('No active sessions found');
  });

  it('should throw when no tracks have valid previews', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'user-1', spotifyUserId: 'sp-1' }]);
    sessionService.getSessionIdBySpotifyUserId.mockResolvedValue('sess-1');
    playlistService.getLikedSongsMetadata.mockResolvedValue({
      totalTracks: 10,
    } as any);

    const trackNoPreview = makeTrack('no-preview');
    playlistService.getLikedTracksBatch.mockResolvedValue([trackNoPreview]);

    // Preview resolution fails
    trackService.getTrackWithPreview.mockResolvedValue({
      id: 'no-preview',
      previewUrl: undefined,
      name: 'No Preview',
      artistName: 'Artist',
      albumImageUrl: undefined,
      albumName: undefined,
      albumUrl: undefined,
      releaseYear: undefined,
      metadata: {},
      lastScrapedAt: new Date(),
      createdAt: new Date(),
    } as any);

    await expect(
      service.selectTracksForRoom(['user-1'], 3),
    ).rejects.toThrow('Could not find any tracks with valid preview URLs');
  });

  it('should handle player with empty liked songs gracefully', async () => {
    const track = makeTrack('track-1');

    prisma.user.findMany.mockResolvedValue([
      { id: 'user-1', spotifyUserId: 'sp-1' },
      { id: 'user-2', spotifyUserId: 'sp-2' },
    ]);

    sessionService.getSessionIdBySpotifyUserId
      .mockResolvedValueOnce('sess-1')
      .mockResolvedValueOnce('sess-2');

    // Player 1 has songs, player 2 has none
    playlistService.getLikedSongsMetadata
      .mockResolvedValueOnce({ totalTracks: 50 } as any)
      .mockResolvedValueOnce({ totalTracks: 0 } as any);

    playlistService.getLikedTracksBatch.mockResolvedValue([track]);

    trackService.getTrackWithPreview.mockResolvedValue({
      id: track.id,
      previewUrl: 'https://preview/1.mp3',
      name: track.name,
      artistName: 'Artist',
      albumImageUrl: undefined,
      albumName: undefined,
      albumUrl: undefined,
      releaseYear: undefined,
      metadata: {},
      lastScrapedAt: new Date(),
      createdAt: new Date(),
    } as any);

    const result = await service.selectTracksForRoom(
      ['user-1', 'user-2'],
      1,
    );

    expect(result).toHaveLength(1);
  });

  it('should return fewer tracks when pool is too small', async () => {
    const track = makeTrack('only-track');

    prisma.user.findMany.mockResolvedValue([{ id: 'user-1', spotifyUserId: 'sp-1' }]);
    sessionService.getSessionIdBySpotifyUserId.mockResolvedValue('sess-1');
    playlistService.getLikedSongsMetadata.mockResolvedValue({
      totalTracks: 1,
    } as any);
    playlistService.getLikedTracksBatch.mockResolvedValue([track]);

    trackService.getTrackWithPreview.mockResolvedValue({
      id: track.id,
      previewUrl: 'https://preview/only.mp3',
      name: track.name,
      artistName: 'Artist',
      albumImageUrl: undefined,
      albumName: undefined,
      albumUrl: undefined,
      releaseYear: undefined,
      metadata: {},
      lastScrapedAt: new Date(),
      createdAt: new Date(),
    } as any);

    // Asking for 5 but only 1 track available
    const result = await service.selectTracksForRoom(['user-1'], 5);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe('only-track');
  });
});
