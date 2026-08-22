-- Deezer preview URLs are signed and expire in ~15 minutes, so the URL alone
-- can't be persisted. The ref identifies the source well enough to re-mint one.
ALTER TABLE "tracks" ADD COLUMN "preview_ref" TEXT;
