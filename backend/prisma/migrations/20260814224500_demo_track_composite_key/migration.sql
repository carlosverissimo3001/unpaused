-- A Spotify track id is unique per playlist, not globally: the chart playlists
-- overlap heavily (Top 50 Global shares most of its entries with the country
-- charts). With `id` alone as the primary key, refreshing one playlist left
-- shared tracks owned by whichever chart was written first, and every later
-- chart silently dropped them via skipDuplicates.
ALTER TABLE "demo_tracks" DROP CONSTRAINT "demo_tracks_pkey";

ALTER TABLE "demo_tracks" ADD CONSTRAINT "demo_tracks_pkey" PRIMARY KEY ("playlist_slug", "id");
