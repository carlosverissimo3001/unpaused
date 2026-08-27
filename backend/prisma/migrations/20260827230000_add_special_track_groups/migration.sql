ALTER TYPE "TrackGroupType" ADD VALUE 'SPECIAL';

ALTER TABLE "pool_tracks" ADD COLUMN "special" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "pool_tracks_special_idx" ON "pool_tracks"("special");
