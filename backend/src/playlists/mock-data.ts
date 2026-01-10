import { PlaylistSummaryDto } from "./dto/playlist.dto";
import { PlaylistDetailsDto } from "./dto/playlist-details.dto";

export const MOCK_PLAYLISTS: PlaylistSummaryDto[] = [
  {
    id: "mock_playlist_1",
    name: "Chill Vibes",
    description: "Relaxing tracks to unwind",
    images: [
      {
        url: "https://picsum.photos/seed/playlist1/300/300",
        height: 300,
        width: 300,
      },
    ],
    owner: { id: "dev_user_123", displayName: "Dev User" },
    totalTracks: 25,
    public: true,
    externalUrl: "https://open.spotify.com/playlist/mock_playlist_1",
  },
  {
    id: "mock_playlist_2",
    name: "Workout Energy",
    description: "High energy beats for your workout",
    images: [
      {
        url: "https://picsum.photos/seed/playlist2/300/300",
        height: 300,
        width: 300,
      },
    ],
    owner: { id: "dev_user_123", displayName: "Dev User" },
    totalTracks: 40,
    public: true,
    externalUrl: "https://open.spotify.com/playlist/mock_playlist_2",
  },
  {
    id: "mock_playlist_3",
    name: "Late Night Coding",
    description: "Focus music for coding sessions",
    images: [
      {
        url: "https://picsum.photos/seed/playlist3/300/300",
        height: 300,
        width: 300,
      },
    ],
    owner: { id: "dev_user_123", displayName: "Dev User" },
    totalTracks: 60,
    public: false,
    externalUrl: "https://open.spotify.com/playlist/mock_playlist_3",
  },
  {
    id: "mock_playlist_4",
    name: "Road Trip Anthems",
    description: "Sing-along hits for the road",
    images: [
      {
        url: "https://picsum.photos/seed/playlist4/300/300",
        height: 300,
        width: 300,
      },
    ],
    owner: { id: "dev_user_123", displayName: "Dev User" },
    totalTracks: 35,
    public: true,
    externalUrl: "https://open.spotify.com/playlist/mock_playlist_4",
  },
];

export const MOCK_PLAYLIST_DETAILS: PlaylistDetailsDto = {
  id: "mock_playlist_1",
  name: "Chill Vibes",
  description: "Relaxing tracks to unwind",
  images: [
    {
      url: "https://picsum.photos/seed/playlist1/300/300",
      height: 300,
      width: 300,
    },
  ],
  owner: { id: "dev_user_123", displayName: "Dev User" },
  totalTracks: 5,
  public: true,
  externalUrl: "https://open.spotify.com/playlist/mock_playlist_1",
  tracks: [
    {
      addedAt: "2024-01-15T10:30:00Z",
      track: {
        id: "mock_track_1",
        name: "Midnight Dreams",
        artists: [{ id: "artist_1", name: "Luna Nova" }],
        album: {
          id: "album_1",
          name: "Starlight Sessions",
          images: [
            {
              url: "https://picsum.photos/seed/album1/300/300",
              height: 300,
              width: 300,
            },
          ],
        },
        durationMs: 234000,
        externalUrl: "https://open.spotify.com/track/mock_track_1",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        isPlayable: true,
      },
    },
    {
      addedAt: "2024-01-14T15:20:00Z",
      track: {
        id: "mock_track_2",
        name: "Ocean Waves",
        artists: [{ id: "artist_2", name: "Azure Sky" }],
        album: {
          id: "album_2",
          name: "Coastal",
          images: [
            {
              url: "https://picsum.photos/seed/album2/300/300",
              height: 300,
              width: 300,
            },
          ],
        },
        durationMs: 198000,
        externalUrl: "https://open.spotify.com/track/mock_track_2",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        isPlayable: true,
      },
    },
    {
      addedAt: "2024-01-13T09:00:00Z",
      track: {
        id: "mock_track_3",
        name: "Golden Hour",
        artists: [
          { id: "artist_3", name: "Sunset Collective" },
          { id: "artist_4", name: "Mellow Beats" },
        ],
        album: {
          id: "album_3",
          name: "Evening Glow",
          images: [
            {
              url: "https://picsum.photos/seed/album3/300/300",
              height: 300,
              width: 300,
            },
          ],
        },
        durationMs: 267000,
        externalUrl: "https://open.spotify.com/track/mock_track_3",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        isPlayable: true,
      },
    },
    {
      addedAt: "2024-01-12T20:45:00Z",
      track: {
        id: "mock_track_4",
        name: "Floating",
        artists: [{ id: "artist_5", name: "Dream State" }],
        album: {
          id: "album_4",
          name: "Weightless",
          images: [
            {
              url: "https://picsum.photos/seed/album4/300/300",
              height: 300,
              width: 300,
            },
          ],
        },
        durationMs: 312000,
        externalUrl: "https://open.spotify.com/track/mock_track_4",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        isPlayable: true,
      },
    },
    {
      addedAt: "2024-01-11T14:30:00Z",
      track: {
        id: "mock_track_5",
        name: "Soft Rain",
        artists: [{ id: "artist_6", name: "Nature Sounds" }],
        album: {
          id: "album_5",
          name: "Elements",
          images: [
            {
              url: "https://picsum.photos/seed/album5/300/300",
              height: 300,
              width: 300,
            },
          ],
        },
        durationMs: 245000,
        externalUrl: "https://open.spotify.com/track/mock_track_5",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        isPlayable: true,
      },
    },
  ],
};
