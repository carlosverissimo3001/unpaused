-- Not unique: one recording appears under several Spotify ids (regional
-- releases, remasters), so ISRC is a matching key, not an identity.
ALTER TABLE "tracks" ADD COLUMN "isrc" TEXT;

CREATE INDEX "tracks_isrc_idx" ON "tracks"("isrc");
