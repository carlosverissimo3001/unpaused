-- Chart metadata (cover art, name, description) for the public demo picker.
-- Written by the same daily refresh as demo_tracks so the covers stay current.
CREATE TABLE "demo_playlists" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "description" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_playlists_pkey" PRIMARY KEY ("slug")
);
