-- CreateTable
CREATE TABLE "daily_tracks" (
    "date" DATE NOT NULL,
    "track_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_tracks_pkey" PRIMARY KEY ("date")
);

-- CreateIndex
CREATE INDEX "daily_tracks_track_id_idx" ON "daily_tracks"("track_id");

-- AddForeignKey
ALTER TABLE "daily_tracks" ADD CONSTRAINT "daily_tracks_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
