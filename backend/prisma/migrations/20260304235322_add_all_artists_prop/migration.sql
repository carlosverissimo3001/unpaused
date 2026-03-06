-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "all_artists" TEXT[] DEFAULT ARRAY[]::TEXT[];
