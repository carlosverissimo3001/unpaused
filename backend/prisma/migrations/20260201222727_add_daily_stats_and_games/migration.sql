-- CreateTable
CREATE TABLE "daily_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "best_streak" INTEGER NOT NULL DEFAULT 0,
    "last_played_at" TIMESTAMP(3),
    "total_games" INTEGER NOT NULL DEFAULT 0,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "score_distribution" INTEGER[] DEFAULT ARRAY[0, 0, 0, 0, 0, 0]::INTEGER[],
    "playlist_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_games" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "playlist_id" TEXT NOT NULL,
    "playlist_name" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "track_name" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "album_image_url" TEXT,
    "preview_url" TEXT,
    "current_round" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'playing',
    "guesses" JSONB NOT NULL DEFAULT '[]',
    "completed_at" TIMESTAMP(3),
    "score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_stats_user_id_key" ON "daily_stats"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_games_user_id_date_key" ON "daily_games"("user_id", "date");

-- AddForeignKey
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_games" ADD CONSTRAINT "daily_games_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
