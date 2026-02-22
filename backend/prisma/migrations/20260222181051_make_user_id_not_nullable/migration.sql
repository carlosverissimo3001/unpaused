/*
  Warnings:

  - Made the column `user_id` on table `game_sessions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "game_sessions" ALTER COLUMN "user_id" SET NOT NULL;
