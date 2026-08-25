-- CreateEnum
CREATE TYPE "TrackSource" AS ENUM ('POOL', 'LIBRARIES');

-- AlterTable
ALTER TABLE "multiplayer_rooms" ADD COLUMN     "track_source" "TrackSource" NOT NULL DEFAULT 'POOL';
