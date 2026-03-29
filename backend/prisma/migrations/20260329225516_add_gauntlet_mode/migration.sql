-- CreateEnum
CREATE TYPE "GauntletRunStatus" AS ENUM ('PLAYING', 'ENDED');

-- CreateEnum
CREATE TYPE "GauntletEndReason" AS ENUM ('WRONG_GUESS', 'SKIP', 'QUIT');

-- AlterEnum
ALTER TYPE "GameMode" ADD VALUE 'GAUNTLET';

-- CreateTable
CREATE TABLE "gauntlet_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" "GauntletRunStatus" NOT NULL DEFAULT 'PLAYING',
    "end_reason" "GauntletEndReason",
    "track_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "current_track_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "gauntlet_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gauntlet_runs_user_id_score_idx" ON "gauntlet_runs"("user_id", "score");

-- CreateIndex
CREATE INDEX "gauntlet_runs_user_id_created_at_idx" ON "gauntlet_runs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "gauntlet_runs_created_at_idx" ON "gauntlet_runs"("created_at");

-- AddForeignKey
ALTER TABLE "gauntlet_runs" ADD CONSTRAINT "gauntlet_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gauntlet_runs" ADD CONSTRAINT "gauntlet_runs_current_track_id_fkey" FOREIGN KEY ("current_track_id") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
