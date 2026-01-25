/*
  Warnings:

  - The `status` column on the `game_sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('PLAYING', 'WON', 'LOST');

-- AlterTable
ALTER TABLE "game_sessions" DROP COLUMN "status",
ADD COLUMN     "status" "GameStatus" NOT NULL DEFAULT 'PLAYING';

-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "album_image_url" TEXT,
    "preview_url" TEXT,
    "last_scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);
