-- Candidacy for guest rounds. Thin on purpose: track data stays in `tracks`,
-- this only answers whether a track may be picked and how well known it is.
CREATE TABLE "pool_tracks" (
    "id" TEXT NOT NULL,
    "isrc" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "fame" INTEGER NOT NULL,
    "refreshed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pool_tracks_pkey" PRIMARY KEY ("id")
);

-- Unique here, unlike on tracks: this is what keeps one song out of the pool
-- twice when it charts either side of a new year.
CREATE UNIQUE INDEX "pool_tracks_isrc_key" ON "pool_tracks"("isrc");

CREATE INDEX "pool_tracks_fame_idx" ON "pool_tracks"("fame");

CREATE INDEX "pool_tracks_year_idx" ON "pool_tracks"("year");
