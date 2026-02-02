/*
  Warnings:

  - You are about to drop the column `playlist_ids` on the `daily_stats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "daily_stats" DROP COLUMN "playlist_ids";
