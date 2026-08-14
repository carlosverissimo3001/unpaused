-- CreateTable
CREATE TABLE "demo_tracks" (
    "id" TEXT NOT NULL,
    "playlist_slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "album_image_url" TEXT NOT NULL,
    "preview_url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demo_tracks_playlist_slug_idx" ON "demo_tracks"("playlist_slug");
