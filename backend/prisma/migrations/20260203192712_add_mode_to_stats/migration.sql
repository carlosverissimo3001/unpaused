-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('DAILY', 'PLAYLIST');

-- AlterTable
ALTER TABLE "stats" ADD COLUMN     "mode" "GameMode" NOT NULL DEFAULT 'PLAYLIST';
