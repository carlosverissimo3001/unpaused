CREATE TYPE "GauntletSource" AS ENUM ('PLAYLIST', 'CURATED');

-- Every run so far was played against a playlist. The default backfills them
-- and is then dropped, so a new run has to say what it was played against.
ALTER TABLE "gauntlet_runs" ADD COLUMN "source" "GauntletSource" NOT NULL DEFAULT 'PLAYLIST';
ALTER TABLE "gauntlet_runs" ALTER COLUMN "source" DROP DEFAULT;

-- Null on every existing row: we know they were playlist runs, not which playlist.
ALTER TABLE "gauntlet_runs" ADD COLUMN "source_id" TEXT;

-- A run still marked PLAYING predates the source column and has no playlist to
-- draw its next track from. Close it at the score it reached, as a quit does.
UPDATE "gauntlet_runs"
SET "status" = 'ENDED', "end_reason" = 'QUIT', "completed_at" = NOW()
WHERE "status" = 'PLAYING' AND "source_id" IS NULL;
